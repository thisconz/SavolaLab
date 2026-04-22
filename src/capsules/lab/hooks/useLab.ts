import { useEffect, useCallback } from "react";
import { useLabStore } from "./useLabStore";
import { LabApi } from "../api/lab.api";
import { CreateSampleRequest, UpdateSampleRequest } from "../model/sample.model";

export const useLab = () => {
  const { 
    samples, 
    isLoading, 
    error, 
    setSamples, 
    setLoading, 
    setError,
    updateSample: updateStoreSample
  } = useLabStore();

  const fetchSamples = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LabApi.getSamples();
      setSamples(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch samples");
    } finally {
      setLoading(false);
    }
  }, [setSamples, setLoading, setError]);

  const registerSample = async (data: CreateSampleRequest) => {
    try {
      await LabApi.registerSample(data);
      await fetchSamples();
    } catch (err: any) {
      setError(err.message || "Failed to register sample");
      throw err;
    }
  };

  const updateSample = async (id: number, data: UpdateSampleRequest) => {
    try {
      await LabApi.updateSample(id, {...data, batch_id: data.batch_id ?? undefined});
      updateStoreSample(id, data);
    } catch (err: any) {
      setError(err.message || "Failed to update sample");
      throw err;
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  return {
    samples,
    isLoading,
    error,
    fetchSamples,
    registerSample,
    updateSample,
  };
};
