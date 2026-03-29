import { api } from "../../../core/http/client";
import { Workflow, WorkflowExecution } from "../../../core/types";

export const WorkflowApi = {
  getWorkflows: async (): Promise<Workflow[]> => {
    const res = await api.get<{ success: boolean; data: Workflow[] }>(
      `/workflows?t=${Date.now()}`,
    );
    return res.data || [];
  },

  getWorkflowExecutions: async (
    sampleId: number,
  ): Promise<(WorkflowExecution & { workflow_name: string })[]> => {
    const res = await api.get<{
      success: boolean;
      data: (WorkflowExecution & { workflow_name: string })[];
    }>(`/workflows/executions/${sampleId}`);
    return res.data || [];
  },

  executeWorkflow: async (
    workflowId: number,
    sampleId: number,
  ): Promise<{ id: number }> => {
    const res = await api.post<{
      success: boolean;
      data: { executionId: number };
    }>(`/workflows/${workflowId}/execute`, {
      sample_id: sampleId,
    });
    return { id: res.data.executionId };
  },

  completeStep: async (
    executionId: number,
    stepId: number,
    data: { status?: string; test_id?: number; result_value?: number },
  ): Promise<void> => {
    return api.post(
      `/workflows/executions/${executionId}/steps/${stepId}/complete`,
      data,
    );
  },
};
