import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onValue, ref } from "firebase/database";

import { db } from "../firebase";

const categoryStyles = {
  veg: { emoji: "🥗", color: "bg-[#e7f2e6]", label: "Vegetarian" },
  nonveg: { emoji: "🍱", color: "bg-[#fff0dc]", label: "Non-vegetarian" },
  vegan: { emoji: "🥬", color: "bg-[#e7f2e6]", label: "Vegan" },
  bakery: { emoji: "🍞", color: "bg-[#f7eadf]", label: "Bakery" },
  other: { emoji: "🍽️", color: "bg-[#eef2ec]", label: "Food Donation" },
};

function timeAgo(timestamp, now) {
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));

  if (minutes < 1) return "Prepared just now";
  if (minutes < 60) return `Prepared ${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Prepared ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `Prepared ${days} day${days === 1 ? "" : "s"} ago`;
}

function expiresIn(expiresAt, now) {
  const minutes = Math.max(0, Math.ceil((expiresAt - now) / 60000));

  if (minutes < 60) return `Expires in ${minutes} min`;

  const hours = Math.ceil(minutes / 60);
  return `Expires in ${hours} hour${hours === 1 ? "" : "s"}`;
}

export default function FeaturedDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "donations"), (snapshot) => {
      const data = snapshot.val() || {};

      setDonations(
        Object.entries(data)
          .map(([id, donation]) => ({ id, ...donation }))
          .sort(
            (a, b) =>
              (b.preparedTimestamp || b.createdAt || 0) -
              (a.preparedTimestamp || a.createdAt || 0),
          ),
      );

      setLoading(false);
    });

    const interval = window.setInterval(() => setNow(Date.now()), 60000);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  const featuredDonations = useMemo(() => {
    return donations
      .filter(
        (donation) =>
          donation.status === "available" &&
          donation.expiresAt &&
          donation.expiresAt > now,
      )
      .slice(0, 3);
  }, [donations, now]);

  return (
    <section className="bg-[#fffaf3] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Available Now
            </p>

            <h2 className="text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
              Food waiting to
              <span className="block text-orange-500">be shared.</span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[#60756c] md:text-lg">
              Browse fresh food donations shared by the FoodShare community.
            </p>
          </div>

          <Link
            to="/find-food"
            className="w-fit rounded-full border border-[#123b2f] px-6 py-3 text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
          >
            View all food →
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#71847c]">
            Loading food donations...
          </div>
        ) : featuredDonations.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-16 text-center">
            <p className="text-xl font-bold text-[#123b2f]">
              No active food donations right now.
            </p>

            <p className="mt-3 text-[#71847c]">
              Be the first person to share fresh food with your community.
            </p>

            <Link
              to="/donate"
              className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Donate Food →
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {featuredDonations.map((donation) => {
              const style =
                categoryStyles[donation.category] || categoryStyles.other;

              return (
                <article
                  key={donation.id}
                  className="overflow-hidden rounded-3xl border border-[#dce5de] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`flex h-44 items-center justify-center text-7xl ${style.color}`}
                  >
                    {style.emoji}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                          {style.label}
                        </p>

                        <h3 className="mt-2 text-xl font-bold capitalize text-[#123b2f]">
                          {donation.foodType || "Food donation"}
                        </h3>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#e8f1ea] px-3 py-1 text-xs font-bold text-[#123b2f]">
                        {donation.quantity || 0} items
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-[#71847c]">
                      <p>Shared by {donation.donorName || "Community donor"}</p>

                      <p>
                        {timeAgo(
                          donation.preparedTimestamp || donation.createdAt,
                          now,
                        )}
                      </p>

                      <p className="font-semibold text-orange-600">
                        {expiresIn(donation.expiresAt, now)}
                      </p>
                    </div>

                    <Link
                      to="/find-food"
                      className="mt-6 block rounded-full bg-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-500"
                    >
                      View donation
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}