"use client";
import { useState } from "react";
import { getAttachmentUrl, deleteAttachment } from "@/lib/attachments";
import { AttachmentWire } from "@/types/attatchments";

export default function AttachmentList({
  attachments,
  onDelete,
}: {
  attachments: AttachmentWire[];
  onDelete: () => Promise<void> | void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const normalizeId = (a: AttachmentWire) => a.id;

  const formatSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const handleDownload = async (id: string) => {
    const { url } = await getAttachmentUrl(id);
    window.open(url, "_blank");
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteAttachment(id);
      await onDelete();
    } finally {
      setBusyId(null);
    }
  };

  if (attachments.length === 0) {
    return <p className="text-sm text-gray-600">No attachments available.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
      </p>
      <div className="divide-y border rounded">
        {attachments.map((att) => {
          const id = normalizeId(att);
          const ts = att.uploaded_at; // Only use uploaded_at if created_at is not present
          const isImage = att.content_type?.startsWith("image/");
          const isPdf = att.content_type === "application/pdf";
          return (
            <div key={id} className="p-3 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{att.file_name ?? "Unnamed"}</p>
                <p className="text-xs text-gray-500">
                  {ts ? new Date(ts).toLocaleString() : "—"} • {formatSize(att.size_bytes)}{" "}
                  {att.uploaded_by && `• by ${att.uploaded_by}`}
                </p>
                {(isImage || isPdf) && (
                  <button
                    onClick={async () => {
                      const { url } = await getAttachmentUrl(id);
                      window.open(url, "_blank");
                    }}
                    className="mt-1 text-xs text-blue-600 hover:underline"
                  >
                    Preview
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Download
                </button>
                <button
                  disabled={busyId === id}
                  onClick={() => handleDelete(id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {busyId === id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
