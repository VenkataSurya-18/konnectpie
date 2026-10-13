import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";
import { io } from "../socket";

const r = Router();

r.post("/:taskId/claim", requireAuth, requireRole("WORKER"), async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.id;

  const won = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.updateMany({
      where: {
        id: taskId,
        status: "PUBLISHED",
        deadline: { gt: new Date() },
        providerId: { not: userId },       // can't claim own task
      },
      data: { status: "ASSIGNED", assignedToId: userId, assignedAt: new Date() },
    });
    if (updated.count === 0) return false;  // someone else got it first

    await tx.taskClaim.create({ data: { taskId, userId, won: true } });
    return true;
  });

  if (!won) return res.status(409).json({ error: "Task is no longer available" });

  io.emit("task:taken", { taskId });         // remove from everyone's feed
  res.json({ ok: true, message: "Task assigned to you" });
});

export default r;