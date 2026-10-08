export default function FoodShareImpact() {
  const stats = [
    {
      value: "12,540+",
      label: "Meals Shared",
    },
    {
      value: "3,280+",
      label: "Food Donations",
    },
    {
      value: "850+",
      label: "People Helped",
    },
    {
      value: "2.4T",
      label: "Food Waste Reduced",
    },
  ];

  return (
    <section className="bg-[#fbf8f1] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        {/* Section heading */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-orange-500">
            OUR IMPACT
          </p>

          <h2 className="text-4xl font-black tracking-tight text-[#123b2f] md:text-6xl">
            Small actions.{" "}
            <span className="text-orange-500">
              Big impact.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#60756c]">
            Every donation helps reduce food waste and connects surplus
            food with people who need it.
          </p>
        </div>

        {/* Statistics */}
        <div className="mt-16 grid grid-cols-2 border-y border-[#dce5de] md:grid-cols-4">

          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-6 py-10 text-center md:py-12 ${
                index !== 0 ? "md:border-l md:border-[#dce5de]" : ""
              } ${
                index === 2
                  ? "border-t border-[#dce5de] md:border-t-0"
                  : ""
              } ${
                index === 3
                  ? "border-t border-[#dce5de] md:border-t-0"
                  : ""
              }`}
            >

              <div className="text-4xl font-black tracking-tight text-[#123b2f] md:text-5xl">
                {stat.value}
              </div>

              <div className="mt-3 text-sm font-medium text-[#71847c] md:text-base">
                {stat.label}
              </div>

            </div>
          ))}

        </div>

        {/* Bottom statement */}
        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-[24px] bg-[#123b2f] px-8 py-7 text-center md:flex-row md:text-left">

          <div>
            <p className="text-lg font-bold text-white">
              Together, we can make every meal count.
            </p>

            <p className="mt-1 text-sm text-[#c5d8cf]">
              Your surplus food can become someone's next meal.
            </p>
          </div>

          <a
            href="#donate"
            className="shrink-0 rounded-full bg-orange-500 px-7 py-3.5 font-bold text-white transition hover:bg-orange-600"
          >
            Donate Food →
          </a>

        </div>

      </div>
    </section>
  );
}