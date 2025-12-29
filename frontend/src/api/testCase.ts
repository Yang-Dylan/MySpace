import apiClient from './client'

// 字段映射项
export interface FieldMappingItem {
  source_field: string  // 源字段路径，如 "data.user.id"
  target_field: string  // 目标字段路径，如 "body.userId"
  source_type: 'api' | 'data_set'  // 源类型：api（来自其他API响应）或 data_set（来自数据集）
  source_api_id?: number  // 当source_type为api时，指定源API ID
}

// 条件执行配置
export type ConditionOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'exists' | 'not_exists'
  | 'is_empty' | 'not_empty'

export interface ExecutionConditionItem {
  source_api_id: number
  field_path: string
  operator: ConditionOperator
  value?: any
}

export interface ExecutionCondition {
  enabled: boolean
  conditions: ExecutionConditionItem[]
  logic: 'AND' | 'OR'
  on_fail: 'skip' | 'fail' | 'continue'
}

export interface TestCase {
  id: number
  name: string
  description?: string
  user_id: number
  is_active: boolean
  data_set_id?: number  // 关联的数据集ID
  created_at: string
  updated_at?: string
}

export interface TestCaseAPI {
  id: number
  test_case_id: number
  api_id: number
  order: number
  retry_count: number
  retry_interval: number
  wait_time: number
  field_mappings?: Record<string, any>  // 旧格式（向后兼容）
  enhanced_field_mappings?: FieldMappingItem[]  // 新格式
  request_params?: Record<string, any>
  execution_condition?: ExecutionCondition  // 条件执行配置
  created_at: string
}

export interface TestCaseDetail extends TestCase {
  apis: TestCaseAPI[]
  data_set_field_mappings?: FieldMappingItem[]  // 数据集字段映射
}

export interface TestCaseAPICreate {
  api_id: number
  order: number
  retry_count?: number
  retry_interval?: number
  wait_time?: number
  field_mappings?: Record<string, any>  // 旧格式
  enhanced_field_mappings?: FieldMappingItem[]  // 新格式
  request_params?: Record<string, any>
  execution_condition?: ExecutionCondition  // 条件执行配置
}

export interface TestCaseCreate {
  name: string
  description?: string
  apis: TestCaseAPICreate[]
  data_set_id?: number  // 关联的数据集ID
  data_set_field_mappings?: FieldMappingItem[]  // 数据集字段映射
}

export interface TestCaseUpdate {
  name?: string
  description?: string
  apis?: TestCaseAPICreate[]
  is_active?: boolean
  data_set_id?: number  // 关联的数据集ID
  data_set_field_mappings?: FieldMappingItem[]  // 数据集字段映射
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface MissingParam {
  api_id: number
  api_order: number
  api_method: string
  api_path: string
  api_summary?: string
  param_path: string
  param_name: string
  param_type: string
}

export interface ParamValidationResult {
  valid: boolean
  missing_params: MissingParam[]
}

// 可视化数据类型
export interface VisualAPIParam {
  name: string
  path: string
  type: string
  is_mapped: boolean
  mapping_source?: string
}

export interface VisualFieldMapping {
  source_api_order?: number
  source_field: string
  target_field: string
  source_type?: 'api' | 'data_set'
  source_data_set_id?: number
}

export interface VisualAPINode {
  id: number
  order: number
  method: string
  path: string
  summary?: string
  key_params: VisualAPIParam[]
  all_params: VisualAPIParam[]
  has_condition: boolean
  condition?: ExecutionCondition
  incoming_mappings: VisualFieldMapping[]
}

export interface TestCaseVisual {
  id: number
  name: string
  description?: string
  nodes: VisualAPINode[]
  has_data_set: boolean
  data_set_name?: string
}

// 用例执行记录
export interface TestCaseExecutionRecord {
  id: number
  status: string
  total_requests: number
  success_count: number
  failure_count: number
  duration?: number
  error_message?: string
  created_at: string
  start_time?: string
  end_time?: string
}

export const testCaseApi = {
  create: async (data: TestCaseCreate): Promise<TestCase> => {
    const response = await apiClient.post('/api/test-cases/', data)
    return response.data
  },

  list: async (skip = 0, limit = 100): Promise<TestCase[]> => {
    const response = await apiClient.get('/api/test-cases/', {
      params: { skip, limit },
    })
    return response.data
  },

  get: async (testCaseId: number): Promise<TestCaseDetail> => {
    const response = await apiClient.get(`/api/test-cases/${testCaseId}`)
    return response.data
  },

  update: async (testCaseId: number, data: TestCaseUpdate): Promise<TestCase> => {
    const response = await apiClient.put(`/api/test-cases/${testCaseId}`, data)
    return response.data
  },

  delete: async (testCaseId: number): Promise<void> => {
    await apiClient.delete(`/api/test-cases/${testCaseId}`)
  },

  validate: async (testCaseId: number): Promise<ValidationResult> => {
    const response = await apiClient.post(`/api/test-cases/${testCaseId}/validate`)
    return response.data
  },

  validateParams: async (testCaseId: number): Promise<ParamValidationResult> => {
    const response = await apiClient.post(`/api/test-cases/${testCaseId}/validate-params`)
    return response.data
  },

  // 获取可视化数据
  getVisual: async (testCaseId: number): Promise<TestCaseVisual> => {
    const response = await apiClient.get(`/api/test-cases/${testCaseId}/visual`)
    return response.data
  },

  // 获取用例执行记录
  getExecutions: async (testCaseId: number, limit = 10): Promise<{ items: TestCaseExecutionRecord[]; total: number }> => {
    const response = await apiClient.get(`/api/test-cases/${testCaseId}/executions`, {
      params: { limit },
    })
    return response.data
  },
}

