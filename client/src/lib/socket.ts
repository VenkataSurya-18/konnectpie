import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://konnectpie.onrender.com");

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
  auth: (cb) => {
    cb({ token: localStorage.getItem("token") });
  },
});
