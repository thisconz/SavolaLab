import { useState, useEffect } from "react";
import { LabApi } from "../api/lab.api";
import { AuditApi } from "../../audit/api/audit.api";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import type { Sample, TestResult } from "../../../core/types";
import { SampleStatus } from "../../../core/types";

export const useSampleDetails = (sample: Sample, onUpdate: () => void) => {
  const [isEditing,    setIsEditing]    = useState(false);
  const [editedSample, setEditedSample] = useState<Partial<Sample>>({});
  const [isSaving,     setIsSaving]     = useState(false);
  const [testResults,  setTestResults]  = useState<TestResult[]>([]);
  const { currentUser } = useAuthStore();

  // Populate edit form when editing starts
  useEffect(() => {
    if (isEditing) {
      setEditedSample({
        batch_id:     sample.batch_id     ?? "",
        sample_type:  sample.sample_type  ?? "",
        source_stage: sample.source_stage ?? "",
        priority:     sample.priority,
        line_id:      sample.line_id      ?? "",
        equipment_id: sample.equipment_id ?? "",
        shift_id:     sample.shift_id     ?? "",
      });
    }
  }, [isEditing, sample]);

  // Load existing test results for non-pending samples
  useEffect(() => {
    setTestResults([]);

    if (
      sample.status === SampleStatus.PENDING ||
      sample.status === SampleStatus.REGISTERED
    ) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const results = await LabApi.getSampleTests(sample.id);
        if (!cancelled) setTestResults(results);
      } catch (err) {
        console.error("Failed to load test results:", err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [sample.id, sample.status]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await LabApi.updateSample(sample.id, editedSample as any);
      await AuditApi.log(
        "SAMPLE_MODIFIED",
        `Batch ${sample.batch_id} modified by ${currentUser?.name ?? "Technician"}`,
      );
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error("Failed to save sample:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    editedSample,
    setEditedSample,
    isSaving,
    testResults,
    handleSave,
  };
};