import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TaskFeed from "./pages/TaskFeed";
import Login from "./pages/Login";
import CreateTask from "./pages/CreateTask";
import "./App.css";

function Workspace() {
  return (
    <main className="mx-auto mt-12 max-w-3xl rounded-xl border p-6">
      <h1 className="text-2xl font-bold">Task Workspace</h1>
      <p className="mt-4">Task claimed successfully!</p>
      <p className="mt-2">
        Your workspace is ready. Task submission feature will be added next.
      </p>
      <a
        href="/"
        className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white"
      >
        Back to Available Tasks
      </a>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/" element={<TaskFeed />} />
        <Route path="/create-task" element={<CreateTask />} />
        <Route path="/workspace/:id" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}