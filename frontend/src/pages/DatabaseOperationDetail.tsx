import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DatabaseOperation, databaseManagementApi } from '../api/databaseManagement'

export default function DatabaseOperationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [operation, setOperation] = useState<DatabaseOperation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadOperation(parseInt(id))
    }
  }, [id])

  const loadOperation = async (operationId: number) => {
    try {
      setLoading(true)
      const data = await databaseManagementApi.getOperation(operationId)
      setOperation(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载操作详情失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#6c757d',
      running: '#007bff',
      completed: '#28a745',
      failed: '#dc3545',
    }
    return colors[status] || '#6c757d'
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !operation) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red' }}>{error || '操作记录不存在'}</div>
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
          返回
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
          ← 返回
        </button>
        <h2>数据库操作详情 #{operation.id}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <strong>操作类型:</strong> {operation.operation_type === 'init' ? '初始化' : '清理'}
          </div>
          <div>
            <strong>状态:</strong>{' '}
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(operation.status),
                color: 'white',
              }}
            >
              {operation.status === 'pending' ? '等待中' :
               operation.status === 'running' ? '执行中' :
               operation.status === 'completed' ? '已完成' : '失败'}
            </span>
          </div>
          {operation.target_database && (
            <div>
              <strong>目标数据库:</strong> {operation.target_database}
            </div>
          )}
          {operation.affected_rows !== undefined && (
            <div>
              <strong>影响行数:</strong> {operation.affected_rows}
            </div>
          )}
          {operation.start_time && (
            <div>
              <strong>开始时间:</strong> {new Date(operation.start_time).toLocaleString('zh-CN')}
            </div>
          )}
          {operation.end_time && (
            <div>
              <strong>结束时间:</strong> {new Date(operation.end_time).toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>

      {operation.error_message && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
          <strong>错误信息:</strong>
          <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{operation.error_message}</pre>
        </div>
      )}

      {operation.result && (
        <div style={{ marginBottom: '20px' }}>
          <h3>执行结果</h3>
          <pre
            style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {operation.result}
          </pre>
        </div>
      )}

      {operation.executed_sql && (
        <div>
          <h3>执行的SQL</h3>
          <pre
            style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px',
              fontFamily: 'monospace',
            }}
          >
            {operation.executed_sql}
          </pre>
        </div>
      )}
    </div>
  )
}


