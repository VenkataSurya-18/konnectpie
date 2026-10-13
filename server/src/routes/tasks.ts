import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const r = Router();

const publicSelect = {
  id: true, title: true, description: true, category: true,
  reward: true, deadline: true, status: true, providerId: true,
};

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  instructions: z.string().min(10),
  category: z.string(),
  reward: z.number().int().min(1000),          // paise (₹10 min)
  deadline: z.coerce.date().refine(d => d > new Date(), "Deadline must be in future"),
});

// Provider creates task (starts as PENDING_PAYMENT)
r.post("/", requireAuth, requireRole("PROVIDER"), async (req, res) => {
  const p = createSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const task = await prisma.task.create({
    data: { ...p.data, providerId: req.user!.id },
    select: publicSelect,
  });
  res.status(201).json(task);
});

// Anyone logged in: list available tasks
r.get("/", requireAuth, async (_req, res) => {
  const tasks = await prisma.task.findMany({
    where: { status: "PUBLISHED", deadline: { gt: new Date() } },
    select: publicSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks);
});

// Private workspace: ONLY assigned worker, provider, or admin
r.get("/:id/workspace", requireAuth, async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.sendStatus(404);
  const u = req.user!;
  const allowed = u.role === "ADMIN" || task.providerId === u.id || task.assignedToId === u.id;
  if (!allowed) return res.status(403).json({ error: "Not authorized" });
  res.json(task);   // includes instructions
});

export default r;