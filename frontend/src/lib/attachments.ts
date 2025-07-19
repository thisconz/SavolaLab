import api from "@/lib/api";

export interface RawAttachment {
  id?: string;
  attachment_id?: string;
  filename: string;
  original_filename?: string;
  uploaded_at?: string;
  created_at?: string;
  size_bytes?: number;
  content_type?: string;
  uploaded_by?: string;
}

export const getAttachmentsBySample = async (batch: string) => {
  const res = await api.get(`/attachments/sample/${batch}`);
  return res.data;
};

export const uploadAttachment = async (batch: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file); // confirm backend expects "file"
  return (await api.post(`/attachments/${batch}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;
};

export const getAttachmentUrl = async (id: string) => {
  return (await api.get(`/attachments/${id}/url`)).data;
};

export const deleteAttachment = async (id: string) => {
  return (await api.delete(`/attachments/${id}`)).data;
};