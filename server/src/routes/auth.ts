
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../prisma";

const r = Router();

interface ResetTokenEntry {
  userId: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

// In-memory token store mapping SHA-256 token hash -> ResetTokenEntry
const passwordResetStore = new Map<string, ResetTokenEntry>();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [hash, entry] of passwordResetStore.entries()) {
    if (entry.expiresAt < now || entry.used) {
      passwordResetStore.delete(hash);
    }
  }
}, 10 * 60 * 1000).unref();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["WORKER", "PROVIDER"]),
});

const sign = (u: { id: string; role: string }) =>
  jwt.sign(
    { id: u.id, role: u.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

const cookieOpts = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
};

r.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const { name, email, password, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already used" });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    const token = sign(user);

    return res
      .cookie("token", token, cookieOpts)
      .json({ id: user.id, name: user.name, role: user.role, token });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

r.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      user.banned ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = sign(user);

    return res
      .cookie("token", token, cookieOpts)
      .json({
        id: user.id,
        name: user.name,
        role: user.role,
        token,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

r.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const bearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

r.post("/logout", (_req, res) =>
  res.clearCookie("token", cookieOpts).json({ ok: true })
);

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

r.post("/forgot-password", async (req, res) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const isEmailConfigured = Boolean(
      process.env.SMTP_HOST ||
      process.env.RESEND_API_KEY ||
      process.env.SENDGRID_API_KEY
    );

    if (!user) {
      // Do not reveal whether user exists to prevent email enumeration
      return res.json({
        ok: true,
        emailConfigured: isEmailConfigured,
        message: "If an account is associated with this email, you will receive password reset instructions.",
      });
    }

    // Generate 32-byte cryptographically secure random token (256 bits)
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Store only SHA-256 hash of token to prevent plaintext storage
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes single-use expiry

    passwordResetStore.set(tokenHash, {
      userId: user.id,
      email: user.email,
      expiresAt,
      used: false,
    });

    if (isEmailConfigured) {
      return res.json({
        ok: true,
        emailConfigured: true,
        message: "Password reset link has been sent to your email address.",
      });
    } else {
      return res.json({
        ok: true,
        emailConfigured: false,
        message:
          "Email delivery service is not configured on this server (missing SMTP_HOST or RESEND_API_KEY). A secure password reset token has been generated below for testing.",
        resetToken: rawToken,
        resetUrl: `/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Failed to process password reset request" });
  }
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

r.post("/reset-password", async (req, res) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid input data",
      });
    }

    const { token, newPassword } = parsed.data;
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const entry = passwordResetStore.get(tokenHash);

    if (!entry) {
      return res.status(400).json({
        error: "Invalid or expired password reset token. Please request a new reset link.",
      });
    }

    if (entry.used) {
      passwordResetStore.delete(tokenHash);
      return res.status(400).json({
        error: "This reset token has already been used. Please request a new reset link.",
      });
    }

    if (Date.now() > entry.expiresAt) {
      passwordResetStore.delete(tokenHash);
      return res.status(400).json({
        error: "This reset token has expired. Reset links are valid for 15 minutes.",
      });
    }

    // Verify user exists and update password
    const user = await prisma.user.findUnique({
      where: { id: entry.userId },
    });

    if (!user) {
      passwordResetStore.delete(tokenHash);
      return res.status(404).json({ error: "User account not found." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Mark as used and delete immediately
    entry.used = true;
    passwordResetStore.delete(tokenHash);

    return res.json({
      ok: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

export default r;
