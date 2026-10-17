import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isWorker = user?.role === "WORKER" || !user?.role;
  const isProvider = user?.role === "PROVIDER";

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-100/60 bg-white/85 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <svg
              className="h-5 w-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 leading-tight">
              Konnect<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Pie</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600/80 -mt-0.5">
              Micro-Tasks Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/tasks?tab=available"
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === "/tasks" && !location.search.includes("my-tasks")
                    ? "text-indigo-600"
                    : "text-slate-600 hover:text-indigo-600"
                }`}
              >
                Available Tasks
              </Link>

              <Link
                to="/tasks?tab=my-tasks"
                className={`text-sm font-semibold transition-colors ${
                  location.search.includes("my-tasks")
                    ? "text-indigo-600"
                    : "text-slate-600 hover:text-indigo-600"
                }`}
              >
                {isWorker ? "My Claimed Tasks" : "My Created Tasks"}
              </Link>

              {isProvider && (
                <Link
                  to="/create-task"
                  className="rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/25 hover:shadow-md hover:brightness-110 transition-all"
                >
                  + Create Task
                </Link>
              )}

              <div className="h-5 w-px bg-slate-200" />

              {/* User badge */}
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-none">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{user?.email}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                    user?.role === "PROVIDER"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {user?.role || "WORKER"}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/#features"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Features
              </Link>
              <Link
                to="/#how-it-works"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:brightness-110 transition-all"
              >
                Create Account
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                user?.role === "PROVIDER"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {user?.role || "WORKER"}
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 px-4 pt-3 pb-5 space-y-3">
          {isAuthenticated ? (
            <>
              <div className="py-2 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link
                to="/tasks?tab=available"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-indigo-600 py-1"
              >
                Available Tasks
              </Link>
              <Link
                to="/tasks?tab=my-tasks"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 hover:text-indigo-600 py-1"
              >
                {isWorker ? "My Claimed Tasks" : "My Created Tasks"}
              </Link>
              {isProvider && (
                <Link
                  to="/create-task"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-indigo-600 py-1"
                >
                  + Create Task
                </Link>
              )}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full rounded-lg bg-red-50 py-2 text-center text-sm font-bold text-red-600"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 py-1"
              >
                Features
              </Link>
              <Link
                to="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-slate-700 py-1"
              >
                How It Works
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-700 py-1"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-center text-sm font-bold text-white"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
