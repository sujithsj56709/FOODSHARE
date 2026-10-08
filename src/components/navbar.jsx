import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../firebase";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Donate Food", to: "/donate" },
  { label: "Find Food", to: "/find-food" },
  { label: "History", to: "/history" },
  { label: "Leaderboard", to: "/leaderboard" },
];

export default function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const linkClass = ({ isActive }) =>
    `font-medium transition ${
      isActive ? "text-orange-500" : "text-[#123b2f] hover:text-orange-500"
    }`;

  async function handleLogout() {
    await signOut(auth);
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-[#fffaf3]/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg shadow-sm">
            🍊
          </div>

          <span className="text-xl font-bold tracking-tight text-[#123b2f]">
            Food<span className="text-orange-500">Share</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full px-4 py-3 text-sm font-semibold text-[#123b2f] transition hover:text-orange-500"
              >
                Dashboard
              </Link>
              <Link
                to="/my-pickups"
                className="rounded-full px-4 py-3 text-sm font-semibold text-[#123b2f] transition hover:text-orange-500"
              >
                My Pickups
              </Link>

              <Link
                to="/profile"
                aria-label="Open profile"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f1ea] text-sm font-bold text-[#123b2f] transition hover:bg-orange-100"
              >
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[#123b2f] px-4 py-2.5 text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-5 py-3 text-sm font-semibold text-[#123b2f] transition hover:text-orange-500"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-[#123b2f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                Join FoodShare
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          className="rounded-lg border border-orange-200 px-3 py-2 text-[#123b2f] md:hidden"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-orange-100 bg-[#fffaf3] px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 grid gap-3">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-[#123b2f] px-4 py-3 text-center text-sm font-semibold text-[#123b2f]"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-[#123b2f] px-4 py-3 text-center text-sm font-semibold text-[#123b2f]"
                  >
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full bg-[#123b2f] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full border border-[#123b2f] px-4 py-3 text-center text-sm font-semibold text-[#123b2f]"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full bg-[#123b2f] px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Join FoodShare
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}