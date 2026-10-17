import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { notifyUser } from "../socket";

const r = Router();

// Worker submits task work from workspace (JSON payload)
r.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content || typeof content !== "string" || content.trim().length < 5) {
      return res.status(400).json({ error: "Please enter at least 5 characters for submission." });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (task.assignedToId !== req.user!.id) {
      return res.status(403).json({ error: "This task is not assigned to you." });
    }

    if (task.deadline && task.deadline < new Date()) {
      return res.status(400).json({ error: "Task deadline has passed." });
    }

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.submission.create({
        data: {
          taskId: task.id,
          userId: req.user!.id,
          content: content.trim(),
          status: "PENDING",
        },
      });

      await tx.task.update({
        where: { id: task.id },
        data: { status: "SUBMITTED" },
      });

      return created;
    });

    try {
      await notifyUser(
        task.providerId,
        `New submission for "${task.title}"`
      );
    } catch {
      // Notification dispatch failure should not fail submission
    }

    return res.status(201).json({
      ok: true,
      message: "Task submitted successfully!",
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("Submission error:", error);
    return res.status(500).json({ error: "Failed to submit task. Please try again." });
  }
});

// Worker submits task work via :taskId param
r.post("/:taskId/submit", requireAuth, async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const content = req.body.content || req.body.notes || "Completed task submission";

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    if (task.assignedToId !== req.user!.id) {
      return res.status(403).json({ error: "Task not assigned to you." });
    }

    if (task.deadline && task.deadline < new Date()) {
      return res.status(400).json({ error: "Task deadline has passed." });
    }

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.submission.create({
        data: {
          taskId: task.id,
          userId: req.user!.id,
          content: String(content).trim(),
          status: "PENDING",
        },
      });

      await tx.task.update({
        where: { id: task.id },
        data: { status: "SUBMITTED" },
      });

      return created;
    });

    try {
      await notifyUser(
        task.providerId,
        `New submission for "${task.title}"`
      );
    } catch {
      // Continue even if notification push fails
    }

    return res.json({ ok: true, message: "Task submitted successfully", submissionId: submission.id });
  } catch (error) {
    console.error("Task submission error:", error);
    return res.status(500).json({ error: "Failed to submit task. Please try again." });
  }
});

// Provider reviews a submission
r.post("/:taskId/review", requireAuth, async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const { approve, feedback } = req.body;

    if (typeof approve !== "boolean") {
      return res.status(400).json({ error: "approve must be true or false" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { submissions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!task || task.providerId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized to review this task." });
    }

    const submission = task.submissions[0];
    if (!submission) {
      return res.status(404).json({ error: "No submission found to review." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: approve ? "APPROVED" : "REJECTED",
          reviewNotes: feedback || null,
        },
      });

      await tx.task.update({
        where: { id: task.id },
        data: { status: approve ? "COMPLETED" : "REJECTED" },
      });
    });

    try {
      await notifyUser(
        submission.userId,
        approve ? `Your submission for "${task.title}" was approved!` : `Your submission for "${task.title}" was rejected: ${feedback || "Please review feedback."}`
      );
    } catch {
      // Continue
    }

    return res.json({
      ok: true,
      message: approve ? "Submission approved" : "Submission rejected",
    });
  } catch (error) {
    console.error("Submission review error:", error);
    return res.status(500).json({ error: "Failed to review submission" });
  }
});

export default r;
