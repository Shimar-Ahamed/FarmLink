"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setRole, setToken } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!mobile.trim()) {
      setError("Mobile number is required.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/login", { mobile, password });

      setToken(res.data.access_token);
      setRole(res.data.role);

      if (res.data.role === "FARMER") {
        router.push("/farmer/dashboard");
      } else {
        router.push("/buyer/market");
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-xl font-bold">Login</h1>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <label className="block mt-4 text-sm font-medium">Mobile Number</label>
        <input
          className="w-full border rounded-xl p-3 mt-1"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="0771234567"
        />

        <label className="block mt-4 text-sm font-medium">Password</label>
        <input
          type="password"
          className="w-full border rounded-xl p-3 mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        <button
          disabled={loading}
          className="w-full mt-6 bg-black text-white rounded-xl p-3 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <button
          type="button"
          className="w-full mt-3 underline"
          onClick={() => router.push("/role")}
        >
          Create an account
        </button>
      </form>
    </div>
  );
}