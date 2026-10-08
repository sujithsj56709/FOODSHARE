import { ArrowRight, Heart, MapPin, Utensils } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Utensils,
    title: "Donate Surplus Food",
    description:
      "Have extra food? Add the details, quantity and pickup location in just a few clicks.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "We Find the Right People",
    description:
      "FoodShare connects your donation with nearby communities and people who need it.",
  },
  {
    number: "03",
    icon: Heart,
    title: "Make Someone's Day",
    description:
      "Your food reaches someone who needs it, turning surplus into a meaningful meal.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#f8f6ef] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-orange-500">
            HOW IT WORKS
          </p>

          <h2 className="text-4xl font-black tracking-tight text-[#123b2f] md:text-6xl">
            From extra food
            <br />
            <span className="text-orange-500">to meaningful meals.</span>
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            FoodShare makes donating surplus food simple, transparent and
            impactful.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group relative overflow-hidden rounded-[28px] border border-[#dce5de] bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                {/* Number */}
                <div className="mb-10 flex items-center justify-between">
                  <span className="text-sm font-bold tracking-widest text-slate-400">
                    {step.number}
                  </span>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3ed] text-[#123b2f] transition-colors group-hover:bg-orange-500 group-hover:text-white">
                    <Icon size={25} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-[#123b2f]">
                  {step.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-500">
                  {step.description}
                </p>

                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="mt-8 hidden items-center gap-2 text-sm font-semibold text-orange-500 md:flex">
                    Next step
                    <ArrowRight size={17} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[28px] bg-[#123b2f] p-8 md:flex-row md:items-center md:px-10">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Have food to share?
            </h3>
            <p className="mt-2 text-[#c8ddd2]">
              Someone nearby could use it.
            </p>
          </div>

          <button className="rounded-full bg-orange-500 px-7 py-3.5 font-bold text-white transition hover:bg-orange-600">
            Donate Food →
          </button>
        </div>
      </div>
    </section>
  );
}