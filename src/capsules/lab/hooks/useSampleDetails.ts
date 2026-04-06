import { useState, useEffect, useCallback } from "react";
import { LabApi } from "../api/lab.api";
import { AuditApi } from "../../audit/api/audit.api";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import type { Sample, TestResult } from "../../../core/types";
import { SampleStatus } from "../../../core/types";

export const useSampleDetails = (sample: Sample, onUpdate: () => void) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSample, setEditedSample] = useState<Partial<Sample>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (isEditing) {
      setEditedSample({
        priority: sample.priority,
        batch_id: sample.batch_id,
        source_stage: sample.source_stage,
        line_id: sample.line_id,
        equipment_id: sample.equipment_id,
        sample_type: sample.sample_type,
      });
    }
  }, [isEditing, sample]);

  useEffect(() => {
    setTestResults([]);
    const fetchTests = async () => {
      try {
        const results = await LabApi.getSampleTests(sample.id);
        setTestResults(results);
      } catch (err) {
        console.error("Telemetry link failed:", err);
      }
    };
    if (sample.status !== SampleStatus.PENDING) fetchTests();
  }, [sample.id, sample.status]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await LabApi.updateSample(sample.id, editedSample);

      // Audit Logging
      await AuditApi.log(
        "SAMPLE_MODIFIED",
        `Batch ${sample.batch_id} adjusted by ${currentUser?.name || "Technician"}`,
      );

      setIsEditing(false);
      onUpdate();
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
