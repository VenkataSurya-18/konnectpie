
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import http from "http";

import { initSocket } from "./socket";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import claimsRoutes from "./routes/claims";
import submissionsRoutes from "./routes/submissions";
import paymentRoutes from "./index";

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://fascinating-jalebi-4bd319.netlify.app",
];

if (process.env.CLIENT_URL) {
  const trimmed = process.env.CLIENT_URL.trim();
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  if (!allowedOrigins.includes(withProtocol)) {
    allowedOrigins.push(withProtocol);
  }
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".netlify.app") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/submissions", submissionsRoutes);
app.use("/api/payments", paymentRoutes);

initSocket(server);

server.listen(PORT, () => {
  console.log(`KonnectPie server running on http://localhost:${PORT}`);
});
