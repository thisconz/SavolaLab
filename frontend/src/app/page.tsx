"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-gray-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-green-300 rounded-full blur-3xl opacity-40 animate-pulse" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-full max-w-lg space-y-6 border border-gray-200 relative z-10"
      >
        {/* Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-green-700 tracking-tight">
            Welcome to SavolaLab
          </h1>
          <p className="text-gray-600 text-sm">
            Accurate. Reliable. Trusted Diagnostics.
          </p>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 text-gray-700 text-base leading-relaxed"
        >
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
            Thank you for trusting{" "}
            <span className="font-extrabold text-green-700">SavolaLab</span> with
            your diagnostic needs.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="/login"
            className="w-full block bg-green-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all duration-300"
          >
            Login
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
