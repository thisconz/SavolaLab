import { Sample } from "@/types/sample";
import { Test } from "@/types/test";

export interface DashboardData {
  total_samples: number;
  samples: Sample[];
  latest_sample: Sample | null;
  total_tests: number;
  tests: Test[];
  average_test_results: number;
  latest_test: Test | null;
}

export interface ChartData {
  name: string;
  samples: number;
  tests: number;
};