
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

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/submissions", submissionsRoutes);

initSocket(server);

server.listen(PORT, () => {
  console.log(`KonnectPie server running on http://localhost:${PORT}`);
});
