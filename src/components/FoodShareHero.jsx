import { Link } from "react-router-dom";

export default function FoodShareHero() {
  return (
    <section className="relative overflow-hidden bg-[#fffaf3]">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-green-200/40 blur-3xl" />

      <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-600">
            <span>♥</span>
            Together, we can make a difference
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight text-[#123b2f] sm:text-6xl lg:text-7xl">
            Don&apos;t Waste Food.
            <span className="block text-orange-500">Share Hope.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-[#60756c]">
            Turn surplus food into meaningful meals and help build a
            hunger-free community. Every donation can make someone&apos;s day
            better.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 font-semibold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-1 hover:bg-orange-600"
            >
              Donate Food <span>→</span>
            </Link>

            <Link
              to="/find-food"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#123b2f] bg-white px-7 py-4 font-semibold text-[#123b2f] transition hover:-translate-y-1 hover:bg-[#123b2f] hover:text-white"
            >
              Find Food
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#71847c]">
            <span>✓ Easy to donate</span>
            <span>✓ Local communities</span>
            <span>✓ Less food waste</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="relative min-h-[470px] overflow-hidden rounded-[3rem] shadow-2xl shadow-[#123b2f]/10">
            <img
              src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85"
              alt="Fresh healthy meal ready to be shared"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#123b2f]/55 via-transparent to-transparent" />

            <div className="absolute right-5 top-5 rounded-full bg-[#123b2f] px-6 py-4 text-sm font-semibold text-white shadow-lg sm:right-7 sm:top-7">
              Making every meal count.
            </div>

            <p className="absolute bottom-8 left-8 right-8 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Good food should never go to waste.
            </p>
          </div>

          <div className="absolute -bottom-7 -left-4 rounded-3xl bg-white px-7 py-6 shadow-xl sm:-left-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#71847c]">
              Community Impact
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-extrabold tracking-tight text-[#123b2f]">
                12.5K+
              </p>
              <p className="text-sm text-[#71847c]">meals shared</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}