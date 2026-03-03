"use client";

import { useState, useEffect, type ReactNode } from "react";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if we have the admin cookie by making a test request
    fetch("/api/admin/products").then((res) => {
      setAuthed(res.ok);
    }).catch(() => setAuthed(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setError("Invalid password");
    }
  };

  if (authed === null) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-navy/40">Loading...</div></div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full border border-blue-pale">
          <div className="text-center mb-6">
            <span className="text-4xl">✨</span>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy mt-2">Admin Portal</h1>
            <p className="text-text-muted text-sm mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg border border-blue-pale focus:border-navy focus:ring-1 focus:ring-navy outline-none text-navy"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-navy hover:bg-navy-light text-white font-semibold py-3 rounded-lg transition-colors">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
