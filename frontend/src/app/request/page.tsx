"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }

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
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>Request Access</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" value={email} onChange={handleEmailChange} required />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Request"}
        </button>
      </form>
      <p>Already have an account? <Link href="/login">Login</Link></p>
    </motion.div>
  )
}