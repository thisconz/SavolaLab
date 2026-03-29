import { useState, useEffect, useCallback } from "react";
import { NotificationApi } from "../../capsules/notifications";
import { LabApi } from "../../capsules/lab";
import type { Notification, Sample, TestResult } from "../../core/types";

export const useDashboardData = () => {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [notificationsData, samplesData, testsData] = await Promise.all([
        NotificationApi.getNotifications(),
        LabApi.getSamples(),
        LabApi.getTests(),
      ]);

      setAlerts(notificationsData.filter((n) => !n.is_read).slice(0, 5));
      setSamples(samplesData);
      setTests(testsData);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    alerts,
    samples,
    tests,
    loading,
    refresh: fetchData,
  };
};
