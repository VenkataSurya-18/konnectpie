import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  category?: string;
  deadline?: string;
  status?: string;
  assignedToId?: string | null;
  providerId?: string;
};

export default function TaskFeed() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const tabParam = searchParams.get("tab");
  const storedTab = typeof window !== "undefined" ? localStorage.getItem("taskfeed_active_tab") : null;
  const initialTab: "available" | "my-tasks" =
    tabParam === "my-tasks" || tabParam === "claimed" || (!tabParam && storedTab === "my-tasks")
      ? "my-tasks"
      : "available";

  const [activeTab, setActiveTab] = useState<"available" | "my-tasks">(initialTab);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingMyTasks, setLoadingMyTasks] = useState(false);
  const [availableError, setAvailableError] = useState("");
  const [myTasksError, setMyTasksError] = useState("");
  const [actionSuccess, setActionSuccess] = useState<{ msg: string; taskId?: string } | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Synchronize active tab with URL search parameter
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab === "my-tasks" || currentTab === "claimed") {
      setActiveTab("my-tasks");
    } else if (currentTab === "available") {
      setActiveTab("available");
    }
  }, [searchParams]);

  // Fetch data whenever activeTab changes
  useEffect(() => {
    if (activeTab === "my-tasks") {
      loadMyTasks();
    } else {
      loadAvailableTasks();
    }
  }, [activeTab]);

  function handleTabChange(tab: "available" | "my-tasks") {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("taskfeed_active_tab", tab);
    }
    setSearchParams(tab === "available" ? {} : { tab });
  }

  async function loadAvailableTasks() {
    setLoadingAvailable(true);
    setAvailableError("");
    try {
      const res = await api.get("/tasks");
      const data = Array.isArray(res.data) ? res.data : [];
      setTasks(data);
    } catch (err: any) {
      console.error("Failed to load available tasks:", err);
      setAvailableError(
        err.response?.data?.error || "Could not load available tasks. Please check your connection."
      );
    } finally {
      setLoadingAvailable(false);
    }
  }

  async function loadMyTasks() {
    setLoadingMyTasks(true);
    setMyTasksError("");
    try {
      const res = await api.get("/tasks/my-tasks");
      const data = Array.isArray(res.data) ? res.data : [];
      setMyTasks(data);
    } catch (err: any) {
      console.error("Failed to load my tasks:", err);
      setMyTasksError(
        err.response?.data?.error || "Could not load your claimed tasks. Please check your connection."
      );
    } finally {
      setLoadingMyTasks(false);
    }
  }

  useEffect(() => {
    // Initial fetch for both lists so tab count badges are always populated
    loadAvailableTasks();
    loadMyTasks();

    // Socket.io for real-time task updates
    try {
      socket.connect();
      socket.on("task:new", (newTask: Task) => {
        setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
      });
      socket.on("task:taken", ({ taskId }: { taskId: string }) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      });
    } catch (e) {
      console.warn("Socket connect error:", e);
    }

    return () => {
      try {
        socket.off("task:new");
        socket.off("task:taken");
        socket.disconnect();
      } catch {
        // ignore socket disconnect errors
      }
    };
  }, []);

  async function handleClaim(task: Task) {
    setClaimingId(task.id);
    setActionSuccess(null);
    setAvailableError("");

    try {
      const res = await api.post(`/tasks/${task.id}/claim`);

      // Refresh both available and claimed task lists
      await Promise.all([loadAvailableTasks(), loadMyTasks()]);

      // Switch to the "My Claimed Tasks" tab
      handleTabChange("my-tasks");

      setActionSuccess({
        msg: res.data.message || "Task claimed successfully! It is now in your active claimed tasks.",
        taskId: task.id,
      });
    } catch (error: any) {
      setAvailableError(
        error.response?.data?.error ||
          "Could not claim task. Make sure you are logged in as a Worker."
      );
    } finally {
      setClaimingId(null);
    }
  }

  const isWorker = user?.role === "WORKER" || !user?.role;
  const isProvider = user?.role === "PROVIDER";

  // Calculate potential earnings from claimed tasks
  const claimedTotalReward = myTasks.reduce((acc, t) => acc + (t.reward || 0), 0) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/40 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Dashboard Top Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15 relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold tracking-wide uppercase backdrop-blur-xs">
                  {user?.role || "WORKER"} DASHBOARD
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {user?.name || "Student"}!
              </h1>
              <p className="mt-1 text-sm text-indigo-100 max-w-xl">
                {isWorker
                  ? "Explore open micro-tasks below, claim high-impact tasks, and submit your solutions directly in the workspace."
                  : "Manage your published micro-tasks, review student submissions, and release verified payments."}
              </p>
              {isProvider && (
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/create-task")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-700 shadow-md hover:bg-slate-100 transition-colors"
                  >
                    <span>+ Create New Task</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stat Highlights */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 min-w-[100px] text-center">
                <span className="block text-2xl font-black">{tasks.length}</span>
                <span className="text-[11px] font-semibold text-indigo-100 uppercase">Available</span>
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 min-w-[100px] text-center">
                <span className="block text-2xl font-black">{myTasks.length}</span>
                <span className="text-[11px] font-semibold text-indigo-100 uppercase">
                  {isWorker ? "Claimed" : "Created"}
                </span>
              </div>
              {isWorker && (
                <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/20 min-w-[110px] text-center">
                  <span className="block text-2xl font-black text-emerald-300">₹{claimedTotalReward}</span>
                  <span className="text-[11px] font-semibold text-indigo-100 uppercase">In Progress</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* High-Visibility Segmented Tab Control */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100/80 pb-4">
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1.5 shadow-inner">
            <button
              id="tab-available-tasks"
              type="button"
              onClick={() => handleTabChange("available")}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                activeTab === "available"
                  ? "bg-white text-indigo-700 shadow-md shadow-indigo-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <span>Available Tasks</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "available"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-300/70 text-slate-700"
                }`}
              >
                {tasks.length}
              </span>
            </button>

            <button
              id="tab-my-claimed-tasks"
              type="button"
              onClick={() => handleTabChange("my-tasks")}
              className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                activeTab === "my-tasks"
                  ? "bg-white text-indigo-700 shadow-md shadow-indigo-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <span>{isWorker ? "My Claimed Tasks" : "My Created Tasks"}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-black ${
                  activeTab === "my-tasks"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-300/70 text-slate-700"
                }`}
              >
                {myTasks.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeTab === "available") {
                loadAvailableTasks();
              } else {
                loadMyTasks();
              }
            }}
            disabled={loadingAvailable || loadingMyTasks}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 disabled:opacity-50 transition-colors"
          >
            <span>↻</span>
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-sm">
                  ✓
                </span>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    {actionSuccess.msg}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Click "Open Workspace" to begin working and submit your solution.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {actionSuccess.taskId && (
                  <button
                    onClick={() => navigate(`/workspace/${actionSuccess.taskId}`)}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition-colors"
                  >
                    Open Workspace Now →
                  </button>
                )}
                <button
                  onClick={() => setActionSuccess(null)}
                  className="text-xs font-semibold text-emerald-800 hover:underline px-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: Available Tasks */}
        {activeTab === "available" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                Available Micro-Tasks
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"} ready to claim
              </span>
            </div>

            {availableError && (
              <div className="mb-6 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-200 shadow-xs flex items-center justify-between">
                <span>{availableError}</span>
                <button
                  type="button"
                  onClick={loadAvailableTasks}
                  className="font-bold underline text-red-800"
                >
                  Retry
                </button>
              </div>
            )}

            {loadingAvailable ? (
              <div className="rounded-2xl border border-indigo-100 bg-white p-12 text-center shadow-xs">
                <div className="inline-block animate-spin h-8 w-8 text-indigo-600 mb-3">
                  <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600">Loading open tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-10 text-center shadow-xs">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-2xl mb-4">
                    🔍
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    No new tasks available to claim right now
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    {isProvider
                      ? "You haven't published any open tasks. Click '+ Create Task' to publish a new one."
                      : myTasks.length > 0
                      ? `You currently have ${myTasks.length} active claimed task(s) in progress.`
                      : "Check back shortly for newly posted micro-tasks from creators and businesses."}
                  </p>

                  {isWorker && myTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange("my-tasks")}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all"
                    >
                      <span>View My Claimed Tasks ({myTasks.length})</span>
                      <span>→</span>
                    </button>
                  )}

                  {isProvider && (
                    <button
                      type="button"
                      onClick={() => navigate("/create-task")}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all"
                    >
                      <span>+ Create a New Task</span>
                    </button>
                  )}
                </div>

                {/* Visible Claimed Tasks Section if worker has claimed tasks */}
                {isWorker && myTasks.length > 0 && (
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 p-6 sm:p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          Your Active Claimed Tasks ({myTasks.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tasks currently assigned to you. Click Open Workspace to complete your submission.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange("my-tasks")}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Go to My Claimed Tasks Tab →
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {myTasks.map((task) => (
                        <article
                          key={task.id}
                          className="rounded-xl border border-indigo-100 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60">
                                {task.category || "General"}
                              </span>
                              <span className="text-lg font-black text-emerald-600">
                                ₹{task.reward ? task.reward / 100 : 0}
                              </span>
                            </div>

                            <h4 className="mt-2 text-base font-bold text-slate-900">
                              {task.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                              {task.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                task.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : task.status === "SUBMITTED"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {task.status || "IN_PROGRESS"}
                            </span>

                            <button
                              type="button"
                              onClick={() => navigate(`/workspace/${task.id}`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110"
                            >
                              <span>Workspace</span>
                              <span>→</span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                          {task.category || "General"}
                        </span>
                        <span className="text-xl font-black text-emerald-600">
                          ₹{task.reward ? task.reward / 100 : 0}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900 leading-snug">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                        {task.deadline ? (
                          <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        ) : (
                          <span>No deadline</span>
                        )}
                        <span className="font-semibold text-indigo-600">Verified Reward</span>
                      </div>

                      {isWorker ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(task)}
                          disabled={claimingId !== null}
                          className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                        >
                          {claimingId === task.id ? (
                            <span>Claiming...</span>
                          ) : (
                            <>
                              <span>Claim Task</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="rounded-lg bg-slate-100 py-2 text-center text-xs font-semibold text-slate-500">
                          Worker Only Task
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: My Tasks (Claimed for Worker, Created for Provider) */}
        {activeTab === "my-tasks" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                {isWorker ? "My Claimed Tasks" : "Tasks Created by Me"}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {myTasks.length} {myTasks.length === 1 ? "task" : "tasks"} total
              </span>
            </div>

            {myTasksError && (
              <div className="mb-6 rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-200 shadow-xs flex items-center justify-between">
                <span>{myTasksError}</span>
                <button
                  type="button"
                  onClick={loadMyTasks}
                  className="font-bold underline text-red-800"
                >
                  Retry
                </button>
              </div>
            )}

            {loadingMyTasks ? (
              <div className="rounded-2xl border border-indigo-100 bg-white p-12 text-center shadow-xs">
                <div className="inline-block animate-spin h-8 w-8 text-indigo-600 mb-3">
                  <svg className="h-full w-full" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  {isWorker ? "Loading your claimed tasks..." : "Loading your created tasks..."}
                </p>
              </div>
            ) : myTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-indigo-200 bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 text-2xl mb-4">
                  📝
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isWorker ? "You haven't claimed any tasks yet." : "You haven't posted any tasks yet."}
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  {isWorker
                    ? "Browse available tasks on the platform, claim one that matches your skills, and open the workspace to solve it."
                    : "Post a micro-task with clear instructions and guaranteed rewards to collaborate with student workers."}
                </p>

                {isWorker ? (
                  <button
                    type="button"
                    onClick={() => handleTabChange("available")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                  >
                    <span>Browse Available Tasks</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/create-task")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                  >
                    <span>+ Create Your First Task</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myTasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-indigo-100/80 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                          {task.category || "General"}
                        </span>
                        <span className="text-xl font-black text-emerald-600">
                          ₹{task.reward ? task.reward / 100 : 0}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-slate-900 leading-snug">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            task.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : task.status === "SUBMITTED"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {task.status || "IN_PROGRESS"}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/workspace/${task.id}`)}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Open Workspace</span>
                        <span>→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
