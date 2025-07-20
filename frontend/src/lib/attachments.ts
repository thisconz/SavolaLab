import api from "@/lib/api";
import { AttachmentWire, UploadAttachmentOpts, AttachmentUrlResponse } from "@/types/attatchments";
import { AxiosProgressEvent } from "axios";

export const getAttachmentsBySample = async (batch: string) => {
  const res = await api.get<AttachmentWire[]>(`/attachments/sample/${batch}`);
  return res.data;
};

export const uploadAttachment = async (
  batch: string,
  file: File,
  opts: UploadAttachmentOpts = {},
  onProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<AttachmentWire> => {
  const formData = new FormData();
  formData.append("file", file);

  if (opts.tag) formData.append("tag", opts.tag);
  if (opts.attachmentType) formData.append("attachment_type", opts.attachmentType);
  if (opts.filenameOverride) formData.append("filename", opts.filenameOverride);

  // Some backends honor `Content-Type` per part automatically; no need to set multipart header manually;
  // Axios will set the correct boundary when FormData is passed.
  const res = await api.post(`/attachments/${batch}/upload`, formData, {
    onUploadProgress: onProgress,
  });
  
  return res.data;
};

export const getAttachmentUrl = async (id: string): Promise<AttachmentUrlResponse> => {
  const res = await api.get(`/attachments/${id}/url`);
  return res.data;
};

export const deleteAttachment = async (id: string) => {
  return (await api.delete(`/attachments/${id}`)).data;
};