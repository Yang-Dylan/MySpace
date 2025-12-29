import apiClient from './client'

export interface FlowNode {
  id: string
  type: string
  api_id?: number
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  data: Record<string, any>
}

export interface FlowData {
  nodes: FlowNode[]
  edges: FlowEdge[]
  viewport?: Record<string, any>
}

export interface OrchestrationFlow {
  id: number
  name: string
  description?: string
  user_id: number
  flow_data: FlowData
  test_case_id?: number
  created_at: string
  updated_at?: string
}

export interface OrchestrationFlowCreate {
  name: string
  description?: string
  flow_data: FlowData
  test_case_id?: number
}

export interface FieldMapping {
  id: number
  flow_id: number
  source_node_id: string
  target_node_id: string
  source_field_path: string
  target_field_path: string
  mapping_type: string
  created_at: string
}

export const orchestrationApi = {
  createFlow: async (data: OrchestrationFlowCreate): Promise<OrchestrationFlow> => {
    const response = await apiClient.post('/api/orchestration/flows', data)
    return response.data
  },

  listFlows: async (testCaseId?: number): Promise<OrchestrationFlow[]> => {
    const params = testCaseId ? { test_case_id: testCaseId } : {}
    const response = await apiClient.get('/api/orchestration/flows', { params })
    return response.data
  },

  getFlow: async (flowId: number): Promise<OrchestrationFlow> => {
    const response = await apiClient.get(`/api/orchestration/flows/${flowId}`)
    return response.data
  },

  updateFlow: async (flowId: number, data: Partial<OrchestrationFlowCreate>): Promise<OrchestrationFlow> => {
    const response = await apiClient.put(`/api/orchestration/flows/${flowId}`, data)
    return response.data
  },

  deleteFlow: async (flowId: number): Promise<void> => {
    await apiClient.delete(`/api/orchestration/flows/${flowId}`)
  },

  applyFlowToTestCase: async (flowId: number, testCaseId: number): Promise<{ message: string; test_case_id: number }> => {
    const response = await apiClient.post(`/api/orchestration/flows/${flowId}/apply-to-test-case`, {
      test_case_id: testCaseId,
    })
    return response.data
  },

  listFieldMappings: async (flowId: number): Promise<FieldMapping[]> => {
    const response = await apiClient.get(`/api/orchestration/flows/${flowId}/field-mappings`)
    return response.data
  },

  createFieldMapping: async (flowId: number, mapping: {
    source_node_id: string
    target_node_id: string
    source_field_path: string
    target_field_path: string
    mapping_type?: string
  }): Promise<FieldMapping> => {
    const response = await apiClient.post(`/api/orchestration/flows/${flowId}/field-mappings`, mapping)
    return response.data
  },
}

