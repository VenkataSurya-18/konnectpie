// routes/submissions.ts
import { Router } from "express";
import multer from "multer";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { notifyUser } from "../socket";

const upload = multer({
  dest: "uploads/",                                   // swap for S3/R2 private bucket later
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, f, cb) => cb(null, ["image/png", "image/jpeg"].includes(f.mimetype)),
});

const r = Router();

// Worker submits
r.post("/:taskId/submit", requireAuth, upload.array("files", 5), async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task || task.assignedToId !== req.user!.id) return res.sendStatus(403);
  if (task.deadline < new Date()) return res.status(400).json({ error: "Deadline passed" });
  if (task.status !== "ASSIGNED") return res.status(400).json({ error: "Not submittable" });

  const files = (req.files as Express.Multer.File[]).map(f => f.path);
  try {
    await prisma.$transaction([
      prisma.submission.create({
        data: { taskId: task.id, workerId: req.user!.id, notes: req.body.notes, fileUrls: files },
      }),
      prisma.task.update({ where: { id: task.id }, data: { status: "SUBMITTED" } }),
    ]);
  } catch { return res.status(409).json({ error: "Already submitted" }); }

  await notifyUser(task.providerId, `New submission for "${task.title}"`, task.id);
  res.json({ ok: true });
});

// Provider approves / rejects
r.post("/:taskId/review", requireAuth, async (req, res) => {
  const { approve, feedback } = req.body;
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId }, include: { submissions: true },
  });
  if (!task || task.providerId !== req.user!.id || task.status !== "SUBMITTED")
    return res.sendStatus(403);

  const sub = task.submissions[0];
  await prisma.$transaction([
    prisma.submission.update({
      where: { id: sub.id },
      data: { status: approve ? "APPROVED" : "REJECTED", feedback },
    }),
    prisma.task.update({
      where: { id: task.id },
      data: { status: approve ? "COMPLETED" : "REJECTED" },
    }),
    ...(approve ? [prisma.rewardLedger.create({
      data: { taskId: task.id, userId: sub.workerId, type: "PAYOUT", amount: task.reward },
    })] : []),
  ]);
  await notifyUser(sub.workerId, approve ? "Submission approved! 🎉" : `Rejected: ${feedback}`, task.id);
  res.json({ ok: true });
});

export default r;