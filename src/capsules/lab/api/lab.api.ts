import { api } from "../../../core/http/client";
import {
  Sample,
  GetSamplesResponseSchema,
  CreateSampleRequest,
  UpdateSampleRequest,
} from "../../../shared/schemas/sample.schema";
import type { TestResult } from "../../../core/types";

export const LabApi = {
  // ─────────────────────────────────────────────
  // Samples
  // ─────────────────────────────────────────────

  getSamples: async (): Promise<Sample[]> => {
    const res = await api.get<any>(`/samples?t=${Date.now()}`);
    const validated = GetSamplesResponseSchema.safeParse(res);

    if (!validated.success) {
      console.warn(
        "[LabApi.getSamples] Zod validation failed:",
        validated.error.flatten(),
      );
      throw new Error("Invalid API response schema");
    }
    return validated.data.data;
  },

  registerSample: async (
    sample: Partial<{
      batch_id: string;
      sample_type: string;
      source_stage: string;
      priority: string;
      status: string;
      line_id?: string;
      equipment_id?: string;
      shift_id?: string;
    }>,
  ): Promise<{ id: number }> => {
    return api.post<{ id: number }>("/samples", sample);
  },

  updateSample: async (
    sampleId: number,
    data: Partial<Sample>,
  ): Promise<void> => {
    return api.put(`/samples/${sampleId}`, data);
  },

  // ─────────────────────────────────────────────
  // Tests
  // ─────────────────────────────────────────────

  getTests: async (): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/tests?t=${Date.now()}`,
    );
    return res.data ?? [];
  },

  getSampleTests: async (sampleId: number): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/samples/${sampleId}/tests`,
    );
    return res.data ?? [];
  },

  getPreviousResults: async (
    stage: string,
    testType: string,
    limit = 5,
  ): Promise<TestResult[]> => {
    const res = await api.get<{ success: boolean; data: TestResult[] }>(
      `/samples/previous-results?stage=${encodeURIComponent(stage)}&testType=${encodeURIComponent(testType)}&limit=${limit}`,
    );
    return res.data ?? [];
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

  reviewTest: async (
    testId: number,
    status: "APPROVED" | "DISAPPROVED",
    comment?: string,
  ): Promise<void> => {
    return api.post(`/tests/${testId}/review`, {
      status,
      comment: comment ?? null,
    });
  },
};
