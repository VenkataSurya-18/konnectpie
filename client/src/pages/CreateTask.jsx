
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function CreateTask() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("General");
  const [reward, setReward] = useState("10");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await api.post("/tasks", {
        title,
        description,
        instructions,
        category,
        reward: Math.round(Number(reward) * 100),
        deadline: new Date(deadline).toISOString(),
      });

      setMessage("Task created successfully!");
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Task creation failed. Login as a Provider and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-8 max-w-xl rounded-xl border p-6">
      <h1 className="mb-5 text-2xl font-bold">Create a Task</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full rounded border p-3"
          placeholder="Task title (minimum 5 characters)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          minLength={5}
          required
        />

        <textarea
          className="w-full rounded border p-3"
          placeholder="Description (minimum 10 characters)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minLength={10}
          required
        />

        <textarea
          className="w-full rounded border p-3"
          placeholder="Instructions (minimum 10 characters)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          minLength={10}
          required
        />

        <input
          className="w-full rounded border p-3"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <label className="block">
          Reward (₹)
          <input
            className="mt-1 w-full rounded border p-3"
            type="number"
            min="10"
            step="1"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            required
          />
        </label>

        <label className="block">
          Deadline
          <input
            className="mt-1 w-full rounded border p-3"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            required
          />
        </label>

        {message && <p>{message}</p>}

        <button
          className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </main>
  );
}
