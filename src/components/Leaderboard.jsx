import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onValue, ref } from "firebase/database";

import { db } from "../firebase";

const rankStyles = {
  1: "bg-[#f4b942] text-[#5b3c00]",
  2: "bg-[#d9e1e5] text-[#40515b]",
  3: "bg-[#e6b08a] text-[#6b3519]",
};

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Leaderboard() {
  const [users, setUsers] = useState({});
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const donationsRef = ref(db, "donations");

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val() || {});
    });

    const unsubscribeDonations = onValue(donationsRef, (snapshot) => {
      const data = snapshot.val() || {};

      setDonations(
        Object.entries(data).map(([id, donation]) => ({
          id,
          ...donation,
        })),
      );
    });

    return () => {
      unsubscribeUsers();
      unsubscribeDonations();
    };
  }, []);

  const contributors = useMemo(() => {
    const contributorMap = {};

    donations.forEach((donation) => {
      if (!donation.donorId) return;

      if (!contributorMap[donation.donorId]) {
        contributorMap[donation.donorId] = {
          id: donation.donorId,
          name:
            users[donation.donorId]?.name ||
            donation.donorName ||
            "FoodShare Donor",
          photoURL: users[donation.donorId]?.photoURL || "",
          totalPoints: 0,
          totalDonations: 0,
        };
      }

      contributorMap[donation.donorId].totalPoints += Number(
        donation.pointsEarned || 0,
      );
      contributorMap[donation.donorId].totalDonations += 1;
    });

    return Object.values(contributorMap)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3)
      .map((contributor, index) => ({
        ...contributor,
        rank: index + 1,
      }));
  }, [donations, users]);

  return (
    <section className="bg-[#f3f7f1] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 flex flex-col gap-5 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Community Champions
            </p>

            <h2 className="text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
              Top contributors making
              <span className="block text-orange-500">a real difference.</span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[#60756c] md:text-lg">
              Recognising the people and partners who help turn surplus food
              into meaningful meals.
            </p>
          </div>

          <Link
            to="/leaderboard"
            className="mx-auto w-fit rounded-full border border-[#123b2f] px-6 py-3 text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white md:mx-0"
          >
            View full leaderboard →
          </Link>
        </div>

        {contributors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-14 text-center">
            <p className="text-xl font-bold text-[#123b2f]">
              The leaderboard is waiting for its first champion.
            </p>

            <Link
              to="/donate"
              className="mt-5 inline-block text-sm font-bold text-orange-500"
            >
              Share food and earn impact points →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[#dce5de] bg-white shadow-sm">
            {contributors.map((contributor, index) => (
              <div
                key={contributor.id}
                className={`flex items-center gap-4 px-5 py-5 sm:px-7 ${
                  index !== contributors.length - 1
                    ? "border-b border-[#e7eee9]"
                    : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    rankStyles[contributor.rank]
                  }`}
                >
                  {contributor.rank}
                </div>

                {contributor.photoURL ? (
                  <img
                    src={contributor.photoURL}
                    alt={contributor.name}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f1ea] text-sm font-bold text-[#123b2f]">
                    {getInitials(contributor.name)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#123b2f]">
                    {contributor.name}
                  </p>

                  <p className="mt-1 text-sm text-[#71847c]">
                    {contributor.totalDonations} donation
                    {contributor.totalDonations !== 1 ? "s" : ""} shared
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-extrabold text-[#123b2f]">
                    {contributor.totalPoints}
                  </p>

                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                    Points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}