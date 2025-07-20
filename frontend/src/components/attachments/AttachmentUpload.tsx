"use client";

import { useState, useRef } from "react";
import { uploadAttachment } from "@/lib/attachments";
import { motion, AnimatePresence } from "framer-motion";

interface AttachmentUploadProps {
  batchNumber: string;
  onUploadSuccess: () => Promise<void> | void;
}

export default function AttachmentUpload({ batchNumber, onUploadSuccess }: AttachmentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleSelect = (f: File | null) => {
    if (f) {
      if (f.size > 10 * 1024 * 1024) { // 10 MB limit
        setMsg({ type: "err", text: "File size exceeds 10 MB limit." });
        return;
      }
      setFile(f);
      setMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setMsg(null);

    try {
      await uploadAttachment(batchNumber, file, {}, (evt) => {
        if (evt.total) {
          setProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      });
      setMsg({ type: "ok", text: "Uploaded successfully." });
      setFile(null);
      await onUploadSuccess();
    } catch (e: any) {
      setMsg({ type: "err", text: "Upload failed. Please try again." });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition 
          ${file ? "border-green-400 bg-green-50" : "border-gray-300 hover:bg-gray-50"}`}
      >
        <label className="cursor-pointer text-blue-600 hover:underline">
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleSelect(e.target.files?.[0] || null)}
          />
          {file ? `Selected: ${file.name}` : "Drag & drop or click to choose a file"}
        </label>
        {file && (
          <button
            onClick={() => setFile(null)}
            className="ml-3 text-sm text-red-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <button
          disabled={!file || busy}
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {progress !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-2 bg-gray-200 rounded overflow-hidden"
          >
            <motion.div
              className="h-2 bg-blue-600 rounded"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message */}
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}
          >
            {msg.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
