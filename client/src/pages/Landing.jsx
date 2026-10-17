import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section with Vibrant Blue-Purple Gradient Backdrop */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/25 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">
              Student Micro-Task Network
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-indigo-600">Earn & Learn</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Turn Spare Hours into Real Earnings with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              KonnectPie
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
            The platform built for students to solve short micro-tasks, review peer projects,
            and earn verified cash rewards on their own schedule.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/tasks"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 transition-all duration-200"
              >
                <span>Go to My Dashboard ({user?.role})</span>
                <span>→</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 transition-all duration-200"
                >
                  <span>Get Started Free</span>
                  <span>→</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-slate-50 transition-all duration-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-black text-xs">✓</span>
              <span>Fast Razorpay Verified Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-black text-xs">✓</span>
              <span>100% Student Friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-black text-xs">✓</span>
              <span>Dedicated Workspaces</span>
            </div>
          </div>
        </div>

        {/* Floating Preview Card Mockup */}
        <div className="mx-auto mt-16 max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-indigo-100/80 bg-white/90 p-4 sm:p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs font-semibold text-slate-400">Live Task Stream</span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                ● Live Updates
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-4 text-left shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Python Testing</span>
                  <span className="text-base font-extrabold text-emerald-600">₹250</span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-800">Unit test authentication helper</h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">Write 5 pytest cases for the password strength validator module.</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>~15 min work</span>
                  <span className="font-semibold text-indigo-600">Ready to Claim →</span>
                </div>
              </div>

              <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-4 text-left shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">UI / UX Review</span>
                  <span className="text-base font-extrabold text-emerald-600">₹180</span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-800">Review responsive mobile layout</h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">Test navigation menu and form inputs on 3 mobile screen widths.</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>~10 min work</span>
                  <span className="font-semibold text-indigo-600">Ready to Claim →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Why KonnectPie
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything students need to earn on their terms
            </h3>
            <p className="mt-4 text-base text-slate-600">
              No long freelance proposals or waiting weeks for client replies. Browse available tasks, claim instantly, submit your work, and get verified.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-indigo-50/30 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-6">
                ⚡
              </div>
              <h4 className="text-xl font-bold text-slate-900">Bite-Sized Tasks</h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Micro-tasks designed to fit within college schedules. Complete research, bug testing, and content checks in 10 to 30 minutes.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-purple-100/80 bg-gradient-to-br from-white to-purple-50/30 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-6">
                🖥️
              </div>
              <h4 className="text-xl font-bold text-slate-900">Built-in Workspace</h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Dedicated workspace for every claimed task. Read instructions, draft your answer, and submit directly within the platform.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/20 mb-6">
                🛡️
              </div>
              <h4 className="text-xl font-bold text-slate-900">Guaranteed Escrow</h4>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Task rewards are funded in advance. When your submission is approved, the reward is immediately released to your balance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Simple 3-Step Flow
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              How KonnectPie Works
            </h3>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3 text-center">
            <div className="p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-500/20 mb-5">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900">Browse & Claim</h4>
              <p className="mt-2 text-sm text-slate-600">
                Log in as a Worker, explore open tasks with clear rewards, and click Claim to reserve it exclusively.
              </p>
            </div>

            <div className="p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-xl font-black text-white shadow-md shadow-indigo-500/20 mb-5">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900">Open Workspace & Submit</h4>
              <p className="mt-2 text-sm text-slate-600">
                Access your private workspace, review task guidelines, paste or write your solution, and click Submit.
              </p>
            </div>

            <div className="p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-xl font-black text-white shadow-md shadow-purple-500/20 mb-5">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900">Review & Get Paid</h4>
              <p className="mt-2 text-sm text-slate-600">
                The task provider reviews your submission and approves it. Your reward is settled directly with full transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Start Earning Today?
          </h2>
          <p className="mt-4 text-indigo-100 text-base sm:text-lg max-w-2xl mx-auto">
            Join thousands of student peers completing micro-tasks and learning practical industry skills.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-600 shadow-lg hover:bg-slate-100 transition-colors"
            >
              Sign Up as Worker
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/40 bg-white/10 px-8 py-3.5 text-base font-bold text-white hover:bg-white/20 transition-colors"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">KonnectPie</span>
            <span>— Student Micro-Task Platform</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} KonnectPie. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
