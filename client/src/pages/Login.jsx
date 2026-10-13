
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
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { name, email, password, role }
        : { email, password };

      await api.post(endpoint, payload);
      navigate("/");
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Request failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
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
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />

            <select
              className="w-full rounded border p-3"
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
        />

        <input
          className="w-full rounded border p-3"
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {message && <p className="text-red-600">{message}</p>}

        <button
          className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        {isRegister ? "Already registered?" : "New to KonnectPie?"}{" "}
        <button
          type="button"
          className="text-blue-600 underline"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
          }}
        >
          {isRegister ? "Login" : "Create an account"}
        </button>
      </p>
    </main>
  );
}
