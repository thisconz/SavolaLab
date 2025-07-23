"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/request_access/", { email });
      alert("Request sent successfully!");
      router.push("/login");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-100 p-6">
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white/90 p-8 shadow-xl backdrop-blur-md"
      >
        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-green-600">Request Access</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your email address to request access to the system.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-green-400 focus:ring-2 focus:ring-green-400"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.96 }}
            className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Request"}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-green-600 hover:text-green-700"
          >
            Login
          </Link>
        </p>
      </motion.section>
    </main>
  );
}
