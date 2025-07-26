"use client";

import Link from "next/link";
import { sampleCategories } from "@/constants/sample";
import { motion, Variants } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function SampleCategoriesPage() {
  return (
    <section className="mx-auto max-w-5xl p-6">
      {/* Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 text-3xl font-extrabold text-gray-900 tracking-tight"
      >
        Select Sample Category
      </motion.h1>

      {/* Category Cards */}
      <motion.ul
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
      >
        {sampleCategories.map(({ key, label }) => (
          <motion.li key={key} variants={cardVariants}>
            <Link
              href={`/dashboard/samples/category/${key}`}
              aria-label={`View samples for ${label}`}
              className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:border-green-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
              <p className="mt-1 text-sm text-gray-500">
                Explore all {label.toLowerCase()} samples.
              </p>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
