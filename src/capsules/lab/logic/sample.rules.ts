import type { Sample } from "../../../core/types";

// Move constant data outside to prevent re-allocation during sorting
const PRIORITY_WEIGHTS: Record<string, number> = {
  STAT: 0,
  HIGH: 1,
  NORMAL: 2,
};

export const SampleRules = {
  canBeEdited: (sample: Sample): boolean => {
    // Locked samples prevent accidental data entry after approval/completion
    return sample.status !== "COMPLETED" && sample.status !== "APPROVED";
  },

  isStat: (sample: Sample): boolean => sample.priority === "STAT",

  isHighPriority: (sample: Sample): boolean => sample.priority === "HIGH",

  validateBatchId: (batchId: string): string | null => {
    const trimmed = batchId.trim();
    if (!trimmed) return "Batch ID is required";
    if (trimmed.length < 5) return "Batch ID must be at least 5 characters";
    // Regex check for alphanumeric batch IDs if required by your lab standard
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) return "Invalid characters in Batch ID";
    return null;
  },

  getPriorityOrder: (priority: string): number => {
    return PRIORITY_WEIGHTS[priority] ?? 3;
  },

  /**
   * Sorts samples by priority first, then by the most recently created.
   */
  sortSamples: (samples: Sample[]): Sample[] => {
    return [...samples].sort((a, b) => {
      const weightA = SampleRules.getPriorityOrder(a.priority);
      const weightB = SampleRules.getPriorityOrder(b.priority);

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // Performance optimization: Compare timestamps directly
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },
};
