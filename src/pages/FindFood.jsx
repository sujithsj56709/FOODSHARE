import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  onValue,
  ref,
  runTransaction,
  set,
} from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

const categoryEmoji = {
  veg: "🥗",
  nonveg: "🍱",
  vegan: "🥬",
  bakery: "🍞",
  other: "🍽️",
};

function timeAgo(timestamp, now) {
  const minutes = Math.max(
    0,
    Math.floor((now - timestamp) / 60000),
  );

  if (minutes < 1) return "Prepared just now";

  if (minutes < 60) {
    return `Prepared ${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Prepared ${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(hours / 24);

  return `Prepared ${days} day${
    days === 1 ? "" : "s"
  } ago`;
}

function expiresIn(expiresAt, now) {
  const minutes = Math.max(
    0,
    Math.ceil((expiresAt - now) / 60000),
  );

  if (minutes < 60) {
    return `Expires in ${minutes} min`;
  }

  const hours = Math.ceil(minutes / 60);

  return `Expires in ${hours} hour${
    hours === 1 ? "" : "s"
  }`;
}

function whatsappLink(contact, foodType) {
  let phone = (contact || "").replace(/\D/g, "");

  if (phone.length === 10) {
    phone = `91${phone}`;
  }

  const message = `Hello, I claimed your FoodShare donation for ${foodType}. I would like to coordinate the pickup.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message,
  )}`;
}

export default function FindFood() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(Date.now());

  const [claimingId, setClaimingId] = useState("");
  const [receiverContact, setReceiverContact] = useState("");

  const [privateContacts, setPrivateContacts] =
    useState({});

  const [ratings, setRatings] = useState({});
  const [ratingValues, setRatingValues] = useState({});
  const [submittingRating, setSubmittingRating] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --------------------------------------------------
  // AUTH + DONATIONS
  // --------------------------------------------------

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      setUser,
    );

    const unsubscribeDonations = onValue(
      ref(db, "donations"),
      (snapshot) => {
        const data = snapshot.val() || {};

        setDonations(
          Object.entries(data).map(
            ([id, donation]) => ({
              id,
              ...donation,
            }),
          ),
        );
      },
    );

    const interval = window.setInterval(
      () => setNow(Date.now()),
      60000,
    );

    return () => {
      unsubscribeAuth();
      unsubscribeDonations();
      window.clearInterval(interval);
    };
  }, []);

  // --------------------------------------------------
  // LOAD RATINGS
  // --------------------------------------------------

  useEffect(() => {
    const unsubscribe = onValue(
      ref(db, "ratings"),
      (snapshot) => {
        setRatings(snapshot.val() || {});
      },
    );

    return unsubscribe;
  }, []);

  // --------------------------------------------------
  // PRIVATE CONTACTS
  // --------------------------------------------------

  useEffect(() => {
    if (!user || donations.length === 0) {
      setPrivateContacts({});
      return;
    }

    const unsubscribers = [];

    donations.forEach((donation) => {
      const isDonor =
        donation.donorId === user.uid;

      const isReceiver =
        donation.receiverId === user.uid;

      if (!isDonor && !isReceiver) {
        return;
      }

      const contactRef = ref(
        db,
        `donationContacts/${donation.id}`,
      );

      const unsubscribe = onValue(
        contactRef,
        (snapshot) => {
          setPrivateContacts((current) => ({
            ...current,
            [donation.id]:
              snapshot.val() || {},
          }));
        },
      );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(
        (unsubscribe) => unsubscribe(),
      );
    };
  }, [user, donations]);

  // --------------------------------------------------
  // VISIBLE DONATIONS
  // --------------------------------------------------

  const visibleDonations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return donations
      .filter((donation) => {
        if (
          !donation.expiresAt ||
          donation.expiresAt <= now
        ) {
          return false;
        }

        const isAvailable =
          donation.status === "available";

        const isReceiverProcessing =
          donation.status === "processing" &&
          donation.receiverId === user?.uid;

        const isDonorProcessing =
          donation.status === "processing" &&
          donation.donorId === user?.uid;

        if (
          !isAvailable &&
          !isReceiverProcessing &&
          !isDonorProcessing
        ) {
          return false;
        }

        return (
          !query ||
          donation.foodType
            ?.toLowerCase()
            .includes(query) ||
          donation.category
            ?.toLowerCase()
            .includes(query) ||
          donation.donorName
            ?.toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (a, b) =>
          (b.preparedTimestamp ||
            b.createdAt ||
            0) -
          (a.preparedTimestamp ||
            a.createdAt ||
            0),
      );
  }, [
    donations,
    now,
    search,
    user,
  ]);

  // --------------------------------------------------
  // CLAIM DONATION
  // --------------------------------------------------

  async function claimDonation(donation) {
    setError("");
    setMessage("");

    if (!user) {
      setError(
        "Please log in before claiming food.",
      );
      return;
    }

    if (donation.donorId === user.uid) {
      setError(
        "You cannot claim your own donation.",
      );
      return;
    }

    if (!receiverContact.trim()) {
      setError(
        "Enter your contact number to claim this food.",
      );
      return;
    }

    try {
      const result = await runTransaction(
        ref(
          db,
          `donations/${donation.id}`,
        ),
        (currentDonation) => {
          if (
            !currentDonation ||
            currentDonation.status !==
              "available" ||
            !currentDonation.expiresAt ||
            currentDonation.expiresAt <=
              Date.now()
          ) {
            return;
          }

          return {
            ...currentDonation,

            status: "processing",

            receiverId: user.uid,

            receiverName:
              user.displayName ||
              user.email?.split("@")[0] ||
              "FoodShare receiver",

            receiverContact: "",

            claimedAt: Date.now(),
          };
        },
      );

      if (!result.committed) {
        setError(
          "This food is no longer available.",
        );
        return;
      }

      // Store receiver contact privately.
      await set(
        ref(
          db,
          `donationContacts/${donation.id}/receiver`,
        ),
        {
          name:
            user.displayName ||
            user.email?.split("@")[0] ||
            "FoodShare receiver",

          phone: receiverContact.trim(),
        },
      );

      setClaimingId("");
      setReceiverContact("");

      setMessage(
        "Food claimed. Contact the donor, collect it before expiry, then confirm receipt.",
      );
    } catch (claimError) {
      setError(
        claimError.message ||
          "Unable to claim this donation.",
      );
    }
  }

  // --------------------------------------------------
  // CONFIRM RECEIVED
  // --------------------------------------------------

  async function confirmReceived(donation) {
    setError("");
    setMessage("");

    if (!user) {
      setError(
        "Please log in before confirming collection.",
      );
      return;
    }

    try {
      const result = await runTransaction(
        ref(
          db,
          `donations/${donation.id}`,
        ),
        (currentDonation) => {
          if (
            !currentDonation ||
            currentDonation.status !==
              "processing" ||
            currentDonation.receiverId !==
              user.uid
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
        setError(
          "This donation can no longer be confirmed.",
        );
        return;
      }

      setMessage(
        "Collection confirmed. Thank you for completing the pickup!",
      );
    } catch (confirmError) {
      setError(
        confirmError.message ||
          "Unable to confirm collection.",
      );
    }
  }

  // --------------------------------------------------
  // SUBMIT RATING
  // --------------------------------------------------

  async function submitRating(donation) {
    setError("");
    setMessage("");

    if (!user) {
      setError(
        "Please log in before submitting a rating.",
      );
      return;
    }

    if (
      donation.receiverId !== user.uid
    ) {
      setError(
        "Only the person who claimed this food can rate it.",
      );
      return;
    }

    if (donation.status !== "completed") {
      setError(
        "You can rate the food after confirming that you received it.",
      );
      return;
    }

    const selectedRating = Number(
      ratingValues[donation.id],
    );

    if (
      !Number.isInteger(selectedRating) ||
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setError(
        "Please select a rating from 1 to 5 stars.",
      );
      return;
    }

    // Prevent duplicate rating.
    if (ratings[donation.id]) {
      setError(
        "You have already rated this donation.",
      );
      return;
    }

    setSubmittingRating(donation.id);

    try {
      // IMPORTANT:
      // Rating is saved under /ratings, NOT
      // /donations/{donationId}/rating.
      //
      // This matches the Firebase rule:
      // "ratings": {
      //   ".read": true,
      //   ".write": "auth != null"
      // }

      await set(
        ref(
          db,
          `ratings/${donation.id}`,
        ),
        {
          donationId: donation.id,
          donorId: donation.donorId,
          donorName: donation.donorName || "",
          receiverId: donation.receiverId,
          receiverName:
            donation.receiverName || "",
          foodType: donation.foodType || "",
          rating: selectedRating,
          createdAt: Date.now(),
        },
      );

      setRatingValues((current) => ({
        ...current,
        [donation.id]: "",
      }));

      setMessage(
        "Thank you! Your food rating has been submitted.",
      );
    } catch (ratingError) {
      setError(
        ratingError.message ||
          "Unable to submit the rating.",
      );
    } finally {
      setSubmittingRating("");
    }
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            Find Food
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-6xl">
            Food ready to
            <span className="block text-orange-500">
              be shared.
            </span>
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#60756c]">
            Claim fresh food, contact the donor,
            confirm collection, and rate your
            experience.
          </p>
        </div>

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

        <div className="mt-10 rounded-3xl border border-[#dce5de] bg-white p-5">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search food, category, or donor..."
            className="w-full rounded-full border border-[#dce5de] px-5 py-3.5 text-[#123b2f] outline-none placeholder:text-[#9aaba3] focus:border-orange-400"
          />
        </div>

        {!user && (
          <div className="mt-6 rounded-2xl bg-[#e8f1ea] px-5 py-4 text-sm text-[#123b2f]">
            <Link
              to="/login"
              className="font-bold underline"
            >
              Log in
            </Link>{" "}
            to claim food and contact donors.
          </div>
        )}

        {visibleDonations.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[#cbdacf] bg-white px-6 py-16 text-center">
            <p className="text-xl font-bold text-[#123b2f]">
              No active food donations right now.
            </p>

            <p className="mt-3 text-[#71847c]">
              Expired and completed donations are
              automatically removed.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleDonations.map(
              (donation) => {
                const isReceiver =
                  donation.receiverId ===
                  user?.uid;

                const isDonor =
                  donation.donorId === user?.uid;

                const isProcessing =
                  donation.status ===
                  "processing";

                const isCompleted =
                  donation.status ===
                  "completed";

                const emoji =
                  categoryEmoji[
                    donation.category
                  ] || "🍽️";

                const privateContact =
                  privateContacts[
                    donation.id
                  ] || {};

                const donorContact =
                  privateContact.donor
                    ?.phone || "";

                const receiverPrivateContact =
                  privateContact.receiver
                    ?.phone || "";

                const existingRating =
                  ratings[donation.id];

                return (
                  <article
                    key={donation.id}
                    className="overflow-hidden rounded-3xl border border-[#dce5de] bg-white shadow-sm"
                  >
                    <div className="flex h-36 items-center justify-between bg-[#e8f1ea] px-7">
                      <span className="text-6xl">
                        {emoji}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          isProcessing
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isProcessing
                          ? "Processing"
                          : isCompleted
                          ? "Completed"
                          : "Available"}
                      </span>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                        {donation.category ||
                          "Food donation"}
                      </p>

                      <h2 className="mt-2 text-2xl font-extrabold capitalize text-[#123b2f]">
                        {donation.foodType ||
                          "Food donation"}
                      </h2>

                      <div className="mt-5 space-y-2 text-sm text-[#60756c]">
                        <p>
                          <span className="font-semibold text-[#123b2f]">
                            Quantity:
                          </span>{" "}
                          {donation.quantity ||
                            0}{" "}
                          items
                        </p>

                        <p>
                          {timeAgo(
                            donation.preparedTimestamp ||
                              donation.createdAt,
                            now,
                          )}
                        </p>

                        <p className="font-semibold text-orange-600">
                          {expiresIn(
                            donation.expiresAt,
                            now,
                          )}
                        </p>
                      </div>

                      <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(
                          donation.location ||
                            "",
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 block rounded-full border border-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
                      >
                        View pickup location →
                      </a>

                      {/* CLAIM FOOD */}
                      {donation.status ===
                        "available" &&
                        !isDonor && (
                          <>
                            {claimingId ===
                            donation.id ? (
                              <div className="mt-4 rounded-2xl bg-[#f3f7f1] p-4">
                                <label className="text-sm font-bold text-[#123b2f]">
                                  Your contact number
                                </label>

                                <input
                                  type="tel"
                                  value={
                                    receiverContact
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setReceiverContact(
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder="For the donor to contact you"
                                  className="mt-2 w-full rounded-xl border border-[#dce5de] bg-white px-3 py-2.5 outline-none focus:border-orange-400"
                                />

                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      claimDonation(
                                        donation,
                                      )
                                    }
                                    className="flex-1 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white"
                                  >
                                    Confirm claim
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClaimingId(
                                        "",
                                      );
                                      setReceiverContact(
                                        "",
                                      );
                                    }}
                                    className="rounded-full border border-[#123b2f] px-4 py-2.5 text-sm font-bold text-[#123b2f]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!user) {
                                    setError(
                                      "Please log in before claiming food.",
                                    );
                                    return;
                                  }

                                  setError("");
                                  setClaimingId(
                                    donation.id,
                                  );
                                }}
                                className="mt-4 w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
                              >
                                Claim food
                              </button>
                            )}
                          </>
                        )}

                      {/* RECEIVER VIEW */}
                      {isProcessing &&
                        isReceiver && (
                          <div className="mt-4 space-y-3">
                            {donorContact ? (
                              <>
                                <a
                                  href={`tel:${donorContact}`}
                                  className="block rounded-full border border-[#123b2f] px-5 py-3 text-center text-sm font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
                                >
                                  Call donor:{" "}
                                  {
                                    donorContact
                                  }
                                </a>

                                <a
                                  href={whatsappLink(
                                    donorContact,
                                    donation.foodType,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-full bg-[#25D366] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
                                >
                                  WhatsApp donor
                                </a>
                              </>
                            ) : (
                              <p className="rounded-2xl bg-[#f3f7f1] px-4 py-3 text-sm text-[#60756c]">
                                Donor contact is
                                loading...
                              </p>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                confirmReceived(
                                  donation,
                                )
                              }
                              className="w-full rounded-full bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
                            >
                              Confirm food received
                            </button>
                          </div>
                        )}

                      {/* DONOR VIEW */}
                      {isProcessing &&
                        isDonor && (
                          <div className="mt-4 space-y-3 rounded-2xl bg-[#f3f7f1] p-4 text-sm text-[#60756c]">
                            <p>
                              Claimed by{" "}
                              <strong>
                                {
                                  donation.receiverName
                                }
                              </strong>
                              .
                            </p>

                            {receiverPrivateContact ? (
                              <>
                                <a
                                  href={`tel:${receiverPrivateContact}`}
                                  className="block rounded-full border border-[#123b2f] px-4 py-2.5 text-center font-semibold text-[#123b2f] transition hover:bg-[#123b2f] hover:text-white"
                                >
                                  Call receiver:{" "}
                                  {
                                    receiverPrivateContact
                                  }
                                </a>

                                <a
                                  href={whatsappLink(
                                    receiverPrivateContact,
                                    donation.foodType,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-full bg-[#25D366] px-4 py-2.5 text-center font-semibold text-white transition hover:bg-[#1ebe5d]"
                                >
                                  WhatsApp receiver
                                </a>
                              </>
                            ) : (
                              <p>
                                Receiver contact is
                                loading...
                              </p>
                            )}
                          </div>
                        )}

                      {/* RATING */}
                      {isCompleted &&
                        isReceiver && (
                          <div className="mt-5 rounded-2xl bg-[#f3f7f1] p-4">
                            {existingRating ? (
                              <div className="text-center">
                                <p className="text-sm font-bold text-[#123b2f]">
                                  You rated this
                                  donation
                                </p>

                                <div className="mt-2 text-2xl">
                                  {"⭐".repeat(
                                    Number(
                                      existingRating.rating,
                                    ),
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-[#60756c]">
                                  {
                                    existingRating.rating
                                  }{" "}
                                  / 5
                                </p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-bold text-[#123b2f]">
                                  Rate this food
                                </p>

                                <div className="mt-3 flex justify-center gap-1">
                                  {[1, 2, 3, 4, 5].map(
                                    (star) => {
                                      const selected =
                                        Number(
                                          ratingValues[
                                            donation
                                              .id
                                          ],
                                        ) >=
                                        star;

                                      return (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() =>
                                            setRatingValues(
                                              (
                                                current,
                                              ) => ({
                                                ...current,
                                                [donation.id]:
                                                  star,
                                              }),
                                            )
                                          }
                                          className={`text-3xl transition ${
                                            selected
                                              ? "scale-110"
                                              : "opacity-40 hover:opacity-80"
                                          }`}
                                          aria-label={`Rate ${star} out of 5`}
                                        >
                                          ⭐
                                        </button>
                                      );
                                    },
                                  )}
                                </div>

                                <button
                                  type="button"
                                  disabled={
                                    submittingRating ===
                                    donation.id
                                  }
                                  onClick={() =>
                                    submitRating(
                                      donation,
                                    )
                                  }
                                  className="mt-3 w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {submittingRating ===
                                  donation.id
                                    ? "Submitting..."
                                    : "Submit rating"}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </main>
    </div>
  );
}
