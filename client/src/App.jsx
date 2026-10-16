
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";

import TaskFeed from "./pages/TaskFeed";
import Login from "./pages/Login";
import CreateTask from "./pages/CreateTask";
import { api } from "./lib/api";
import "./App.css";

function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/tasks/${id}/workspace`)
      .then((res) => setTask(res.data))
      .catch((error) => {
        setMsg(
          error.response?.data?.error || "Could not load task."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function submitTask(e) {
    e.preventDefault();

    if (answer.trim().length < 5) {
      setMsg("Please enter at least 5 characters.");
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      await api.post("/submissions", {
        taskId: id,
        content: answer.trim(),
      });

      setMsg("Task submitted successfully!");
      setAnswer("");
    } catch (error) {
      setMsg(
        error.response?.data?.error ||
          "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="p-6">Loading task...</main>;
  }

  if (!task) {
    return (
      <main className="mx-auto mt-12 max-w-3xl p-6">
        <p>{msg || "Task not found."}</p>
        <button onClick={() => navigate("/")}>
          Back to Tasks
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto mt-12 max-w-3xl space-y-4 rounded-xl border p-6">
      <h1 className="text-2xl font-bold">Task Workspace</h1>

      <h2 className="text-xl font-semibold">{task.title}</h2>

      <p>{task.description}</p>

      <p>
        <strong>Instructions:</strong>{" "}
        {task.instructions || "Follow the task description."}
      </p>

      <p>
        <strong>Reward:</strong> ₹{task.reward / 100}
      </p>

      <p>
        <strong>Status:</strong> {task.status}
      </p>

      <form onSubmit={submitTask} className="space-y-3">
        <label htmlFor="answer" className="block font-semibold">
          Your submission
        </label>

        <textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          required
          placeholder="Enter your answer or work here..."
          className="w-full rounded-lg border p-3"
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Task"}
        </button>
      </form>

      {msg && <p role="status">{msg}</p>}

      <button
        type="button"
        onClick={() => navigate("/")}
        className="rounded-lg border px-4 py-2"
      >
        Back to Available Tasks
      </button>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login and registration */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      {/* Open login page by default */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Existing pages */}
      <Route path="/tasks" element={<TaskFeed />} />
      <Route path="/create-task" element={<CreateTask />} />
      <Route path="/workspace/:id" element={<Workspace />} />

      {/* Unknown URLs */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
