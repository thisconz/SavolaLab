"use client";

import { useState } from "react";
import { uploadAttachment } from "@/lib/attachments";

export default function AttachmentUpload({ batchNumber, onUploadSuccess }: {
  batchNumber: string; onUploadSuccess: () => Promise<void> | void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSelect = (f: File | null) => {
    setFile(f);
    setMsg(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(null);
    setMsg(null);
    try {
      await uploadAttachment(batchNumber, file);
      setMsg({ type: "ok", text: "Uploaded." });
      setFile(null);
      await onUploadSuccess();
    } catch (e: any) {
      setMsg({ type: "err", text: "Upload failed." });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label
          className="px-4 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleSelect(e.target.files?.[0] || null)}
          />
          {file ? "Change File" : "Choose File"}
        </label>
        <span className="text-sm text-gray-600">{file?.name || "No file chosen"}</span>
        <button
          disabled={!file || busy}
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded hover:bg-blue-700"
        >
          {busy ? "Uploading..." : "Upload"}
        </button>
      </div>
      {progress !== null && (
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }} />
        </div>
      )}
      {msg && (
        <p className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
