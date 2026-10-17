import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

const QUICK_CATEGORIES = [
  "General",
  "Python",
  "Web Development",
  "UI / UX Design",
  "Research",
  "Content Writing",
  "Quality Assurance",
];

export default function CreateTask() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("General");
  const [reward, setReward] = useState("25");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      await api.post("/tasks", {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        category: category.trim(),
        reward: Math.round(Number(reward) * 100),
        deadline: new Date(deadline).toISOString(),
      });

      setMessage("Task published successfully! Workers can now discover and claim it.");
      setTimeout(() => {
        navigate("/tasks?tab=available");
      }, 1200);
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.error ||
          "Task creation failed. Ensure you are logged in as a Provider and fill all fields."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/40 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-2xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>←</span>
            <span>Back to Tasks Feed</span>
          </Link>
          <span className="rounded-full bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Provider Mode
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-indigo-100/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-indigo-500/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900">Publish a Micro-Task</h1>
            <p className="mt-1 text-xs text-slate-500">
              Create a targeted micro-task for verified student workers.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 rounded-xl border p-4 text-xs font-medium flex items-start gap-2 shadow-xs ${
                isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span className="font-bold">{isError ? "✕" : "✓"}</span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Write unit tests for authentication module"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category name"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                      category === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Short Description
              </label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize the task goals and scope..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Step-by-Step Instructions
              </label>
              <textarea
                required
                minLength={10}
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Detail the exact deliverables, requirements, and formatting required..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reward (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="10"
                    step="1"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all font-bold"
                  />
                </div>
                <span className="mt-1 block text-[10px] text-slate-400">
                  Minimum ₹10 required per micro-task.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  required
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <span>Publishing Task...</span>
                ) : (
                  <span>Publish Micro-Task →</span>
                )}
              </button>

              <Link
                to="/tasks"
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
