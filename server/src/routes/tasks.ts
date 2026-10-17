
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
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
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

// List available tasks
r.get("/", requireAuth, async (_req, res) => {
  try {
    const now = new Date();
    const availableFilter = {
      status: "PUBLISHED" as const,
      assignedToId: null,
      OR: [
        { deadline: null },
        { deadline: { gt: now } },
      ],
    };

    const tasks = await prisma.task.findMany({
      where: availableFilter,
      select: publicSelect,
      orderBy: { createdAt: "desc" },
    });

    return res.json(tasks);
  } catch (error) {
    console.error("List tasks error:", error);
    return res.status(500).json({ error: "Failed to load tasks" });
  }
});

// List user-specific tasks (claimed tasks for worker, created tasks for provider)
r.get("/my-tasks", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const isWorker =
      user.role === "WORKER" ||
      (user.role as string)?.toUpperCase() === "WORKER" ||
      !user.role;

    if (isWorker) {
      const myClaimedTasks = await prisma.task.findMany({
        where: {
          OR: [
            { assignedToId: user.id },
            { claims: { some: { userId: user.id } } },
          ],
        },
        include: {
          submissions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      return res.json(myClaimedTasks);
    } else {
      const myCreatedTasks = await prisma.task.findMany({
        where: {
          providerId: user.id,
        },
        include: {
          submissions: true,
          worker: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(myCreatedTasks);
    }
  } catch (error) {
    console.error("My tasks error:", error);
    return res.status(500).json({ error: "Failed to load your tasks" });
  }
});

// Worker claims an available task
r.post(
  "/:id/claim",
  requireAuth,
  requireRole("WORKER"),
  async (req, res) => {
    try {
      const taskId = String(req.params.id);
      const userId = req.user!.id;
      const now = new Date();
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          status: "PUBLISHED",
          assignedToId: null,
          providerId: { not: userId },
          OR: [
            { deadline: null },
            { deadline: { gt: now } },
          ],
        },
      });

      if (!task) {
        return res.status(404).json({
          error: "Task unavailable or already claimed",
        });
      }

      const result = await prisma.task.updateMany({
        where: {
          id: task.id,
          status: "PUBLISHED",
          assignedToId: null,
          OR: [
            { deadline: null },
            { deadline: { gt: now } },
          ],
        },
        data: {
          assignedToId: userId,
          status: "IN_PROGRESS",
        },
      });

      if (result.count === 0) {
        return res.status(409).json({
          error: "Another worker already claimed this task",
        });
      }

      const existingClaim = await prisma.taskClaim.findUnique({
        where: {
          taskId_userId: { taskId: task.id, userId },
        },
      });

      if (!existingClaim) {
        await prisma.taskClaim.create({
          data: { taskId: task.id, userId },
        });
      }

      try {
        const { io } = await import("../socket.js");
        if (io) {
          io.emit("task:taken", { taskId: task.id });
        }
      } catch {}

      return res.json({ message: "Task claimed successfully" });
    } catch (error) {
      console.error("Claim task error:", error);
      return res.status(500).json({ error: "Failed to claim task" });
    }
  }
);

// Private workspace
r.get("/:id/workspace", requireAuth, async (req, res) => {
  try {
    const taskId = String(req.params.id);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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