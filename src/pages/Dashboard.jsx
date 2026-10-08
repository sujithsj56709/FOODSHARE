import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

function formatDate(timestamp) {
  if (!timestamp) return "Recently";

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      const profileRef = ref(db, `users/${currentUser.uid}`);
      const donationsRef = ref(db, "donations");

      const unsubscribeProfile = onValue(profileRef, (snapshot) => {
        setProfile(snapshot.val());
      });

      const unsubscribeDonations = onValue(donationsRef, (snapshot) => {
        const data = snapshot.val() || {};

        const userDonations = Object.entries(data)
          .map(([id, donation]) => ({ id, ...donation }))
          .filter((donation) => donation.donorId === currentUser.uid)
          .sort(
            (a, b) =>
              (b.preparedTimestamp || b.createdAt || 0) -
              (a.preparedTimestamp || a.createdAt || 0),
          );

        setDonations(userDonations);
        setLoading(false);
      });

      return () => {
        unsubscribeProfile();
        unsubscribeDonations();
      };
    });

    return () => unsubscribe();
  }, [navigate]);

  const stats = useMemo(() => {
    const totalDonations = donations.length;
    const totalMeals = donations.reduce(
      (total, donation) => total + Number(donation.quantity || 0),
      0,
    );
    const totalPoints = donations.reduce(
      (total, donation) => total + Number(donation.pointsEarned || 0),
      0,
    );
    const availableDonations = donations.filter(
      (donation) => donation.status === "available",
    ).length;

    return {
      totalDonations,
      totalMeals,
      totalPoints,
      availableDonations,
    };
  }, [donations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />
        <div className="py-24 text-center text-[#71847c]">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              Your Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
              Hello, {profile?.name || user?.displayName || "Food Hero"}.
            </h1>

            <p className="mt-4 text-lg text-[#60756c]">
              Here&apos;s the difference you&apos;ve made through FoodShare.
            </p>
          </div>

          <Link
            to="/donate"
            className="w-fit rounded-full bg-orange-500 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-600"
          >
            Donate Food →
          </Link>
        </div>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Donations shared
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.totalDonations}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Food quantity shared
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.totalMeals}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Impact points
            </p>
            <p className="mt-3 text-4xl font-extrabold text-orange-500">
              {stats.totalPoints}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Available now
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.availableDonations}
            </p>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
                Recent Activity
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#123b2f]">
                Your donations
              </h2>
            </div>

            <Link
              to="/my-donations"
              className="text-sm font-bold text-orange-500 transition hover:text-orange-600"
            >
              View all →
            </Link>
          </div>

          {donations.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-14 text-center">
              <p className="text-xl font-bold text-[#123b2f]">
                You have not shared any food yet.
              </p>

              <p className="mt-3 text-[#71847c]">
                Your first donation can make someone&apos;s day better.
              </p>

              <Link
                to="/donate"
                className="mt-6 inline-block rounded-full bg-[#123b2f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                Share food now
              </Link>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-[#dce5de] bg-white">
              {donations.slice(0, 5).map((donation, index) => (
                <div
                  key={donation.id}
                  className={`flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between ${
                    index !== Math.min(donations.length, 5) - 1
                      ? "border-b border-[#e7eee9]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f1ea] text-2xl">
                      🍱
                    </div>

                    <div>
                      <p className="text-lg font-bold capitalize text-[#123b2f]">
                        {donation.foodType || "Food donation"}
                      </p>

                      <p className="mt-1 text-sm text-[#71847c]">
                        {donation.quantity || 0} items ·{" "}
                        {formatDate(
                          donation.preparedTimestamp || donation.createdAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="text-sm font-bold text-orange-500">
                      +{donation.pointsEarned || 0} points
                    </p>

                    <span className="rounded-full bg-[#f3f7f1] px-3 py-1.5 text-xs font-bold capitalize text-[#557167]">
                      {donation.status || "pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}