import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";

import Navbar from "../components/Navbar";
import { auth, db } from "../firebase";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeProfile = () => {};
    let unsubscribeDonations = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      unsubscribeProfile();
      unsubscribeDonations();

      unsubscribeProfile = onValue(
        ref(db, `users/${currentUser.uid}`),
        (snapshot) => {
          const data = snapshot.val() || {};

          setProfile(data);
          setName(data.name || currentUser.displayName || "");
          setPhotoURL(data.photoURL || currentUser.photoURL || "");
          setLoading(false);
        },
      );

      unsubscribeDonations = onValue(ref(db, "donations"), (snapshot) => {
        const data = snapshot.val() || {};

        setDonations(
          Object.entries(data)
            .map(([id, donation]) => ({ id, ...donation }))
            .filter((donation) => donation.donorId === currentUser.uid),
        );
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeDonations();
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setSaving(true);

    try {
      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
        photoURL: photoURL.trim(),
      });

      await update(ref(db, `users/${user.uid}`), {
        name: name.trim(),
        photoURL: photoURL.trim(),
      });

      setMessage("Your profile has been updated.");
    } catch (saveError) {
      setError(saveError.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  const totalPoints = donations.reduce(
    (total, donation) => total + Number(donation.pointsEarned || 0),
    0,
  );

  const totalQuantity = donations.reduce(
    (total, donation) => total + Number(donation.quantity || 0),
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf3]">
        <Navbar />
        <div className="py-24 text-center text-[#71847c]">
          Loading your profile...
        </div>
      </div>
    );
  }

  const initials = (name || "FoodShare User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-14 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-500">
          My Profile
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#123b2f] md:text-5xl">
          Your FoodShare account.
        </h1>

        <div className="mt-10 grid gap-7 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-3xl bg-[#123b2f] p-7 text-center text-white">
            {photoURL ? (
              <img
                src={photoURL}
                alt={name}
                className="mx-auto h-24 w-24 rounded-full border-4 border-white/20 object-cover"
              />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-orange-500 text-3xl font-extrabold">
                {initials}
              </div>
            )}

            <h2 className="mt-5 text-2xl font-extrabold">
              {name || "FoodShare User"}
            </h2>

            <p className="mt-1 text-sm text-[#c8d8cf]">{user?.email}</p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-2xl font-extrabold">{donations.length}</p>
                <p className="mt-1 text-xs text-[#c8d8cf]">Donations</p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-2xl font-extrabold">{totalPoints}</p>
                <p className="mt-1 text-xs text-[#c8d8cf]">Points</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-[#c8d8cf]">
              {totalQuantity} food portions shared
            </p>

            <Link
              to="/my-donations"
              className="mt-7 inline-block text-sm font-bold text-orange-400 transition hover:text-orange-300"
            >
              View my donations →
            </Link>
          </section>

          <section className="rounded-3xl border border-[#dce5de] bg-white p-7 sm:p-9">
            <h2 className="text-2xl font-extrabold text-[#123b2f]">
              Account details
            </h2>

            <p className="mt-2 text-[#71847c]">
              Keep your FoodShare profile up to date.
            </p>

            {message && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-bold text-[#123b2f]"
                >
                  Full name
                </label>

                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#123b2f]">
                  Email address
                </label>

                <div className="mt-2 rounded-xl border border-[#e7eee9] bg-[#f7faf7] px-4 py-3.5 text-[#71847c]">
                  {user?.email}
                </div>
              </div>

              <div>
                <label
                  htmlFor="photoURL"
                  className="text-sm font-bold text-[#123b2f]"
                >
                  Profile photo URL
                </label>

                <input
                  id="photoURL"
                  type="url"
                  value={photoURL}
                  onChange={(event) => setPhotoURL(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="mt-2 w-full rounded-xl border border-[#dce5de] px-4 py-3.5 text-[#123b2f] outline-none placeholder:text-[#9aaba3] focus:border-orange-400"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-[#123b2f] px-6 py-4 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving changes..." : "Save profile"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}