import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-100">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-lg space-y-5 border border-gray-100">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-green-600 tracking-tight">
            Welcome to SavolaLab
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Accurate. Reliable. Trusted Diagnostics.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 text-gray-800 text-sm leading-relaxed">
          <p>
            We are a leading laboratory in the field of medical diagnostics,
            delivering precision and reliability in every test we conduct.
          </p>
          <p>
            Our mission is to empower healthcare professionals and patients with
            accurate, timely, and actionable diagnostic insights.
          </p>
          <p>
            Backed by a team of expert chemists and advanced technology, we
            ensure high-quality results and exceptional customer service.
          </p>
          <p>
            Thank you for trusting <span className="font-extrabold">SavolaLab</span> with
            your diagnostic needs.
          </p>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/login"
            className="w-full block bg-green-600 text-white py-2.5 rounded-lg font-medium text-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-300"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
