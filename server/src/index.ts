
import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

// Create a Razorpay order (test mode credentials in .env)
router.post("/order", async (req: Request, res: Response) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(503).json({
        error: "Razorpay test credentials are not configured",
      });
    }

    const { amount, currency = "INR" } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount in paise" });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: `kp_${Date.now()}`,
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: order.error?.description ?? "Could not create Razorpay order",
      });
    }

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ error: "Could not create payment order" });
  }
});

// Verify Razorpay webhook signature.
// Register this handler before express.json() in index.ts.
export async function webhookHandler(req: Request, res: Response) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.header("x-razorpay-signature");

  if (!secret || !signature || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: "Invalid webhook configuration or body" });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  try {
    const event = JSON.parse(req.body.toString("utf8"));

    // Payment is verified. Add your database transaction here to mark
    // the matching task/payment as paid, idempotently, using the event ID.
    console.log("Verified Razorpay webhook:", event.event);

    return res.json({ received: true });
  } catch {
    return res.status(400).json({ error: "Invalid webhook JSON" });
  }
}

export default router;
