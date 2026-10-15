
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline?: string;
};

export default function TaskFeed() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("Loading tasks...");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/tasks")
      .then((res) => {
        setTasks(res.data);
        setMessage(
          res.data.length === 0 ? "No tasks available yet." : ""
        );
      })
      .catch(() => {
        setMessage("Could not load tasks. Please try again.");
      });
  }, []);

  async function handleClaim(task: Task) {
    setClaimingId(task.id);
    setMessage("");

    try {
      const res = await api.post(`/tasks/${task.id}/claim`);

      setTasks((current) =>
        current.filter((item) => item.id !== task.id)
      );

      setMessage(res.data.message || "Task claimed successfully!");
    } catch (error: any) {
      setMessage(
        error.response?.data?.error ||
          "Could not claim task. Please log in as a Worker."
      );
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">
        KonnectPie - Available Tasks
      </h1>

      {message && <p>{message}</p>}

      {tasks.map((task) => (
        <article key={task.id} className="rounded-xl border p-4">
          <h2 className="font-semibold">{task.title}</h2>

          <p>{task.description}</p>

          <p>Reward: ₹{task.reward / 100}</p>

          {task.deadline && (
            <p>
              Deadline: {new Date(task.deadline).toLocaleString()}
            </p>
          )}

          <button
            onClick={() => handleClaim(task)}
            disabled={claimingId !== null}
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {claimingId === task.id ? "Claiming..." : "Claim Task"}
          </button>
        </article>
      ))}
    </main>
  );
}
