import apiClient from './client'

export interface SQLFile {
  id: number
  name: string
  description?: string
  content: string
  file_type: 'init' | 'cleanup'
  user_id: number
  is_validated: boolean
  validation_error?: string
  created_at: string
  updated_at?: string
}

export interface SQLFileCreate {
  name: string
  description?: string
  content: string
  file_type?: 'init' | 'cleanup'
}

export interface DatabaseOperation {
  id: number
  sql_file_id: number
  user_id: number
  operation_type: 'init' | 'cleanup'
  status: 'pending' | 'running' | 'completed' | 'failed'
  target_database?: string
  executed_sql?: string
  result?: string
  error_message?: string
  affected_rows?: number
  start_time?: string
  end_time?: string
  created_at: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
  dangerous_operations: string[]
}

export const databaseManagementApi = {
  uploadSQLFile: async (file: File, fileType: 'init' | 'cleanup' = 'init'): Promise<SQLFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)
    
    const response = await apiClient.post('/api/database/sql-files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  listSQLFiles: async (fileType?: 'init' | 'cleanup'): Promise<SQLFile[]> => {
    const params = fileType ? { file_type: fileType } : {}
    const response = await apiClient.get('/api/database/sql-files/', { params })
    return response.data
  },

  getSQLFile: async (fileId: number): Promise<SQLFile> => {
    const response = await apiClient.get(`/api/database/sql-files/${fileId}`)
    return response.data
  },

  updateSQLFile: async (fileId: number, data: Partial<SQLFileCreate>): Promise<SQLFile> => {
    const response = await apiClient.put(`/api/database/sql-files/${fileId}`, data)
    return response.data
  },

  deleteSQLFile: async (fileId: number): Promise<void> => {
    await apiClient.delete(`/api/database/sql-files/${fileId}`)
  },

  validateSQLFile: async (fileId: number): Promise<ValidationResult> => {
    const response = await apiClient.post(`/api/database/sql-files/${fileId}/validate`)
    return response.data
  },

  executeSQLFile: async (
    fileId: number,
    operationType: 'init' | 'cleanup',
    targetDatabase?: string,
    requireConfirmation = false
  ): Promise<DatabaseOperation> => {
    const response = await apiClient.post(
      `/api/database/sql-files/${fileId}/execute`,
      {
        sql_file_id: fileId,
        operation_type: operationType,
        target_database: targetDatabase,
      },
      {
        params: { require_confirmation: requireConfirmation },
      }
    )
    return response.data
  },

  listOperations: async (skip = 0, limit = 100): Promise<DatabaseOperation[]> => {
    const response = await apiClient.get('/api/database/operations/', {
      params: { skip, limit },
    })
    return response.data
  },

  getOperation: async (operationId: number): Promise<DatabaseOperation> => {
    const response = await apiClient.get(`/api/database/operations/${operationId}`)
    return response.data
  },
}


