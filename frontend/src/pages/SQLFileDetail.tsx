import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SQLFile, databaseManagementApi } from '../api/databaseManagement'

export default function SQLFileDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [sqlFile, setSqlFile] = useState<SQLFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (id) {
      loadFile(parseInt(id))
    }
  }, [id])

  const loadFile = async (fileId: number) => {
    try {
      setLoading(true)
      const data = await databaseManagementApi.getSQLFile(fileId)
      setSqlFile(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载文件失败')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!id) return
    
    setValidating(true)
    try {
      const result = await databaseManagementApi.validateSQLFile(parseInt(id))
      if (result.valid) {
        alert('SQL文件验证通过！')
      } else {
        alert(`验证失败: ${result.error}`)
      }
      if (result.dangerous_operations.length > 0) {
        alert(`警告：发现危险操作: ${result.dangerous_operations.join(', ')}`)
      }
      loadFile(parseInt(id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '验证失败')
    } finally {
      setValidating(false)
    }
  }

  const handleExecute = async (operationType: 'init' | 'cleanup') => {
    if (!id || !sqlFile) return
    
    if (operationType === 'cleanup') {
      if (!confirm('警告：清理操作将删除数据，确定要继续吗？')) {
        return
      }
    }

    try {
      const operation = await databaseManagementApi.executeSQLFile(
        parseInt(id),
        operationType,
        undefined,
        operationType === 'cleanup'
      )
      alert(`操作已启动，状态: ${operation.status}`)
      navigate(`/database/operations/${operation.id}`)
    } catch (err: any) {
      alert(err.response?.data?.detail || '执行失败')
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !sqlFile) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red' }}>{error || '文件不存在'}</div>
        <button
          onClick={() => navigate('/database')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/database')}
          style={{
            marginBottom: '20px',
            padding: '5px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← 返回列表
        </button>
        <h2>{sqlFile.name}</h2>
        <div style={{ color: '#666', marginTop: '10px' }}>
          <div>类型: {sqlFile.file_type === 'init' ? '初始化' : '清理'}</div>
          <div>验证状态: {sqlFile.is_validated ? '✓ 已验证' : '✗ 验证失败'}</div>
          {sqlFile.validation_error && (
            <div style={{ color: 'red' }}>错误: {sqlFile.validation_error}</div>
          )}
          <div>创建时间: {new Date(sqlFile.created_at).toLocaleString('zh-CN')}</div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleValidate}
          disabled={validating}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: validating ? 'not-allowed' : 'pointer',
          }}
        >
          {validating ? '验证中...' : '验证SQL'}
        </button>
        {sqlFile.file_type === 'init' && (
          <button
            onClick={() => handleExecute('init')}
            style={{
              marginRight: '10px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            执行初始化
          </button>
        )}
        {sqlFile.file_type === 'cleanup' && (
          <button
            onClick={() => handleExecute('cleanup')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            执行清理
          </button>
        )}
      </div>

      <div>
        <h3>SQL内容</h3>
        <pre
          style={{
            padding: '15px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '500px',
            fontFamily: 'monospace',
            fontSize: '14px',
          }}
        >
          {sqlFile.content}
        </pre>
      </div>
    </div>
  )
}


