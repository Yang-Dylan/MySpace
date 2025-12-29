import apiClient from './client'

export interface APIConfig {
  id: number
  name: string
  api_id?: number
  user_id: number
  retry_count: number
  retry_interval: number
  retry_on_status?: number[]
  wait_time: number
  wait_before: boolean
  depends_on?: number[]
  field_mappings?: Record<string, any>
  timeout: number
  headers?: Record<string, string>
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface APIConfigCreate {
  name: string
  api_id?: number
  retry_count?: number
  retry_interval?: number
  retry_on_status?: number[]
  wait_time?: number
  wait_before?: boolean
  depends_on?: number[]
  field_mappings?: Record<string, any>
  timeout?: number
  headers?: Record<string, string>
}

export interface DependencyOrderResult {
  ordered_apis: number[]
  dependencies: Record<number, number[]>
  has_circular_dependency: boolean
  circular_dependencies?: number[][]
}

export const apiConfigApi = {
  create: async (data: APIConfigCreate): Promise<APIConfig> => {
    const response = await apiClient.post('/api/api-configs/', data)
    return response.data
  },

  list: async (apiId?: number): Promise<APIConfig[]> => {
    const params = apiId ? { api_id: apiId } : {}
    const response = await apiClient.get('/api/api-configs/', { params })
    return response.data
  },

  get: async (configId: number): Promise<APIConfig> => {
    const response = await apiClient.get(`/api/api-configs/${configId}`)
    return response.data
  },

  update: async (configId: number, data: Partial<APIConfigCreate>): Promise<APIConfig> => {
    const response = await apiClient.put(`/api/api-configs/${configId}`, data)
    return response.data
  },

  delete: async (configId: number): Promise<void> => {
    await apiClient.delete(`/api/api-configs/${configId}`)
  },

  resolveDependencies: async (apiConfigs: any[]): Promise<DependencyOrderResult> => {
    const response = await apiClient.post('/api/api-configs/resolve-dependencies', apiConfigs)
    return response.data
  },
}

