import { useState, useEffect, useCallback, useRef } from "react";
import { NotificationApi } from "../../capsules/notifications";
import { LabApi } from "../../capsules/lab";
import type { Notification, Sample, TestResult } from "../../core/types";

interface DashboardData {
  alerts: Notification[];
  samples: Sample[];
  tests: TestResult[];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);
    
    setError(null);

    try {
      const [notificationsData, samplesData, testsData] = await Promise.all([
        NotificationApi.getNotifications(),
        LabApi.getSamples(),
        LabApi.getTests(),
      ]);

      // Logic: Only show top 5 unread alerts
      const unreadAlerts = notificationsData
        .filter((n) => !n.is_read)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setAlerts(unreadAlerts);
      setSamples(samplesData);
      setTests(testsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch dashboard data"));
      console.error("[Dashboard Hook Error]:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      fetchData(true);
    }

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  return {
    alerts,
    samples,
    tests,
    loading,
    refreshing,
    error,
    refresh: () => fetchData(false),
  };
};