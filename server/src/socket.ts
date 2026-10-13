import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import cookie from "cookie";   // npm i cookie @types/cookie
import { prisma } from "./prisma";

export let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL, credentials: true } });

  io.use((socket, next) => {
    try {
      const token = cookie.parse(socket.handshake.headers.cookie || "").token;
      socket.data.user = jwt.verify(token, process.env.JWT_SECRET!);
      next();
    } catch { next(new Error("unauthorized")); }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    if (role === "WORKER") socket.join("workers");
  });
}

// Persist + push
export async function notifyUser(userId: string, message: string, taskId?: string) {
  const n = await prisma.notification.create({ data: { userId, message, taskId } });
  io.to(`user:${userId}`).emit("notification", n);
}

export function broadcastNewTask(task: object) {
  io.to("workers").emit("task:new", task);
}