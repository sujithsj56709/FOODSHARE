import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref, set } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

const categoryEmoji = {
  veg: "🥗",
  nonveg: "🍱",
  vegan: "🥬",
  bakery: "🍞",
  other: "🍽️",
};

function formatDate(timestamp) {
  if (!timestamp) return "Date unavailable";

  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const styles = {
    available: "bg-green-100 text-green-700",
    processing: "bg-orange-100 text-orange-700",
    completed: "bg-blue-100 text-blue-700",
  };

  const labels = {
    available: "Available",
    processing: "Processing",
    completed: "Completed",
  };

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {labels[status] || status || "Unknown"}
    </span>
  );
}

function RatingStars({ rating }) {
  const value = Number(rating) || 0;

  if (!value) {
    return (
      <span className="text-sm text-[#71847c]">
        Not rated yet
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="tracking-wide text-orange-400">
        {"★".repeat(value)}
        <span className="text-gray-300">
          {"★".repeat(5 - value)}
        </span>
      </span>

      <span className="ml-1 text-sm font-semibold text-[#60756c]">
        {value}/5
      </span>
    </div>
  );
}

function RatingInput({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            aria-label={`Rate ${star} out of 5`}
            className={`text-3xl leading-none transition ${
              star <= value
                ? "text-orange-400"
                : "text-gray-300"
            } ${
              disabled
                ? "cursor-not-allowed opacity-60"
                : "hover:scale-110"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-[#71847c]">
        {value
          ? `You selected ${value}/5`
          : "Select a rating from 1 to 5"}
      </p>
    </div>
  );
}

function DonationCard({
  donation,
  type,
  selectedRating,
  setSelectedRating,
  submittingRating,
  onSubmitRating,
}) {
  const emoji =
    categoryEmoji[donation.category] || "🍽️";

  const isDonor = type === "donor";
  const isReceiver = type === "receiver";

  const currentRating = Number(donation.rating) || 0;

  const canRate =
    isReceiver &&
    donation.status === "completed" &&
    currentRating === 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-[#dce5de] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {/* Card header */}
      <div className="flex h-32 items-center justify-between bg-[#e8f1ea] px-6">
        <span className="text-5xl">{emoji}</span>

        <StatusBadge status={donation.status} />
      </div>

      <div className="p-6">
        {/* Category */}
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
          {donation.category || "Food donation"}
        </p>

        {/* Food name */}
        <h2 className="mt-2 text-2xl font-extrabold capitalize text-[#123b2f]">
          {donation.foodType || "Food donation"}
        </h2>

        {/* Details */}
        <div className="mt-5 space-y-2 text-sm text-[#60756c]">
          <p>
            <span className="font-semibold text-[#123b2f]">
              Quantity:
            </span>{" "}
            {donation.quantity || 0} items
          </p>

          <p>
            <span className="font-semibold text-[#123b2f]">
              Shared:
            </span>{" "}
            {formatDate(
              donation.createdAt ||
                donation.preparedTimestamp,
            )}
          </p>

          {donation.receivedAt && (
            <p>
              <span className="font-semibold text-[#123b2f]">
                Completed:
              </span>{" "}
              {formatDate(donation.receivedAt)}
            </p>
          )}
        </div>

        {/* Donor information */}
        {isDonor && (
          <div className="mt-5 rounded-2xl bg-[#f3f7f1] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#71847c]">
              Donation
            </p>

            {donation.receiverName ? (
              <p className="mt-1 text-sm text-[#123b2f]">
                Claimed by{" "}
                <strong>{donation.receiverName}</strong>
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#60756c]">
                Waiting for someone to claim this food.
              </p>
            )}
          </div>
        )}

        {/* Receiver information */}
        {isReceiver && (
          <div className="mt-5 rounded-2xl bg-[#f3f7f1] p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#71847c]">
              Donor
            </p>

            <p className="mt-1 text-sm text-[#123b2f]">
              {donation.donorName || "FoodShare donor"}
            </p>
          </div>
        )}

        {/* Rating */}
        <div className="mt-5 border-t border-[#e5ece7] pt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#71847c]">
            {isDonor ? "Donation rating" : "Your rating"}
          </p>

          {/* Already rated */}
          {currentRating > 0 && (
            <RatingStars rating={currentRating} />
          )}

          {/* Receiver can rate completed donation */}
          {canRate && (
            <div className="rounded-2xl bg-[#f8faf7] p-4">
              <p className="text-sm font-semibold text-[#123b2f]">
                How was your experience?
              </p>

              <RatingInput
                value={selectedRating || 0}
                onChange={setSelectedRating}
                disabled={submittingRating}
              />

              <button
                type="button"
                disabled={
                  !selectedRating ||
                  submittingRating
                }
                onClick={() =>
                  onSubmitRating(
                    donation.id,
                    selectedRating,
                  )
                }
                className="mt-4 w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingRating
                  ? "Submitting rating..."
                  : "Submit Rating"}
              </button>
            </div>
          )}

          {/* Processing but not completed */}
          {isReceiver &&
            donation.status === "processing" &&
            currentRating === 0 && (
              <p className="text-sm text-[#71847c]">
                You can rate this donation after
                confirming that you received the food.
              </p>
            )}

          {/* Donor sees that receiver can rate */}
          {isDonor &&
            donation.status === "completed" &&
            currentRating === 0 && (
              <p className="text-sm text-[#71847c]">
                The receiver has not rated this donation
                yet.
              </p>
            )}
        </div>

        {/* Location */}
        {donation.location && (
          <a
            href={`https://www.google.com/maps?q=${encodeURIComponent(
              donation.location,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 block rounded-full border border-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
          >
            View pickup location →
          </a>
        )}
      </div>
    </article>
  );
}

export default function History() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [activeTab, setActiveTab] =
    useState("donations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rating state
  const [selectedRating, setSelectedRating] =
    useState({});
  const [submittingRatingId, setSubmittingRatingId] =
    useState("");

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      },
    );

    return unsubscribe;
  }, []);

  // Donations listener
  useEffect(() => {
    if (!user) {
      setDonations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const donationsRef = ref(db, "donations");

    const unsubscribe = onValue(
      donationsRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        const allDonations = Object.entries(data).map(
          ([id, donation]) => ({
            id,
            ...donation,
          }),
        );

        setDonations(allDonations);
        setLoading(false);
      },
      (firebaseError) => {
        setError(
          firebaseError.message ||
            "Unable to load donation history.",
        );
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  // Donations shared by current user
  const myDonations = useMemo(() => {
    if (!user) return [];

    return donations
      .filter(
        (donation) =>
          donation.donorId === user.uid,
      )
      .sort(
        (a, b) =>
          (b.createdAt || 0) -
          (a.createdAt || 0),
      );
  }, [donations, user]);

  // Donations claimed by current user
  const myClaims = useMemo(() => {
    if (!user) return [];

    return donations
      .filter(
        (donation) =>
          donation.receiverId === user.uid,
      )
      .sort(
        (a, b) =>
          (b.claimedAt || b.createdAt || 0) -
          (a.claimedAt || a.createdAt || 0),
      );
  }, [donations, user]);

  const activeList =
    activeTab === "donations"
      ? myDonations
      : myClaims;

  // Submit rating
  async function handleSubmitRating(
    donationId,
    rating,
  ) {
    setError("");

    if (!user) {
      setError("Please log in to submit a rating.");
      return;
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setError(
        "Please select a rating between 1 and 5.",
      );
      return;
    }

    const donation = donations.find(
      (item) => item.id === donationId,
    );

    if (!donation) {
      setError("Donation could not be found.");
      return;
    }

    // Only the receiver can rate
    if (donation.receiverId !== user.uid) {
      setError(
        "Only the person who claimed this food can rate it.",
      );
      return;
    }

    // Rating only after completion
    if (donation.status !== "completed") {
      setError(
        "You can rate the food only after confirming that you received it.",
      );
      return;
    }

    // Prevent changing an existing rating
    if (Number(donation.rating) > 0) {
      setError(
        "This donation has already been rated.",
      );
      return;
    }

    setSubmittingRatingId(donationId);

    try {
      /*
       * IMPORTANT:
       * Write ONLY to the rating child.
       *
       * We do NOT update the whole donation object.
       */
      await set(
        ref(
          db,
          `donations/${donationId}/rating`,
        ),
        numericRating,
      );

      setSelectedRating((current) => ({
        ...current,
        [donationId]: 0,
      }));
    } catch (firebaseError) {
      setError(
        firebaseError.message ||
          "Unable to submit the rating.",
      );
    } finally {
      setSubmittingRatingId("");
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />

        <main className="mx-auto max-w-4xl px-6 py-20">
          <div className="rounded-3xl border border-[#dce5de] bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl">🔐</div>

            <h1 className="mt-5 text-3xl font-extrabold text-[#123b2f]">
              Log in to view your history
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-[#60756c]">
              Your shared donations and claimed food
              will appear here.
            </p>

            <Link
              to="/login"
              className="mt-7 inline-block rounded-full bg-orange-500 px-7 py-3.5 font-semibold text-white transition hover:bg-orange-600"
            >
              Log in →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            FoodShare History
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-6xl">
            Your food-sharing
            <span className="block text-orange-500">
              journey.
            </span>
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#60756c]">
            Keep track of the food you have shared and
            the donations you have claimed.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#dce5de] bg-white p-5">
            <p className="text-sm font-semibold text-[#71847c]">
              Food shared
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#123b2f]">
              {myDonations.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-5">
            <p className="text-sm font-semibold text-[#71847c]">
              Food claimed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#123b2f]">
              {myClaims.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-5">
            <p className="text-sm font-semibold text-[#71847c]">
              Items shared
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#123b2f]">
              {myDonations.reduce(
                (total, donation) =>
                  total +
                  (Number(donation.quantity) || 0),
                0,
              )}
            </p>
          </div>

          <div className="rounded-3xl border border-[#dce5de] bg-white p-5">
            <p className="text-sm font-semibold text-[#71847c]">
              Items claimed
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#123b2f]">
              {myClaims.reduce(
                (total, donation) =>
                  total +
                  (Number(donation.quantity) || 0),
                0,
              )}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex w-full rounded-2xl border border-[#dce5de] bg-white p-1.5 sm:w-fit">
          <button
            type="button"
            onClick={() =>
              setActiveTab("donations")
            }
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "donations"
                ? "bg-[#123b2f] text-white"
                : "text-[#60756c] hover:bg-[#f3f7f1]"
            }`}
          >
            My Donations
            <span className="ml-2 opacity-70">
              {myDonations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab("claims")
            }
            className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "claims"
                ? "bg-[#123b2f] text-white"
                : "text-[#60756c] hover:bg-[#f3f7f1]"
            }`}
          >
            My Claims
            <span className="ml-2 opacity-70">
              {myClaims.length}
            </span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[480px] animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          /* Empty state */
          <div className="mt-10 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-16 text-center">
            <div className="text-5xl">
              {activeTab === "donations"
                ? "🍲"
                : "🥗"}
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-[#123b2f]">
              {activeTab === "donations"
                ? "No donations yet"
                : "No food claims yet"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-[#71847c]">
              {activeTab === "donations"
                ? "Share your extra food and help turn it into someone's meal."
                : "Find available food donations and claim one when you need it."}
            </p>

            <Link
              to={
                activeTab === "donations"
                  ? "/donate"
                  : "/find-food"
              }
              className="mt-7 inline-block rounded-full bg-orange-500 px-7 py-3.5 font-semibold text-white transition hover:bg-orange-600"
            >
              {activeTab === "donations"
                ? "Share Food →"
                : "Find Food →"}
            </Link>
          </div>
        ) : (
          /* History cards */
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {activeList.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                type={
                  activeTab === "donations"
                    ? "donor"
                    : "receiver"
                }
                selectedRating={
                  selectedRating[donation.id] || 0
                }
                setSelectedRating={(rating) =>
                  setSelectedRating((current) => ({
                    ...current,
                    [donation.id]: rating,
                  }))
                }
                submittingRating={
                  submittingRatingId === donation.id
                }
                onSubmitRating={
                  handleSubmitRating
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}