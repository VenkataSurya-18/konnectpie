import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setResult(res.data);
    } catch (err) {
      console.error("Forgot password error:", err);
      setErrorMsg(
        err.response?.data?.error || "Could not process request. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-blue-50/70 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Konnect<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Pie</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
          Reset your password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-indigo-100/90 bg-white/95 p-6 sm:p-8 shadow-xl shadow-indigo-500/10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

          {errorMsg && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 flex items-start gap-2 shadow-xs">
              <span className="text-red-500 font-bold">✕</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-left">
                <p className="text-sm font-semibold text-slate-900">
                  {result.message}
                </p>

                {result.emailConfigured === false && result.resetToken && (
                  <div className="mt-4 pt-3 border-t border-indigo-200/60">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Development Mode Environment
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Email delivery (SMTP_HOST / RESEND_API_KEY) is not configured in this environment.
                      You can proceed directly using the generated single-use token:
                    </p>
                    <div className="mt-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-indigo-300 break-all select-all">
                      {result.resetToken}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/reset-password?token=${result.resetToken}&email=${encodeURIComponent(email)}`)
                      }
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow hover:brightness-110 transition-all"
                    >
                      Proceed to Reset Password Now →
                    </button>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  ← Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Account Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Generating token...</span>
                ) : (
                  <span>Request Password Reset</span>
                )}
              </button>

              <div className="text-center pt-3 border-t border-slate-100">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Remembered your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
