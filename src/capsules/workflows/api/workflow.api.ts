import { api } from "../../../core/http/client";
import { Workflow, WorkflowExecution } from "../../../core/types";

export type ExecutionWithMeta = WorkflowExecution & { workflow_name: string };
export type WorkflowStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export interface WorkflowStepPayload {
  status?: WorkflowStatus;
  test_id?: number;
  result_value?: number;
}

export const WorkflowApi = {
  getWorkflows: async (): Promise<Workflow[]> => {
    const res = await api.get<any>(`/workflows?t=${Date.now()}`);
    return res.data ?? [];
  },
  getWorkflowExecutions: async (sampleId: number): Promise<ExecutionWithMeta[]> => {
    const res = await api.get<any>(`/workflows/executions/${sampleId}`);
    return res.data ?? [];
  },
  executeWorkflow: async (workflowId: number, sampleId: number): Promise<{ id: number }> => {
    const res = await api.post<any>(`/workflows/${workflowId}/execute`, {
      sample_id: sampleId,
    });
    return { id: res.data.executionId };
  },
  completeStep: async (
    executionId: number,
    stepId: number,
    payload: WorkflowStepPayload,
  ): Promise<void> => {
    await api.post(`/workflows/executions/${executionId}/steps/${stepId}/complete`, payload);
  },
};
