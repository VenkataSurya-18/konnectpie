
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
};

export default function TaskFeed() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get("/tasks")
      .then((res) => setTasks(res.data))
      .catch(() => setMsg("Tasks load కాలేదు. Backend check చేయి."));

    socket.connect();

    socket.on("task:new", (task: Task) => {
      setTasks((previous) => [task, ...previous]);
    });

    socket.on("task:taken", ({ taskId }: { taskId: string }) => {
      setTasks((previous) =>
        previous.filter((task) => task.id !== taskId)
      );
    });

    return () => {
      socket.off("task:new");
      socket.off("task:taken");
      socket.disconnect();
    };
  }, []);

  async function claimTask(id: string) {
    try {
      await api.post(`/tasks/${id}/claim`);
      window.location.href = `/workspace/${id}`;
    } catch (error: any) {
      setMsg(error.response?.data?.error ?? "Failed to accept task.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">KonnectPie - Available Tasks</h1>

      {msg && <p className="text-red-600">{msg}</p>}

      {tasks.length === 0 && !msg && <p>No tasks available yet.</p>}

      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border p-4">
          <h2 className="font-semibold">{task.title}</h2>
          <p>{task.description}</p>
          <p>Reward: ₹{task.reward / 100}</p>

          <button
            onClick={() => claimTask(task.id)}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-white"
          >
            Accept Task
          </button>
        </div>
      ))}
    </main>
  );
}
