"use client";

import UserUpdateForm from "@/components/user/UserUpdateForm";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

export default function UserPage() {
  return (
    <ProtectedRoute>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn()}
        className="max-w-7xl mx-auto px-6 py-10"
      >
        <UserUpdateForm />
      </motion.div>
    </ProtectedRoute>
  );
}