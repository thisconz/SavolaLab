import { api } from "../../../core/http/client";
import { 
  Sample, 
  GetSamplesResponseSchema,
  CreateSampleRequest,
  UpdateSampleRequest
} from "../model/sample.model";
import type { TestResult } from "../../../core/types";

/**
 * LabApi handles all laboratory management interactions for Zenthar.
 * Centralizing these calls ensures consistent error handling and type safety.
 */
export const LabApi = {
  // --- Sample Management ---

  getSamples: async (): Promise<Sample[]> => {
    const res = await api.get<any>(`/samples?t=${Date.now()}`);
    const validated = GetSamplesResponseSchema.parse(res);
    return validated.data || [];
  },

  registerSample: async (sample: CreateSampleRequest): Promise<{ id: number }> => {
    return api.post<{ id: number }>("/samples", sample);
  },

  updateSample: async (
    sampleId: number,
    data: UpdateSampleRequest,
  ): Promise<void> => {
    return api.put(`/samples/${sampleId}`, data);
  },

  // --- Test & Results Management ---
  // ... rest of the methods

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

  updateTest: async (
    testId: number,
    data: Partial<TestResult>,
  ): Promise<void> => {
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
