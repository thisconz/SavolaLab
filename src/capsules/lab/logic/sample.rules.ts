import type { Sample } from "../../../core/types";

export const SampleRules = {
  canBeEdited: (sample: Sample): boolean => {
    return sample.status !== "COMPLETED";
  },

  isStat: (sample: Sample): boolean => {
    return sample.priority === "STAT";
  },

  isHighPriority: (sample: Sample): boolean => {
    return sample.priority === "HIGH";
  },

  validateBatchId: (batchId: string): string | null => {
    if (!batchId.trim()) return "Batch ID is required";
    if (batchId.length < 5) return "Batch ID is too short";
    return null;
  },

  getPriorityOrder: (priority: string): number => {
    const order: Record<string, number> = {
      STAT: 0,
      HIGH: 1,
      NORMAL: 2,
    };
    return order[priority] ?? 3;
  },

  sortSamples: (samples: Sample[]): Sample[] => {
    return [...samples].sort((a, b) => {
      const pA = SampleRules.getPriorityOrder(a.priority);
      const pB = SampleRules.getPriorityOrder(b.priority);

      if (pA !== pB) return pA - pB;

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  },
};
