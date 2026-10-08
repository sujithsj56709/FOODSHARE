import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const user = credential.user;
      const timestamp = Date.now();

      await updateProfile(user, {
        displayName: name.trim(),
      });

      await set(ref(db, `users/${user.uid}`), {
        createdAt: timestamp,
        email: email.trim(),
        name: name.trim(),
        photoURL: "",
        totalDonations: 0,
        totalPoints: 0,
      });

      navigate("/dashboard");
    } catch (registerError) {
      if (registerError.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError(
          registerError.message || "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            Join the Movement
          </p>

          <h1 className="mt-4 max-w-xl text-6xl font-extrabold tracking-tight text-[#123b2f]">
            Good food deserves
            <span className="block text-orange-500">a second chance.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-[#60756c]">
            Create your FoodShare account to donate food, discover available
            meals, and make a visible difference in your community.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-[#dce5de] bg-white p-7 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
            FoodShare Account
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#123b2f]">
            Create an account
          </h2>

          <p className="mt-3 text-[#71847c]">
            Start sharing food and creating impact.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-bold text-[#123b2f]"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none transition placeholder:text-[#9aaba3] focus:border-orange-400"
              />
            </div>

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
              <label
                htmlFor="password"
                className="text-sm font-bold text-[#123b2f]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none transition placeholder:text-[#9aaba3] focus:border-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-bold text-[#123b2f]"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                required
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none transition placeholder:text-[#9aaba3] focus:border-orange-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#123b2f] px-6 py-4 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#71847c]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-orange-500 transition hover:text-orange-600"
            >
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}