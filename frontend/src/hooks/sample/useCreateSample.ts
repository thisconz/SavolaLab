import { useState } from "react";
import api from "@/lib/api";
import { SampleCreate } from "@/types/sample";
import { sampleTypes, sampleCategories } from "@/constants/sample";
import { formatSampleType, toDatetimeLocal } from "@/utils/format";

export default function useCreateSample() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createSample = async (data: SampleCreate) => {
        setLoading(true);
        setError(null);
        try {
            await api.post("/samples/", data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Create failed");
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, createSample };
}