import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onValue, ref } from "firebase/database";

import Navbar from "../components/Navbar";
import { db } from "../firebase";

const medalStyles = [
  "bg-[#f4b942] text-[#5b3c00]",
  "bg-[#d9e1e5] text-[#40515b]",
  "bg-[#e6b08a] text-[#6b3519]",
];

function getInitials(name = "FoodShare Donor") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Leaderboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const donationsRef = ref(db, "donations");

    const unsubscribeDonations = onValue(
      donationsRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        setDonations(
          Object.entries(data).map(([id, donation]) => ({
            id,
            ...donation,
          })),
        );

        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => {
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
            donation.donorName ||
            "FoodShare Donor",
          totalPoints: 0,
          totalDonations: 0,
          totalQuantity: 0,
        };
      }

      contributorMap[
        donation.donorId
      ].totalPoints += Number(
        donation.pointsEarned || 0,
      );

      contributorMap[
        donation.donorId
      ].totalDonations += 1;

      contributorMap[
        donation.donorId
      ].totalQuantity += Number(
        donation.quantity || 0,
      );
    });

    return Object.values(contributorMap)
      .sort(
        (a, b) =>
          b.totalPoints - a.totalPoints,
      )
      .map((contributor, index) => ({
        ...contributor,
        rank: index + 1,
      }));
  }, [donations]);

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            Community Champions
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-6xl">
            Every donation
            <span className="block text-orange-500">
              makes a difference.
            </span>
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#60756c]">
            Celebrating the FoodShare
            community members who are turning
            surplus food into meaningful meals.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#71847c]">
            Loading the leaderboard...
          </div>
        ) : contributors.length === 0 ? (
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-16 text-center">
            <p className="text-xl font-bold text-[#123b2f]">
              No contributors yet.
            </p>

            <p className="mt-3 text-[#71847c]">
              Be the first person to share
              food and earn impact points.
            </p>

            <Link
              to="/donate"
              className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-600"
            >
              Donate Food →
            </Link>
          </div>
        ) : (
          <>
            {/* TOP 3 */}
            <section className="mt-12 grid gap-5 md:grid-cols-3">
              {contributors
                .slice(0, 3)
                .map((contributor) => (
                  <article
                    key={contributor.id}
                    className="rounded-3xl border border-[#dce5de] bg-white p-7 text-center shadow-sm"
                  >
                    <div
                      className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold ${
                        medalStyles[
                          contributor.rank - 1
                        ]
                      }`}
                    >
                      #{contributor.rank}
                    </div>

                    <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f1ea] text-lg font-extrabold text-[#123b2f]">
                      {getInitials(
                        contributor.name,
                      )}
                    </div>

                    <h2 className="mt-4 text-xl font-extrabold text-[#123b2f]">
                      {contributor.name}
                    </h2>

                    <p className="mt-2 text-sm text-[#71847c]">
                      {
                        contributor.totalDonations
                      }{" "}
                      donation
                      {contributor.totalDonations !==
                      1
                        ? "s"
                        : ""}{" "}
                      shared
                    </p>

                    <p className="mt-5 text-3xl font-extrabold text-orange-500">
                      {contributor.totalPoints}
                    </p>

                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#71847c]">
                      Impact points
                    </p>
                  </article>
                ))}
            </section>

            {/* FULL LEADERBOARD */}
            <section className="mt-10 overflow-hidden rounded-3xl border border-[#dce5de] bg-white">
              <div className="grid grid-cols-[56px_1fr_auto] gap-4 border-b border-[#e7eee9] bg-[#f3f7f1] px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#71847c] sm:px-7">
                <span>Rank</span>
                <span>Contributor</span>
                <span>Points</span>
              </div>

              {contributors.map(
                (contributor) => (
                  <div
                    key={contributor.id}
                    className="grid grid-cols-[56px_1fr_auto] items-center gap-4 border-b border-[#e7eee9] px-5 py-5 last:border-b-0 sm:px-7"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        contributor.rank <= 3
                          ? medalStyles[
                              contributor.rank -
                                1
                            ]
                          : "bg-[#f3f7f1] text-[#557167]"
                      }`}
                    >
                      {contributor.rank}
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f1ea] text-sm font-bold text-[#123b2f]">
                        {getInitials(
                          contributor.name,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#123b2f]">
                          {contributor.name}
                        </p>

                        <p className="mt-1 text-sm text-[#71847c]">
                          {
                            contributor.totalQuantity
                          }{" "}
                          food portions shared
                        </p>
                      </div>
                    </div>

                    <p className="text-right text-lg font-extrabold text-[#123b2f]">
                      {
                        contributor.totalPoints
                      }
                    </p>
                  </div>
                ),
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

