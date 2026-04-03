import { api } from "../../../core/http/client";
import { Workflow, WorkflowExecution } from "../../../core/types";

/**
 * Standardized API response structure
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Extended execution type with joined workflow metadata
 */
export type ExecutionWithMeta = WorkflowExecution & { 
  workflow_name: string 
};

/**
 * Valid states for a laboratory workflow step
 */
export type WorkflowStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface WorkflowStepPayload {
  status?: WorkflowStatus;
  test_id?: number;
  result_value?: number;
}

export const WorkflowApi = {
  /**
   * Fetches all workflow definitions with cache-busting
   */
  getWorkflows: async (): Promise<Workflow[]> => {
    const timestamp = Date.now();
    const res = await api.get<ApiResponse<Workflow[]>>(
      `/workflows?t=${timestamp}`, {
    });
    return res.data ?? [];
  },

  /**
   * Retrieves the full execution history for a specific sample ID
   */
  getWorkflowExecutions: async (sampleId: number): Promise<ExecutionWithMeta[]> => {
    const res = await api.get<ApiResponse<ExecutionWithMeta[]>>(
      `/workflows/executions/${sampleId}`
    );
    return res.data ?? [];
  },

  /**
   * Triggers the start of a new workflow for a sample
   */
  executeWorkflow: async (
    workflowId: number, 
    sampleId: number
  ): Promise<{ id: number }> => {
    const res = await api.post<ApiResponse<{ executionId: number }>>(
      `/workflows/${workflowId}/execute`,
      { sample_id: sampleId }
    );
    return { id: res.data.executionId };
  },

  /**
   * Updates and completes a specific step within an active execution.
   * Essential for recording precise chemical or physical test results.
   */
  completeStep: async (
    executionId: number,
    stepId: number,
    payload: WorkflowStepPayload
  ): Promise<void> => {
    await api.post(
      `/workflows/executions/${executionId}/steps/${stepId}/complete`,
      payload
    );
  },
};