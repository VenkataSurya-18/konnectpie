
import { Router } from "express";
import multer from "multer";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { notifyUser } from "../socket";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG and JPEG images are allowed"));
    }
  },
});

const r = Router();

// Worker submits a claimed task
r.post(
  "/:taskId/submit",
  requireAuth,
  upload.array("files", 5),
  async (req, res) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId },
      });

      if (!task || task.assignedToId !== req.user!.id) {
        return res.status(403).json({ error: "Task not assigned to you" });
      }

      if (task.deadline < new Date()) {
        return res.status(400).json({ error: "Deadline passed" });
      }

      if (
        task.status !== "IN_PROGRESS" &&
        task.status !== "ASSIGNED"
      ) {
        return res.status(400).json({ error: "Task is not submittable" });
      }

      const uploadedFiles = (req.files as Express.Multer.File[]) || [];
      const fileUrls = uploadedFiles.map((file) => file.path);

      await prisma.$transaction(async (tx) => {
        await tx.submission.create({
          data: {
            taskId: task.id,
            workerId: req.user!.id,
            notes: req.body.notes || "",
            fileUrls,
          },
        });

        await tx.task.update({
          where: { id: task.id },
          data: { status: "SUBMITTED" },
        });
      });

      await notifyUser(
        task.providerId,
        `New submission for "${task.title}"`,
        task.id
      );

      return res.json({ ok: true, message: "Task submitted successfully" });
    } catch (error) {
      console.error("Task submission error:", error);

      return res.status(500).json({
        error: "Failed to submit task. Please try again.",
      });
    }
  }
);

// Provider approves or rejects a submission
r.post("/:taskId/review", requireAuth, async (req, res) => {
  try {
    const { approve, feedback } = req.body;

    if (typeof approve !== "boolean") {
      return res.status(400).json({
        error: "approve must be true or false",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { submissions: true },
    });

    if (!task || task.providerId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized to review this task" });
    }

    if (task.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Task is not awaiting review" });
    }

    const submission = task.submissions[0];

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: approve ? "APPROVED" : "REJECTED",
          feedback: feedback || null,
        },
      });

      await tx.task.update({
        where: { id: task.id },
        data: { status: approve ? "COMPLETED" : "REJECTED" },
      });

      if (approve) {
        await tx.rewardLedger.create({
          data: {
            taskId: task.id,
            userId: submission.workerId,
            type: "PAYOUT",
            amount: task.reward,
          },
        });
      }
    });

    await notifyUser(
      submission.workerId,
      approve ? "Submission approved!" : `Submission rejected: ${feedback || "Please review the feedback."}`,
      task.id
    );

    return res.json({
      ok: true,
      message: approve ? "Submission approved" : "Submission rejected",
    });
  } catch (error) {
    console.error("Submission review error:", error);

    return res.status(500).json({
      error: "Failed to review submission",
    });
  }
});

export default r;
