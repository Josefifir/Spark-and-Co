"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/ui/PhoneInput";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    marketingOptIn: false,
  });

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/account");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone,
          marketingOptIn: registerData.marketingOptIn,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/account");
        router.refresh();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-graphite flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-paper mb-2">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="text-sm text-paper-dim">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-flame font-medium underline hover:text-flame-bright"
            >
              {isLogin ? "Register here" : "Sign in here"}
            </button>
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-md p-4 mb-6">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-paper-dim mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-paper-dim mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-flame text-graphite font-medium rounded-md hover:bg-flame-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-paper-dim mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                  className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-paper-dim mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
                />
              </div>
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-paper-dim mb-1">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                required
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
              />
            </div>
            <PhoneInput
              label="Phone (optional)"
              value={registerData.phone}
              onChange={(value) => setRegisterData({ ...registerData, phone: value || "" })}
            />
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-paper-dim mb-1">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                required
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-paper-dim mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-panel border border-hairline rounded-md text-paper text-sm focus:outline-none focus:ring-2 focus:ring-flame focus:border-flame"
              />
            </div>
            <div className="flex items-center">
              <input
                id="marketingOptIn"
                type="checkbox"
                checked={registerData.marketingOptIn}
                onChange={(e) => setRegisterData({ ...registerData, marketingOptIn: e.target.checked })}
                className="w-4 h-4 text-flame focus:ring-flame border-hairline rounded bg-panel"
              />
              <label htmlFor="marketingOptIn" className="ml-2 text-sm text-paper-dim">
                Subscribe to marketing emails
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-flame text-graphite font-medium rounded-md hover:bg-flame-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-paper-dim hover:text-paper">
            ← Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}

// Made with Bob