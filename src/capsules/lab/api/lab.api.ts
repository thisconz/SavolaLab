import { api } from "../../../core/http/client";
import type { Sample, TestResult } from "../../../core/types";

/**
 * LabApi handles all laboratory management interactions for Labrix.
 * Centralizing these calls ensures consistent error handling and type safety.
 */
export const LabApi = {
  // --- Sample Management ---

  getSamples: async (): Promise<Sample[]> => {
    const res = await api.get<{ success: boolean; data: Sample[] }>(
      `/samples?t=${Date.now()}`,
    );
    // Explicitly returning the data array to maintain the Promise<Sample[]> contract
    return res.data || [];
  },

  registerSample: async (sample: Partial<Sample>): Promise<Sample> => {
    // Ensuring the POST request returns the newly created Sample object
    return api.post<Sample>("/samples", sample);
  },

  updateSample: async (
    sampleId: number,
    data: Partial<Sample>,
  ): Promise<Sample> => {
    return api.put<Sample>(`/samples/${sampleId}`, data);
  },

  // --- Test & Results Management ---

  getTests: async (): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/tests?t=${Date.now()}`,
    );
    return res.data || [];
  },

  getSampleTests: async (sampleId: number): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/samples/${sampleId}/tests`,
    );
    return res.data || [];
  },

  /**
   * Fetches historical data for comparison. 
   * Useful for tracking stability or quality control trends.
   */
  getPreviousResults: async (
    stage: string,
    testType: string,
    limit: number = 5,
  ): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/samples/previous-results?stage=${encodeURIComponent(stage)}&testType=${encodeURIComponent(testType)}&limit=${limit}`,
    );
    return res.data || [];
  },

  createTest: async (data: Partial<TestResult>): Promise<{ id: number }> => {
    return api.post<{ id: number }>("/tests", data);
  },

  updateTest: async (testId: number, data: Partial<TestResult>): Promise<void> => {
    return api.put(`/tests/${testId}`, data);
  },

  // --- Quality Control & Review ---

  reviewTest: async (
    testId: number,
    status: "APPROVED" | "DISAPPROVED",
    comment?: string,
  ): Promise<void> => {
    return api.post(`/tests/${testId}/review`, { status, comment });
  },
};