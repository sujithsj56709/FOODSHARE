import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { get, ref, set } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

const googleProvider = new GoogleAuthProvider();

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function showError(loginError) {
    if (
      loginError.code === "auth/invalid-credential" ||
      loginError.code === "auth/wrong-password" ||
      loginError.code === "auth/user-not-found"
    ) {
      setError("Incorrect email address or password.");
    } else {
      setError(loginError.message || "Something went wrong. Please try again.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (loginError) {
      showError(loginError);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setMessage("");
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = ref(db, `users/${user.uid}`);
      const existingUser = await get(userRef);

      if (!existingUser.exists()) {
        await set(userRef, {
          createdAt: Date.now(),
          email: user.email || "",
          name: user.displayName || "FoodShare User",
          photoURL: user.photoURL || "",
          totalDonations: 0,
          totalPoints: 0,
        });
      }

      navigate("/dashboard");
    } catch (loginError) {
      if (loginError.code !== "auth/popup-closed-by-user") {
        showError(loginError);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address first, then click Forgot password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Password reset email sent. Check your inbox.");
    } catch (resetError) {
      showError(resetError);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            Welcome Back
          </p>

          <h1 className="mt-4 max-w-xl text-6xl font-extrabold tracking-tight text-[#123b2f]">
            Every meal shared
            <span className="block text-orange-500">matters.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#60756c]">
            Sign in to donate food, find available meals, and see the impact
            you are making in your community.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-[#dce5de] bg-white p-7 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
            FoodShare Account
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#123b2f]">
            Sign in
          </h2>

          <p className="mt-3 text-[#71847c]">
            Continue your FoodShare journey.
          </p>

          {message && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-[#dce5de] px-6 py-3.5 font-semibold text-[#123b2f] transition hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-lg">G</span>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e7eee9]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9aaba3]">
              or
            </span>
            <div className="h-px flex-1 bg-[#e7eee9]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="text-sm font-bold text-[#123b2f]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none transition placeholder:text-[#9aaba3] focus:border-orange-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-[#123b2f]"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-orange-500 transition hover:text-orange-600"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none transition placeholder:text-[#9aaba3] focus:border-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#123b2f] px-6 py-4 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#71847c]">
            New to FoodShare?{" "}
            <Link
              to="/register"
              className="font-bold text-orange-500 transition hover:text-orange-600"
            >
              Create an account
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}