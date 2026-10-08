import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

const ADMIN_EMAIL = "sujithsj56709@gmail.com";

function formatDate(timestamp) {
  if (!timestamp) return "Recently";

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    let unsubscribeUsers = () => {};
    let unsubscribeDonations = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (
        !currentUser ||
        currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
      ) {
        setLoading(false);
        return;
      }

      unsubscribeUsers = onValue(ref(db, "users"), (snapshot) => {
        setUsers(snapshot.val() || {});
      });

      unsubscribeDonations = onValue(ref(db, "donations"), (snapshot) => {
        const data = snapshot.val() || {};

        const donationList = Object.entries(data)
          .map(([id, donation]) => ({
            id,
            ...donation,
          }))
          .sort(
            (a, b) =>
              (b.preparedTimestamp || b.createdAt || 0) -
              (a.preparedTimestamp || a.createdAt || 0),
          );

        setDonations(donationList);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeDonations();
    };
  }, []);

  const stats = useMemo(() => {
    const totalQuantity = donations.reduce(
      (total, donation) => total + Number(donation.quantity || 0),
      0,
    );

    const totalPoints = donations.reduce(
      (total, donation) => total + Number(donation.pointsEarned || 0),
      0,
    );

    const available = donations.filter(
      (donation) => donation.status === "available",
    ).length;

    return {
      users: Object.keys(users).length,
      donations: donations.length,
      quantity: totalQuantity,
      points: totalPoints,
      available,
    };
  }, [users, donations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />
        <div className="py-24 text-center text-[#71847c]">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />

        <main className="mx-auto max-w-xl px-6 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            Restricted Area
          </p>

          <h1 className="mt-4 text-4xl font-extrabold text-[#123b2f]">
            Admin access required.
          </h1>

          <p className="mt-5 text-[#60756c]">
            Please sign in with an authorised FoodShare administrator account.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
          FoodShare Administration
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
          Community overview.
        </h1>

        <p className="mt-4 text-lg text-[#60756c]">
          Live activity from your FoodShare Firebase database.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Registered users
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.users}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Total donations
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.donations}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Food portions
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.quantity}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Available now
            </p>
            <p className="mt-3 text-4xl font-extrabold text-orange-500">
              {stats.available}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-6">
            <p className="text-sm font-semibold text-[#71847c]">
              Community points
            </p>
            <p className="mt-3 text-4xl font-extrabold text-[#123b2f]">
              {stats.points}
            </p>
          </div>
        </section>

        <section className="mt-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-500">
              Recent Donations
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-[#123b2f]">
              Latest community activity
            </h2>
          </div>

          {donations.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-14 text-center text-[#71847c]">
              No donations have been shared yet.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-[#dce5de] bg-white">
              {donations.slice(0, 10).map((donation, index) => (
                <div
                  key={donation.id}
                  className={`flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between ${
                    index !== Math.min(donations.length, 10) - 1
                      ? "border-b border-[#e7eee9]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f1ea] text-2xl">
                      🍱
                    </div>

                    <div>
                      <p className="font-bold capitalize text-[#123b2f]">
                        {donation.foodType || "Food donation"}
                      </p>

                      <p className="mt-1 text-sm text-[#71847c]">
                        {donation.donorName || "Community donor"} ·{" "}
                        {donation.quantity || 0} items
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 md:justify-end">
                    <p className="text-sm text-[#71847c]">
                      {formatDate(
                        donation.preparedTimestamp || donation.createdAt,
                      )}
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