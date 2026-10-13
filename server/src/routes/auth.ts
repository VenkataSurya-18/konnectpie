import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma";

const r = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["WORKER", "PROVIDER"]),   // never allow ADMIN from signup
});

const sign = (u: { id: string; role: string }) =>
  jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };

r.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const { name, email, password, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } }))
    return res.status(409).json({ error: "Email already used" });

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 12) },
  });
  res.cookie("token", sign(user), cookieOpts).json({ id: user.id, name, role });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.banned || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: "Invalid credentials" });
  res.cookie("token", sign(user), cookieOpts).json({ id: user.id, name: user.name, role: user.role });
});

r.post("/logout", (_req, res) => res.clearCookie("token").json({ ok: true }));

export default r;