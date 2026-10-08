import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, runTransaction } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

function whatsappLink(contact, foodType) {
  let phone = (contact || "").replace(/\D/g, "");

  if (phone.length === 10) phone = `91${phone}`;

  const message = `Hello, I claimed your FoodShare donation for ${foodType}. I would like to coordinate the pickup.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function expiresIn(expiresAt) {
  const minutes = Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));

  if (minutes < 60) return `Expires in ${minutes} min`;

  const hours = Math.ceil(minutes / 60);
  return `Expires in ${hours} hour${hours === 1 ? "" : "s"}`;
}

export default function MyPickups() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeDonations = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      unsubscribeDonations = onValue(ref(db, "donations"), (snapshot) => {
        const data = snapshot.val() || {};

        setDonations(
          Object.entries(data)
            .map(([id, donation]) => ({ id, ...donation }))
            .filter((donation) => donation.receiverId === currentUser.uid)
            .sort((a, b) => (b.claimedAt || 0) - (a.claimedAt || 0)),
        );

        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDonations();
    };
  }, [navigate]);

  const activePickups = useMemo(
    () =>
      donations.filter(
        (donation) =>
          donation.status === "processing" &&
          donation.expiresAt &&
          donation.expiresAt > Date.now(),
      ),
    [donations],
  );

  const completedPickups = useMemo(
    () => donations.filter((donation) => donation.status === "completed"),
    [donations],
  );

  async function confirmReceived(donation) {
    setError("");
    setMessage("");

    try {
      const result = await runTransaction(
        ref(db, `donations/${donation.id}`),
        (currentDonation) => {
          if (
            !currentDonation ||
            currentDonation.status !== "processing" ||
            currentDonation.receiverId !== user.uid
          ) {
            return;
          }

          return {
            ...currentDonation,
            status: "completed",
            receivedAt: Date.now(),
          };
        },
      );

      if (!result.committed) {
        setError("This pickup can no longer be confirmed.");
        return;
      }

      setMessage("Pickup confirmed. Thank you!");
    } catch (confirmError) {
      setError(confirmError.message || "Unable to confirm the pickup.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />
        <div className="py-24 text-center text-[#71847c]">
          Loading your pickups...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
          My Pickups
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
          Food you&apos;re collecting.
        </h1>

        <p className="mt-4 text-lg text-[#60756c]">
          Contact donors, collect food before expiry, then confirm receipt.
        </p>

        {message && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-2xl font-extrabold text-[#123b2f]">
            Active pickups
          </h2>

          {activePickups.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-12 text-center">
              <p className="font-bold text-[#123b2f]">No active pickups.</p>
              <Link
                to="/find-food"
                className="mt-4 inline-block font-bold text-orange-500"
              >
                Find available food →
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {activePickups.map((donation) => (
                <article
                  key={donation.id}
                  className="rounded-3xl border border-[#dce5de] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                        Processing
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold capitalize text-[#123b2f]">
                        {donation.foodType}
                      </h3>
                    </div>

                    <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">
                      {expiresIn(donation.expiresAt)}
                    </span>
                  </div>

                  <p className="mt-5 text-sm text-[#60756c]">
                    Donor: <strong className="text-[#123b2f]">{donation.donorName}</strong>
                  </p>

                  <div className="mt-6 space-y-3">
                    <a
                      href={`tel:${donation.contact}`}
                      className="block rounded-full border border-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-[#123b2f]"
                    >
                      Call donor: {donation.contact}
                    </a>

                    <a
                      href={whatsappLink(donation.contact, donation.foodType)}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-full bg-[#25D366] px-5 py-3 text-center text-sm font-semibold text-white"
                    >
                      WhatsApp donor
                    </a>

                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(
                        donation.location,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-full border border-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-[#123b2f]"
                    >
                      View pickup location →
                    </a>

                    <button
                      type="button"
                      onClick={() => confirmReceived(donation)}
                      className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
                    >
                      Confirm food received
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {completedPickups.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-extrabold text-[#123b2f]">
              Completed pickups
            </h2>

            <div className="mt-5 overflow-hidden rounded-3xl border border-[#dce5de] bg-white">
              {completedPickups.map((donation, index) => (
                <div
                  key={donation.id}
                  className={`flex items-center justify-between gap-4 px-6 py-5 ${
                    index !== completedPickups.length - 1
                      ? "border-b border-[#e7eee9]"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-bold capitalize text-[#123b2f]">
                      {donation.foodType}
                    </p>
                    <p className="mt-1 text-sm text-[#71847c]">
                      From {donation.donorName}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}