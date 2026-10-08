import { Link } from "react-router-dom";

export default function CallToAction() {
  return (
    <section className="bg-[#123b2f] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">
          Make a Difference Today
        </p>

        <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-[#fffaf3] md:text-6xl">
          Share food.
          <span className="block text-orange-400">Share hope.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#c8d8cf] md:text-lg">
          Your extra food can become someone&apos;s next meaningful meal.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/donate"
            className="rounded-full bg-orange-500 px-7 py-4 font-semibold text-white transition hover:bg-orange-600"
          >
            Donate Food →
          </Link>

          <Link
            to="/find-food"
            className="rounded-full border border-white/25 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            Find Food
          </Link>
        </div>
      </div>
    </section>
  );
}