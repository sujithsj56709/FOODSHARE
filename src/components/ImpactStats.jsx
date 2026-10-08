import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";

import { db } from "../firebase";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default function ImpactStats() {
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const donationsRef = ref(db, "donations");

    const unsubscribe = onValue(donationsRef, (snapshot) => {
      const data = snapshot.val() || {};

      setDonations(
        Object.entries(data).map(([id, donation]) => ({
          id,
          ...donation,
        })),
      );
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const mealsShared = donations.reduce(
      (total, donation) => total + Number(donation.quantity || 0),
      0,
    );

    const totalPoints = donations.reduce(
      (total, donation) => total + Number(donation.pointsEarned || 0),
      0,
    );

    const activeDonors = new Set(
      donations.map((donation) => donation.donorId).filter(Boolean),
    ).size;

    return [
      {
        value: formatNumber(mealsShared),
        label: "Food Portions Shared",
      },
      {
        value: formatNumber(donations.length),
        label: "Food Donations",
      },
      {
        value: formatNumber(activeDonors),
        label: "Community Donors",
      },
      {
        value: formatNumber(totalPoints),
        label: "Impact Points Earned",
      },
    ];
  }, [donations]);

  return (
    <section className="bg-[#123b2f] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-orange-400">
            Our Impact
          </p>

          <h2 className="text-4xl font-extrabold tracking-tight text-[#fffaf0] md:text-6xl">
            Small actions.{" "}
            <span className="text-orange-400">Big impact.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#c8d8cf] md:text-lg">
            Every donation helps reduce food waste and connects surplus food
            with people who need it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 border-y border-white/15 md:mt-16 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`
                px-5 py-9 text-center md:px-6 md:py-11
                ${index >= 2 ? "border-t border-white/15 md:border-t-0" : ""}
                ${index % 2 === 1 ? "border-l border-white/15 md:border-l-0" : ""}
                ${index !== 0 ? "md:border-l md:border-white/15" : ""}
              `}
            >
              <p className="text-3xl font-extrabold tracking-tight text-[#fffaf0] md:text-4xl">
                {stat.value}
              </p>

              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#b8ccc1] md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}