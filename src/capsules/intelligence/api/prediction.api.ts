export interface QualityPrediction {
  sampleId: number;
  predictedGrade: string;
  confidence: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  zScore: number;
  message: string;
}

export const PredictionApi = {
  predictBatchQuality: async (_sampleId: number): Promise<QualityPrediction> => {
    throw new Error("PredictionApi.predictBatchQuality: not yet implemented");
  },
  detectAnomaly: async (
    _testType: string,
    _value: number,
    _stage: string,
  ): Promise<AnomalyResult> => {
    throw new Error("PredictionApi.detectAnomaly: not yet implemented");
  },
};
