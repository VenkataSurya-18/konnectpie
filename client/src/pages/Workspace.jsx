import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMsg("");
    api
      .get(`/tasks/${id}/workspace`)
      .then((res) => setTask(res.data))
      .catch((error) => {
        setMsg(
          error.response?.data?.error || "Could not load task workspace. Please verify your access."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function submitTask(e) {
    e.preventDefault();

    if (answer.trim().length < 5) {
      setMsg("Please enter at least 5 characters for your solution.");
      setIsSuccess(false);
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      await api.post("/submissions", {
        taskId: id,
        content: answer.trim(),
      });

      setIsSuccess(true);
      setMsg("Task solution submitted successfully! The provider will review your work.");
      setAnswer("");
      // Update task status locally
      setTask((prev) => (prev ? { ...prev, status: "SUBMITTED" } : prev));
    } catch (error) {
      setIsSuccess(false);
      setMsg(
        error.response?.data?.error ||
          "Submission failed. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/40 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tasks?tab=my-tasks"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>←</span>
            <span>Back to My Claimed Tasks</span>
          </Link>

          {task && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                task.status === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : task.status === "SUBMITTED"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              Status: {task.status || "IN_PROGRESS"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-indigo-100 bg-white p-12 text-center shadow-sm">
            <div className="inline-block animate-spin h-8 w-8 text-indigo-600 mb-3">
              <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">Loading your private workspace...</p>
          </div>
        ) : !task ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <span className="text-3xl block mb-2">⚠️</span>
            <p className="text-base font-bold text-red-600">{msg || "Task not found."}</p>
            <p className="mt-1 text-xs text-slate-500">
              You might not be authorized to view this workspace or the task does not exist.
            </p>
            <Link
              to="/tasks?tab=my-tasks"
              className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow"
            >
              Return to Claimed Tasks
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Task Header Card */}
            <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900">{task.title}</h1>
                    {task.category && (
                      <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                        {task.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {task.description}
                  </p>
                </div>

                <div className="text-right bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-4 min-w-[140px]">
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Task Reward
                  </span>
                  <span className="text-2xl font-black text-emerald-700">
                    ₹{task.reward ? task.reward / 100 : 0}
                  </span>
                </div>
              </div>

              {/* Instructions Banner */}
              <div className="mt-6 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white font-black">
                    i
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Submission Instructions
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {task.instructions || "Carefully follow the task requirements above and provide your detailed solution below."}
                </p>
              </div>

              {task.deadline && (
                <div className="mt-4 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Deadline: </span>
                  {new Date(task.deadline).toLocaleString()}
                </div>
              )}
            </div>

            {/* Submission Form Card */}
            <div className="rounded-2xl border border-indigo-100/80 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Your Work Submission
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Paste your answer, code, notes, or links for provider review.
              </p>

              {msg && (
                <div
                  className={`mb-5 rounded-xl border p-4 text-xs font-medium flex items-start gap-2 ${
                    isSuccess
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="font-bold">{isSuccess ? "✓" : "✕"}</span>
                  <span>{msg}</span>
                </div>
              )}

              <form onSubmit={submitTask} className="space-y-4">
                <div>
                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={7}
                    required
                    placeholder="Enter your completed solution, project link, or answer here..."
                    className="w-full rounded-xl border border-slate-300 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all font-mono"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>Minimum 5 characters required</span>
                    <span>{answer.trim().length} characters</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Submitting Solution...</span>
                      </>
                    ) : (
                      <span>Submit Solution for Review →</span>
                    )}
                  </button>

                  <Link
                    to="/tasks?tab=my-tasks"
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
