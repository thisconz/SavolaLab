import { createNotification } from "../../core/db/events";
import { SampleRepository } from "./repository";
import { AuditService } from "../audit/service";

export type SampleData = {
  batch_id?:     string;
  sample_type?:  string;
  source_stage?: string;
  priority?:     string;
  line_id?:      string | number | null;
  equipment_id?: string | number | null;
  shift_id?:     string | number | null;
  status?:       string;
};

export type TestResultSummary = {
  raw_value:    number;
  performed_at: string;
  batch_id:     string;
};

export type SampleTest = {
  id:         number;
  sample_id:  number;
  test_type:  string;
  status:     "PENDING" | "APPROVED" | "DISAPPROVED" | "COMPLETED" | "VALIDATING";
};

const DEFAULT_TESTS: Record<string, string[]> = {
  "Raw sugar":        ["Pol", "Moisture", "Colour"],
  "White sugar":      ["Pol", "Moisture", "Colour", "Ash"],
  "Brown sugar":      ["Pol", "Moisture", "Colour", "Ash"],
  "Raw Handling":     ["Brix", "pH"],
  "Refining":         ["Brix", "Purity", "Colour"],
  "Clarification":    ["pH", "Brix"],
  "Evaporation":      ["Brix", "pH"],
  "Crystallization":  ["Brix", "Purity"],
  "Centrifuge":       ["Pol", "Moisture"],
};

export const SampleService = {
  getSamples: async (): Promise<any[]> => {
    return SampleRepository.findAll();
  },

  createSample: async (data: SampleData, technicianId: string): Promise<number> => {
    return SampleRepository.create({ ...data, technician_id: technicianId });
  },

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

    // Build audit trail
    const changes: string[] = [];

    if (data.priority && data.priority !== oldSample.priority)
      changes.push(`Priority: ${oldSample.priority} → ${data.priority}`);

    if (data.status && data.status !== oldSample.status) {
      changes.push(`Status: ${oldSample.status} → ${data.status}`);

      if (data.status === "COMPLETED" && oldSample.technician_id) {
        await createNotification(
          oldSample.technician_id,
          "SAMPLE_COMPLETED",
          `Sample ${oldSample.batch_id} analysis has been completed.`,
        );
      }
    }

    if (data.batch_id && data.batch_id !== oldSample.batch_id)
      changes.push(`Batch ID: ${oldSample.batch_id} → ${data.batch_id}`);

    if (data.source_stage && data.source_stage !== oldSample.source_stage)
      changes.push(`Stage: ${oldSample.source_stage} → ${data.source_stage}`);

    if (changes.length > 0) {
      await AuditService.createLog(
        employeeNumber,
        "SAMPLE_UPDATED",
        `Updated sample #${sampleId}. Changes: ${changes.join(", ")}`,
        ip,
      );
    }

    return true;
  },

  getPreviousResults: async (
    stage: string,
    testType: string,
    limit = 5,
  ): Promise<TestResultSummary[]> => {
    return SampleRepository.findPreviousResults(stage, testType, limit);
  },

  getSampleTests: async (id: string | number): Promise<SampleTest[]> => {
    const sampleId = Number(id);
    if (isNaN(sampleId)) throw new Error("Invalid sample ID");

    const tests = await SampleRepository.findTestsBySampleId(sampleId);
    if (tests.length > 0) return tests;

    // Generate default test panel based on stage or sample_type
    const sample = await SampleRepository.findById(sampleId);
    if (!sample) return [];

    const key = sample.source_stage || sample.sample_type || "";
    const panel = DEFAULT_TESTS[key] ?? ["Pol", "Moisture"];

    return panel.map((testType: string, index: number) => ({
      id: -(index + 1), // Temporary negative ID — not yet persisted
      sample_id: sampleId,
      test_type: testType,
      status: "PENDING" as const,
    }));
  },
};