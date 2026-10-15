
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const r = Router();

const publicSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  reward: true,
  deadline: true,
  status: true,
  providerId: true,
};

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  instructions: z.string().min(10),
  category: z.string().min(1),
  reward: z.number().int().min(1000),
  deadline: z.coerce
    .date()
    .refine((d) => d > new Date(), "Deadline must be in future"),
});

// Provider creates a published task
r.post("/", requireAuth, requireRole("PROVIDER"), async (req, res) => {
  try {
    const p = createSchema.safeParse(req.body);

    if (!p.success) {
      return res.status(400).json(p.error.flatten());
    }

    const task = await prisma.task.create({
      data: {
        ...p.data,
        providerId: req.user!.id,
        status: "PUBLISHED",
      },
      select: publicSelect,
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ error: "Failed to create task" });
  }
});

// List published tasks that have not passed their deadline
r.get("/", requireAuth, async (_req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: "PUBLISHED",
        deadline: { gt: new Date() },
        assignedToId: null,
      },
      select: publicSelect,
      orderBy: { createdAt: "desc" },
    });

    return res.json(tasks);
  } catch (error) {
    console.error("List tasks error:", error);
    return res.status(500).json({ error: "Failed to load tasks" });
  }
});

// Worker claims an available task
r.post(
  "/:id/claim",
  requireAuth,
  requireRole("WORKER"),
  async (req, res) => {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: req.params.id,
          status: "PUBLISHED",
          deadline: { gt: new Date() },
          assignedToId: null,
        },
      });

      if (!task) {
        return res.status(404).json({
          error: "Task unavailable or already claimed",
        });
      }

      // Atomic update prevents two workers claiming the same task
      const result = await prisma.task.updateMany({
        where: {
          id: task.id,
          status: "PUBLISHED",
          assignedToId: null,
          deadline: { gt: new Date() },
        },
        data: {
          assignedToId: req.user!.id,
          status: "IN_PROGRESS",
        },
      });

      if (result.count === 0) {
        return res.status(409).json({
          error: "Another worker already claimed this task",
        });
      }

      return res.json({ message: "Task claimed successfully" });
    } catch (error) {
      console.error("Claim task error:", error);
      return res.status(500).json({ error: "Failed to claim task" });
    }
  }
);

// Private workspace: assigned worker, provider, or admin only
r.get("/:id/workspace", requireAuth, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.sendStatus(404);
    }

    const user = req.user!;

    const allowed =
      user.role === "ADMIN" ||
      task.providerId === user.id ||
      task.assignedToId === user.id;

    if (!allowed) {
      return res.status(403).json({ error: "Not authorized" });
    }

    return res.json(task);
  } catch (error) {
    console.error("Workspace error:", error);
    return res.status(500).json({ error: "Failed to load workspace" });
  }
});

export default r;
