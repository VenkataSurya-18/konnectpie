
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("WORKER");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister
        ? "/auth/register"
        : "/auth/login";

      const payload = isRegister
        ? { name: name.trim(), email: email.trim(), password, role }
        : { email: email.trim(), password };

      const response = await api.post(endpoint, payload);

      // Check whether the server returned an error-free response.
      if (response.status < 200 || response.status >= 300) {
        setMessage("Login failed. Please try again.");
        return;
      }

      // Go to the tasks page after a successful response.
      navigate("/tasks", { replace: true });
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          (error.response
            ? `Request failed (${error.response.status}). Check your details.`
            : "Cannot connect to the server. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsRegister((previous) => !previous);
    setMessage("");
    setPassword("");
  }

  return (
    <main className="mx-auto mt-12 max-w-md rounded-xl border p-6">
      <h1 className="mb-5 text-2xl font-bold">
        KonnectPie {isRegister ? "Register" : "Login"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <input
              className="w-full rounded border p-3"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
            />

            <select
              className="w-full rounded border p-3"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Account role"
            >
              <option value="WORKER">Worker</option>
              <option value="PROVIDER">Provider</option>
            </select>
          </>
        )}

        <input
          className="w-full rounded border p-3"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          className="w-full rounded border p-3"
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />

        {message && (
          <p role="alert" className="text-sm text-red-600">
            {message}
          </p>
        )}

        <button
          className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isRegister
              ? "Create account"
              : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        {isRegister ? "Already registered?" : "New to KonnectPie?"}{" "}
        <button
          type="button"
          className="text-blue-600 underline"
          onClick={toggleMode}
          disabled={loading}
        >
          {isRegister ? "Login" : "Create an account"}
        </button>
      </p>
    </main>
  );
}
