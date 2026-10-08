import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { push, ref, set } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

const nowForInput = () => new Date().toISOString().slice(0, 16);

const initialForm = {
  foodType: "",
  category: "veg",
  quantity: "",
  contact: "",
  location: "",
  preparedAt: nowForInput(),
  expiresAt: "",
};

export default function DonateFood() {
  const [form, setForm] = useState(initialForm);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function useCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          location: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(
            4,
          )}`,
        }));
      },
      () => {
        setError(
          "We could not access your location. Enter it manually.",
        );
      },
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!user) {
      setError("Please log in before donating food.");
      return;
    }

    const preparedTimestamp = new Date(
      form.preparedAt,
    ).getTime();

    const expiresAt = new Date(
      form.expiresAt,
    ).getTime();

    if (
      !Number.isFinite(preparedTimestamp) ||
      !Number.isFinite(expiresAt)
    ) {
      setError("Please enter valid preparation and expiry times.");
      return;
    }

    if (expiresAt <= preparedTimestamp) {
      setError("Expiry time must be later than the preparation time.");
      return;
    }

    if (expiresAt <= Date.now()) {
      setError("Expiry time must be in the future.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }

    if (!form.contact.trim()) {
      setError("Please enter your contact number.");
      return;
    }

    if (!form.location.trim()) {
      setError("Please enter the pickup location.");
      return;
    }

    setSubmitting(true);

    try {
      // Create a new donation reference.
      const newDonationRef = push(ref(db, "donations"));

      const donationId = newDonationRef.key;

      if (!donationId) {
        throw new Error("Unable to create a donation ID.");
      }

      const donorName =
        user.displayName ||
        user.email?.split("@")[0] ||
        "FoodShare donor";

      // --------------------------------------------------
      // PUBLIC DONATION DATA
      // --------------------------------------------------
      // IMPORTANT:
      // The donor's phone number is NOT stored here.
      //
      // There is intentionally NO:
      // contact: form.contact.trim()
      //
      // There is also intentionally NO:
      // receiverContact
      //
      await set(newDonationRef, {
        id: donationId,
        foodType: form.foodType.trim(),
        category: form.category,
        quantity,
        location: form.location.trim(),

        donorId: user.uid,
        donorName,

        createdAt: Date.now(),
        preparedTimestamp,
        expiresAt,

        pointsEarned: quantity * 15,
        rating: 0,

        status: "available",

        receiverId: "",
        receiverName: "",

        claimedAt: null,
        receivedAt: null,
      });

      // --------------------------------------------------
      // PRIVATE DONOR CONTACT
      // --------------------------------------------------
      // The donor's phone number is stored separately
      // under donationContacts.
      //
      await set(
        ref(
          db,
          `donationContacts/${donationId}/donor`,
        ),
        {
          name: donorName,
          phone: form.contact.trim(),
        },
      );

      // Reset the form after successful submission.
      setForm({
        ...initialForm,
        preparedAt: nowForInput(),
      });

      setMessage("Food donation shared successfully.");
    } catch (submitError) {
      setError(
        submitError.message ||
          "Unable to share the donation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:py-20 lg:grid-cols-[0.85fr_1.15fr]">
        {/* LEFT SECTION */}
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
            Share Food
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-6xl">
            Your extra food can become
            <span className="block text-orange-500">
              someone&apos;s meal.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#60756c]">
            Add accurate preparation and expiry times so
            recipients only see food that is safe to collect.
          </p>
        </section>

        {/* FORM SECTION */}
        <section className="rounded-3xl border border-[#dce5de] bg-white p-6 shadow-sm sm:p-9">
          {/* LOGIN MESSAGE */}
          {!user && (
            <div className="mb-7 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
              Please{" "}
              <Link
                to="/login"
                className="font-bold underline"
              >
                log in
              </Link>{" "}
              before posting a donation.
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {message && (
            <div className="mb-7 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
              {message}
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* FOOD NAME */}
            <div>
              <label className="text-sm font-bold text-[#123b2f]">
                Food name *
              </label>

              <input
                name="foodType"
                value={form.foodType}
                onChange={handleChange}
                required
                placeholder="Example: Vegetable biryani"
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 outline-none focus:border-orange-400"
              />
            </div>

            {/* CATEGORY + QUANTITY */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-[#123b2f]">
                  Category *
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-[#dce5de] bg-white px-4 py-3.5 outline-none focus:border-orange-400"
                >
                  <option value="veg">
                    Vegetarian
                  </option>

                  <option value="nonveg">
                    Non-vegetarian
                  </option>

                  <option value="vegan">
                    Vegan
                  </option>

                  <option value="bakery">
                    Bakery
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-[#123b2f]">
                  Quantity *
                </label>

                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  placeholder="Example: 10"
                  className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* PREPARED + EXPIRY */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-[#123b2f]">
                  Prepared at *
                </label>

                <input
                  name="preparedAt"
                  type="datetime-local"
                  value={form.preparedAt}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#123b2f]">
                  Expires at *
                </label>

                <input
                  name="expiresAt"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 outline-none focus:border-orange-400"
                />
              </div>
            </div>

            {/* CONTACT */}
            <div>
              <label className="text-sm font-bold text-[#123b2f]">
                Contact number *
              </label>

              <input
                name="contact"
                type="tel"
                value={form.contact}
                onChange={handleChange}
                required
                placeholder="9876543210"
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 outline-none focus:border-orange-400"
              />

              <p className="mt-2 text-xs text-[#71847c]">
                Your number is stored privately and is not
                included in the public donation data.
              </p>
            </div>

            {/* LOCATION */}
            <div>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-bold text-[#123b2f]">
                  Pickup location *
                </label>

                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="text-sm font-bold text-orange-500"
                >
                  Use my location
                </button>
              </div>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                placeholder="Address or map coordinates"
                className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 outline-none focus:border-orange-400"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting || !user}
              className="w-full rounded-full bg-orange-500 px-6 py-4 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Sharing donation..."
                : "Share Food Donation →"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}