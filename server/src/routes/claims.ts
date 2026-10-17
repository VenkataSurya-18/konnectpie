import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { io } from "../socket";

const r = Router();

r.post("/:taskId/claim", requireAuth, requireRole("WORKER"), async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const userId = req.user!.id;

  try {
    const won = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.task.updateMany({
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
        data: {
          status: "IN_PROGRESS",
          assignedToId: userId,
        },
      });

      if (updated.count === 0) return false;

      // Create claim record if not already exists
      const existingClaim = await tx.taskClaim.findUnique({
        where: {
          taskId_userId: { taskId, userId },
        },
      });

      if (!existingClaim) {
        await tx.taskClaim.create({
          data: { taskId, userId },
        });
      }

      return true;
    });

    if (!won) {
      return res.status(409).json({ error: "Task is no longer available" });
    }

    if (io) {
      io.emit("task:taken", { taskId });
    }

    return res.json({ ok: true, message: "Task claimed successfully!" });
  } catch (error) {
    console.error("Claim error:", error);
    return res.status(500).json({ error: "Failed to claim task" });
  }
});

export default r;