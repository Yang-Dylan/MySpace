import apiClient from './client'

// ==================== API分组 ====================

export interface APIGroup {
  id: number
  name: string
  description?: string
  user_id: number
  created_at: string
  updated_at?: string
  document_count?: number
  api_count?: number
  test_case_count?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface APIGroupCreate {
  name: string
  description?: string
}

// ==================== API参数 ====================

export interface APIParam {
  name: string
  path: string
  type: string
  required: boolean
  description?: string
  example?: any
}

// ==================== API文档 ====================

export interface APIDocument {
  id: number
  name: string
  description?: string
  format?: string
  user_id: number
  group_id?: number
  created_at: string
  updated_at?: string
}

export interface UploadResult {
  id: number
  name: string
  format?: string
  user_id: number
  group_id?: number
  created_at: string
  apis_count: number
  parse_error?: string
}

// ==================== API ====================

export interface API {
  id: number
  document_id: number
  method: string
  path: string
  summary?: string
  description?: string
  tags?: string[]
  is_available: boolean
  availability_reason?: string
  parsed_request_params?: APIParam[]
  parsed_response_params?: APIParam[]
  created_at: string
  updated_at?: string
}

export interface APIUpdate {
  summary?: string
  description?: string
  tags?: string[]
  is_available?: boolean
  parsed_request_params?: APIParam[]
  parsed_response_params?: APIParam[]
}

// ==================== 分组数据集 ====================

export interface GroupDataSet {
  id: number
  group_id: number
  name: string
  description?: string
  data?: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface GroupDataSetCreate {
  name: string
  description?: string
  data?: Record<string, any>
}

// ==================== 手动添加接口 ====================

export interface ManualAPICreate {
  method: string
  path: string
  summary?: string
  description?: string
  tags?: string[]
  parsed_request_params?: APIParam[]
  parsed_response_params?: APIParam[]
  headers?: Record<string, string>
}

// ==================== 接口关联用例 ====================

export interface APIRelatedTestCase {
  id: number
  name: string
  description?: string
  created_at: string
}

// ==================== API分组接口 ====================

export const apiGroupApi = {
  create: async (data: APIGroupCreate): Promise<APIGroup> => {
    const response = await apiClient.post('/api/api-groups/', data)
    return response.data
  },

  list: async (): Promise<APIGroup[]> => {
    const response = await apiClient.get('/api/api-groups/')
    return response.data
  },

  get: async (groupId: number): Promise<APIGroup> => {
    const response = await apiClient.get(`/api/api-groups/${groupId}`)
    return response.data
  },

  update: async (groupId: number, data: Partial<APIGroupCreate>): Promise<APIGroup> => {
    const response = await apiClient.put(`/api/api-groups/${groupId}`, data)
    return response.data
  },

  delete: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/api/api-groups/${groupId}`)
  },

  // 获取分组下的API列表（分页）
  getAPIs: async (
    groupId: number,
    page = 1,
    pageSize = 20,
    options?: { search?: string; method?: string; isAvailable?: boolean }
  ): Promise<PaginatedResponse<API>> => {
    const params: any = { page, page_size: pageSize }
    if (options?.search) params.search = options.search
    if (options?.method) params.method = options.method
    if (options?.isAvailable !== undefined) params.is_available = options.isAvailable
    
    const response = await apiClient.get(`/api/api-groups/${groupId}/apis`, { params })
    return response.data
  },

  // 获取分组下的测试用例列表（分页）
  getTestCases: async (
    groupId: number,
    page = 1,
    pageSize = 20,
    search?: string
  ): Promise<PaginatedResponse<any>> => {
    const params: any = { page, page_size: pageSize }
    if (search) params.search = search
    
    const response = await apiClient.get(`/api/api-groups/${groupId}/test-cases`, { params })
    return response.data
  },

  // ==================== 分组数据集 ====================

  // 获取分组数据集列表
  getDataSets: async (
    groupId: number,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<GroupDataSet>> => {
    const response = await apiClient.get(`/api/api-groups/${groupId}/datasets`, {
      params: { page, page_size: pageSize },
    })
    return response.data
  },

  // 创建分组数据集
  createDataSet: async (groupId: number, data: GroupDataSetCreate): Promise<GroupDataSet> => {
    const response = await apiClient.post(`/api/api-groups/${groupId}/datasets`, data)
    return response.data
  },

  // 获取数据集详情
  getDataSet: async (groupId: number, datasetId: number): Promise<GroupDataSet> => {
    const response = await apiClient.get(`/api/api-groups/${groupId}/datasets/${datasetId}`)
    return response.data
  },

  // 更新数据集
  updateDataSet: async (
    groupId: number,
    datasetId: number,
    data: Partial<GroupDataSetCreate>
  ): Promise<GroupDataSet> => {
    const response = await apiClient.put(`/api/api-groups/${groupId}/datasets/${datasetId}`, data)
    return response.data
  },

  // 删除数据集
  deleteDataSet: async (groupId: number, datasetId: number): Promise<void> => {
    await apiClient.delete(`/api/api-groups/${groupId}/datasets/${datasetId}`)
  },

  // ==================== 手动添加接口 ====================

  // 手动添加接口
  createAPI: async (groupId: number, data: ManualAPICreate): Promise<API> => {
    const response = await apiClient.post(`/api/api-groups/${groupId}/apis`, data)
    return response.data
  },
}

// ==================== API文档接口 ====================

export interface UploadOptions {
  groupId?: number
  newGroupName?: string
  newGroupDescription?: string
}

export const apiDocApi = {
  upload: async (file: File, options?: UploadOptions): Promise<UploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.groupId) {
      formData.append('group_id', options.groupId.toString())
    }
    if (options?.newGroupName) {
      formData.append('new_group_name', options.newGroupName)
    }
    if (options?.newGroupDescription) {
      formData.append('new_group_description', options.newGroupDescription)
    }
    
    const response = await apiClient.post('/api/api-docs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  list: async (skip = 0, limit = 100): Promise<APIDocument[]> => {
    const response = await apiClient.get('/api/api-docs/', {
      params: { skip, limit },
    })
    return response.data
  },

  get: async (docId: number): Promise<APIDocument> => {
    const response = await apiClient.get(`/api/api-docs/${docId}`)
    return response.data
  },

  getAPIs: async (docId: number): Promise<API[]> => {
    const response = await apiClient.get(`/api/api-docs/${docId}/apis`)
    return response.data
  },

  update: async (docId: number, data: Partial<APIDocument>): Promise<APIDocument> => {
    const response = await apiClient.put(`/api/api-docs/${docId}`, data)
    return response.data
  },

  delete: async (docId: number): Promise<void> => {
    await apiClient.delete(`/api/api-docs/${docId}`)
  },

  // 获取API详情
  getAPIDetail: async (apiId: number): Promise<API> => {
    const response = await apiClient.get(`/api/api-docs/apis/${apiId}`)
    return response.data
  },

  // 更新API
  updateAPI: async (apiId: number, data: APIUpdate): Promise<API> => {
    const response = await apiClient.put(`/api/api-docs/apis/${apiId}`, data)
    return response.data
  },

  // 按标签查询API
  getAPIsByTag: async (tag: string, groupId?: number): Promise<API[]> => {
    const params: any = { tag }
    if (groupId) {
      params.group_id = groupId
    }
    const response = await apiClient.get('/api/api-docs/by-tag', { params })
    return response.data
  },

  // 获取分组内的API
  getAPIsByGroup: async (groupId: number, onlyAvailable = false): Promise<API[]> => {
    const response = await apiClient.get(`/api/api-docs/by-group/${groupId}`, {
      params: { only_available: onlyAvailable },
    })
    return response.data
  },

  // 获取接口关联的用例
  getAPIRelatedTestCases: async (apiId: number): Promise<{ items: APIRelatedTestCase[]; total: number }> => {
    const response = await apiClient.get(`/api/api-docs/apis/${apiId}/test-cases`)
    return response.data
  },
}

