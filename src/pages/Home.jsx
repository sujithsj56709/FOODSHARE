import Navbar from "@/components/Navbar";
import FoodShareHero from "@/components/FoodShareHero";
import ImpactStats from "@/components/ImpactStats";
import HowItWorks from "@/components/HowItWorks";
import FeaturedDonations from "@/components/FeaturedDonations";
import Leaderboard from "@/components/Leaderboard";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffaf3]">
      <Navbar />

      <main>
        <FoodShareHero />
        <ImpactStats />
        <HowItWorks />
        <FeaturedDonations />
        <Leaderboard />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
}