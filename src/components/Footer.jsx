import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0d2c23] px-6 py-12 text-[#c8d8cf]">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link to="/" className="text-2xl font-extrabold text-[#fffaf3]">
              Food<span className="text-orange-400">Share</span>
            </Link>

            <p className="mt-4 max-w-sm leading-7">
              Connecting surplus food with people who need it, one meal at a
              time.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#fffaf3]">Explore</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link to="/" className="transition hover:text-orange-400">
                Home
              </Link>

              <Link to="/donate" className="transition hover:text-orange-400">
                Donate Food
              </Link>

              <Link
                to="/find-food"
                className="transition hover:text-orange-400"
              >
                Find Food
              </Link>

              <Link
                to="/leaderboard"
                className="transition hover:text-orange-400"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#fffaf3]">Account</h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link to="/login" className="transition hover:text-orange-400">
                Login
              </Link>

              <Link
                to="/register"
                className="transition hover:text-orange-400"
              >
                Create an account
              </Link>

              <Link
                to="/profile"
                className="transition hover:text-orange-400"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[#9db5aa] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 FoodShare. Food should never go to waste.</p>

          <a
            href="mailto:hello@foodshare.com"
            className="transition hover:text-orange-400"
          >
            hello@foodshare.com
          </a>
        </div>
      </div>
    </footer>
  );
}