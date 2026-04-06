import { create } from "zustand";
import { Sample } from "../model/sample.model";

interface LabState {
  samples: Sample[];
  selectedSampleId: number | null;
  isLoading: boolean;
  error: string | null;
  
  setSamples: (samples: Sample[]) => void;
  setSelectedSampleId: (id: number | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateSample: (id: number, updates: Partial<Sample>) => void;
}

export const useLabStore = create<LabState>((set) => ({
  samples: [],
  selectedSampleId: null,
  isLoading: false,
  error: null,

  setSamples: (samples) => set({ samples }),
  setSelectedSampleId: (id) => set({ selectedSampleId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateSample: (id, updates) => set((state) => ({
    samples: state.samples.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),
}));
