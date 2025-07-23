"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, delay } },
});

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-green-100 via-white to-gray-100 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-green-300 rounded-full blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-30 animate-pulse" />

      {/* Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative z-10 w-full max-w-lg space-y-6 rounded-3xl border border-gray-200 bg-white/80 p-10 shadow-2xl backdrop-blur-md"
      >
        {/* Heading */}
        <motion.div variants={fadeIn(0.2)} className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-green-700 tracking-tight">
            Welcome to SavolaLab
          </h1>
          <p className="text-gray-600 text-sm">
            Accurate. Reliable. Trusted Diagnostics.
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={fadeIn(0.3)}
          className="space-y-4 text-gray-700 text-base leading-relaxed"
        >
          <p>
            We are a leading laboratory in the field of medical diagnostics,
            delivering precision and reliability in every test we conduct.
          </p>
          <p>
            Our mission is to empower healthcare professionals and patients
            with accurate, timely, and actionable diagnostic insights.
          </p>
          <p>
            Backed by a team of expert chemists and advanced technology, we
            ensure high-quality results and exceptional customer service.
          </p>
          <p>
            Thank you for trusting{" "}
            <span className="font-extrabold text-green-700">SavolaLab</span> with
            your diagnostic needs.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          variants={fadeIn(0.4)}
          className="text-center"
        >
          <Link
            href="/login"
            className="group relative inline-block w-full rounded-lg bg-green-600 py-3 font-semibold text-lg text-white shadow-md transition-all duration-300 hover:bg-green-700 hover:shadow-lg hover:scale-[1.02] active:scale-95"
          >
            Login
            <span className="absolute inset-0 rounded-lg border-2 border-transparent transition group-hover:border-green-400"></span>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
