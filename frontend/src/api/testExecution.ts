import apiClient from './client'

export interface TestExecution {
  id: number
  test_case_id: number
  user_id: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  thread_count: number
  total_requests: number
  success_count: number
  failure_count: number
  start_time?: string
  end_time?: string
  duration?: number
  created_at: string
}

export interface TestExecutionResult {
  id: number
  execution_id: number
  api_id: number
  order: number
  status: string
  status_code?: number
  request_url?: string
  request_method?: string
  response_time?: number
  error_message?: string
  retry_count: number
  executed_at: string
}

export interface TestExecutionDetail extends TestExecution {
  results: TestExecutionResult[]
}

export interface TestExecutionCreate {
  test_case_id: number
  thread_count?: number
  data_set_id?: number
}

export interface TestDataSet {
  id: number
  name: string
  description?: string
  user_id: number
  data: Record<string, any>[]
  created_at: string
  updated_at?: string
}

export interface TestDataSetCreate {
  name: string
  description?: string
  data: Record<string, any>[]
}

export const testExecutionApi = {
  create: async (data: TestExecutionCreate): Promise<TestExecution> => {
    const response = await apiClient.post('/api/test-executions/', data)
    return response.data
  },

  list: async (skip = 0, limit = 100): Promise<TestExecution[]> => {
    const response = await apiClient.get('/api/test-executions/', {
      params: { skip, limit },
    })
    return response.data
  },

  get: async (executionId: number): Promise<TestExecutionDetail> => {
    const response = await apiClient.get(`/api/test-executions/${executionId}`)
    return response.data
  },

  cancel: async (executionId: number): Promise<void> => {
    await apiClient.post(`/api/test-executions/${executionId}/cancel`)
  },
}

export const testDataSetApi = {
  create: async (data: TestDataSetCreate): Promise<TestDataSet> => {
    const response = await apiClient.post('/api/test-data-sets/', data)
    return response.data
  },

  list: async (): Promise<TestDataSet[]> => {
    const response = await apiClient.get('/api/test-data-sets/')
    return response.data
  },

  get: async (dataSetId: number): Promise<TestDataSet> => {
    const response = await apiClient.get(`/api/test-data-sets/${dataSetId}`)
    return response.data
  },

  delete: async (dataSetId: number): Promise<void> => {
    await apiClient.delete(`/api/test-data-sets/${dataSetId}`)
  },
}


