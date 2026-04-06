import { createNotification } from "../../core/db/events";
import { db } from "../../core/database";
import { SampleRepository } from "./repository";
import { AuditService } from "../audit/service";

export type SampleData = {
  batch_id?: string;
  source_stage?: string;
  sample_type?: string;
  priority?: string;
  line_id?: string;
  equipment_id?: string;
  shift_id?: string;
  status?: string;
};

export type TestResultSummary = {
  raw_value: number;
  performed_at: string;
  batch_id: string;
};

export type SampleTest = {
  id: number;
  sample_id: number;
  test_type: string;
  status: "PENDING" | "APPROVED" | "DISAPPROVED" | "COMPLETED" | "VALIDATING";
};

export const SampleService = {
  // --- Get all samples with test counts ---
  getSamples: async (): Promise<any[]> => {
    return await SampleRepository.findAll();
  },

  // --- Create a new sample ---
  createSample: async (
    data: SampleData,
    technicianId: string,
  ): Promise<number> => {
    return await SampleRepository.create({ ...data, technician_id: technicianId });
  },

  // --- Update an existing sample ---
  updateSample: async (
    id: string | number,
    data: SampleData,
    employeeNumber: string,
    ip: string,
  ): Promise<boolean> => {
    const sampleId = Number(id);
    if (isNaN(sampleId)) throw new Error("Invalid sample ID");

    const oldSample = await SampleRepository.findById(sampleId);
    if (!oldSample) throw new Error("Sample not found");

    await SampleRepository.update(sampleId, data);

    // --- Audit log changes ---
    const changes: string[] = [];
    if (data.priority && data.priority !== oldSample.priority)
      changes.push(`Priority: ${oldSample.priority} -> ${data.priority}`);
    if (data.status && data.status !== oldSample.status) {
      changes.push(`Status: ${oldSample.status} -> ${data.status}`);

      // Trigger notification if completed
      if (data.status === "COMPLETED" && oldSample.technician_id) {
        await createNotification(
          oldSample.technician_id,
          "SAMPLE_COMPLETED",
          `Sample ${oldSample.batch_id} analysis has been completed.`,
        );
      }
    }
    if (data.batch_id && data.batch_id !== oldSample.batch_id)
      changes.push(`Batch ID: ${oldSample.batch_id} -> ${data.batch_id}`);
    if (data.source_stage && data.source_stage !== oldSample.source_stage)
      changes.push(`Stage: ${oldSample.source_stage} -> ${data.source_stage}`);

    if (changes.length > 0) {
      const details = `Updated sample #${sampleId}. Changes: ${changes.join(", ")}`;
      await AuditService.createLog(employeeNumber, "SAMPLE_UPDATED", details, ip);
    }

    return true;
  },

  // --- Get previous test results ---
  getPreviousResults: async (
    stage: string,
    testType: string,
    limit: number = 5,
  ): Promise<TestResultSummary[]> => {
    return await SampleRepository.findPreviousResults(stage, testType, limit);
  },

  // --- Get all tests for a sample, or default template ---
  getSampleTests: async (id: string | number): Promise<SampleTest[]> => {
    const sampleId = Number(id);
    if (isNaN(sampleId)) throw new Error("Invalid sample ID");

    const tests = await SampleRepository.findTestsBySampleId(sampleId);

    if (tests.length === 0) {
      const sample = await SampleRepository.findById(sampleId);
      if (!sample) return [];

      const DEFAULT_TESTS: Record<string, string[]> = {
        "Raw Sugar": ["Pol", "Moisture", "Colour"],
        "White Sugar": ["Pol", "Moisture", "Colour", "Ash"],
        "Brown Sugar": ["Pol", "Moisture", "Colour", "Ash"],
        Clarification: ["pH", "Brix"],
        Evaporation: ["Brix", "pH"],
        Crystallization: ["Brix", "Purity"],
      };

      const testsToCreate = DEFAULT_TESTS[sample.source_stage] || [
        "Pol",
        "Moisture",
      ];
      return testsToCreate.map((testType, index) => ({
        id: -(index + 1), // Temporary negative ID for UI
        sample_id: sampleId,
        test_type: testType,
        status: "PENDING",
      }));
    }

    return tests;
  },
};
