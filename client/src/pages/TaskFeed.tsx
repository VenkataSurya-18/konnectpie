
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
        setMessage("Could not load tasks. Check whether the backend is running.");
      });
  }, []);

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
            <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>
          )}
        </article>
      ))}
    </main>
  );
}
