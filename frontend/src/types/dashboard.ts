import { Sample } from "@/types/sample";
import { Test } from "@/types/test";

export interface DashboardData {
  total_samples: number;
  samples: Sample[];
  latest_sample: Sample | null;
  total_tests: number;
  tests: Test[];
  latest_test: Test | null;
  averages_by_sample_type: {
    sample_type: string;
    avg_test_result: number;
  }[];
}

export interface DashboardCounts {
  name: string;
  samples: number;
  tests: number;
};

export interface AvgTestResultChartData {
  sample_type: string;
  parameter: string;
  avg_test_result: number;
}