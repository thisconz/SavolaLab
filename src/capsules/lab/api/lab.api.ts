import { api } from "../../../core/http/client";
import type { Sample, TestResult } from "../../../core/types";

export const LabApi = {
  getSamples: async (): Promise<Sample[]> => {
    const res = await api.get<{ success: boolean; data: Sample[] }>(
      `/samples?t=${Date.now()}`,
    );
    return res.data || [];
  },

  getSampleTests: async (sampleId: number): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/samples/${sampleId}/tests`,
    );
    return res.data || [];
  },

  getPreviousResults: async (
    stage: string,
    testType: string,
    limit: number = 5,
  ): Promise<any[]> => {
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/samples/previous-results?stage=${encodeURIComponent(stage)}&testType=${encodeURIComponent(testType)}&limit=${limit}`,
    );
    return res.data || [];
  },

  getTests: async (): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/tests?t=${Date.now()}`,
    );
    return res.data || [];
  },

  registerSample: async (sample: Partial<Sample>): Promise<Sample> => {
    return api.post<Sample>("/samples", sample);
  },

  updateSample: async (
    sampleId: number,
    data: Partial<Sample>,
  ): Promise<Sample> => {
    return api.put<Sample>(`/samples/${sampleId}`, data);
  },

  createTest: async (data: any): Promise<{ id: number }> => {
    return api.post<{ id: number }>("/tests", data);
  },

  updateTest: async (testId: number, data: any): Promise<void> => {
    return api.put(`/tests/${testId}`, data);
  },

  reviewTest: async (
    testId: number,
    status: "APPROVED" | "DISAPPROVED",
    comment?: string,
  ): Promise<void> => {
    return api.post(`/tests/${testId}/review`, { status, comment });
  },
};
