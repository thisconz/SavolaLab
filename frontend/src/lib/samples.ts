import api from "@/lib/api";

export const getSampleByBatchNumber = async (batchNumber: string) => {
  const response = await api.get(`/samples/${batchNumber}`);
  return response.data;
};
