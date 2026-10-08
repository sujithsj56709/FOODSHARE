import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

const statusStyles = {
  available: "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-700",
  completed: "bg-slate-100 text-slate-600",
};

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

export default function MyDonations() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDonations = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      unsubscribeDonations();

      const donationsRef = ref(db, "donations");

      unsubscribeDonations = onValue(donationsRef, (snapshot) => {
        const data = snapshot.val() || {};

        const userDonations = Object.entries(data)
          .map(([id, donation]) => ({
            id,
            ...donation,
          }))
          .filter((donation) => donation.donorId === currentUser.uid)
          .sort(
            (a, b) =>
              (b.preparedTimestamp || b.createdAt || 0) -
              (a.preparedTimestamp || a.createdAt || 0),
          );

        setDonations(userDonations);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDonations();
    };
  }, [navigate]);

  const filteredDonations = useMemo(() => {
    if (statusFilter === "all") return donations;

    return donations.filter((donation) => donation.status === statusFilter);
  }, [donations, statusFilter]);

  const totalPoints = donations.reduce(
    (total, donation) => total + Number(donation.pointsEarned || 0),
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />
        <div className="py-24 text-center text-[#71847c]">
          Loading your donations...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
              My Donations
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
              Food you&apos;ve shared.
            </h1>

            <p className="mt-4 text-lg text-[#60756c]">
              {donations.length} donation
              {donations.length !== 1 ? "s" : ""} · {totalPoints} impact
              points earned
            </p>
          </div>

          <Link
            to="/donate"
            className="w-fit rounded-full bg-orange-500 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-600"
          >
            Donate Food →
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {["all", "available", "pending", "completed"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                statusFilter === status
                  ? "bg-[#123b2f] text-white"
                  : "bg-white text-[#557167] ring-1 ring-[#dce5de] hover:bg-[#f3f7f1]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredDonations.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-16 text-center">
            <p className="text-xl font-bold text-[#123b2f]">
              No donations found.
            </p>

            <p className="mt-3 text-[#71847c]">
              Share your first surplus food donation with the community.
            </p>

            <Link
              to="/donate"
              className="mt-6 inline-block rounded-full bg-[#123b2f] px-6 py-3 font-semibold text-white transition hover:bg-orange-500"
            >
              Share food now
            </Link>
          </div>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {filteredDonations.map((donation) => {
              const status = donation.status || "pending";

              return (
                <article
                  key={donation.id}
                  className="rounded-3xl border border-[#dce5de] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f1ea] text-3xl">
                        🍱
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-500">
                          {donation.category || "Food donation"}
                        </p>

                        <h2 className="mt-1 text-xl font-extrabold capitalize text-[#123b2f]">
                          {donation.foodType || "Food donation"}
                        </h2>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                        statusStyles[status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-[#71847c]">Quantity</p>
                      <p className="mt-1 font-bold text-[#123b2f]">
                        {donation.quantity || 0} items
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-[#71847c]">
                        Impact points
                      </p>
                      <p className="mt-1 font-bold text-orange-500">
                        +{donation.pointsEarned || 0}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="font-semibold text-[#71847c]">Posted</p>
                      <p className="mt-1 text-[#123b2f]">
                        {donation.preparedTimeDisplay ||
                          formatDate(
                            donation.preparedTimestamp || donation.createdAt,
                          )}
                      </p>
                    </div>
                  </div>

                  {donation.location && (
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(
                        donation.location,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 block rounded-full border border-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
                    >
                      View pickup location →
                    </a>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}