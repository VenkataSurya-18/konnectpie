
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  role: "WORKER" | "PROVIDER" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthUser;

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const requireRole =
  (...roles: AuthUser["role"][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden" });
  };
