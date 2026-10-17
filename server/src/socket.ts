import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { parseCookie } from "cookie";
import { prisma } from "./prisma";

export let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const bearerToken =
        typeof authHeader === "string" && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : null;
      const handshakeToken = (socket.handshake.auth as any)?.token;
      let cookieToken: string | undefined;
      const rawCookie = socket.handshake.headers.cookie;
      if (rawCookie) {
        try {
          cookieToken = parseCookie(rawCookie).token;
        } catch {
          // ignore cookie parse error
        }
      }

      const token = handshakeToken || bearerToken || cookieToken;
      if (!token) {
        return next(new Error("unauthorized"));
      }

      socket.data.user = jwt.verify(token, process.env.JWT_SECRET!);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as { id?: string; role?: string } | undefined;
    if (user?.id) {
      socket.join(`user:${user.id}`);
      if (user.role === "WORKER") {
        socket.join("workers");
      }
    }
  });
}

// Persist + push
export async function notifyUser(userId: string, message: string) {
  try {
    const n = await prisma.notification.create({
      data: {
        userId,
        message,
      },
    });
    if (io) {
      io.to(`user:${userId}`).emit("notification", n);
    }
  } catch (error) {
    console.error("notifyUser error:", error);
  }
}

export function broadcastNewTask(task: object) {
  if (io) {
    io.to("workers").emit("task:new", task);
  }
}