import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { TestExecutionDetail, testExecutionApi } from '../api/testExecution'

export default function TestExecutionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [execution, setExecution] = useState<TestExecutionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedResult, setExpandedResult] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      loadExecution(parseInt(id))
      // 如果正在执行，每2秒刷新一次
      const interval = setInterval(() => {
        if (execution && (execution.status === 'pending' || execution.status === 'running')) {
          loadExecution(parseInt(id))
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [id, execution?.status])

  const loadExecution = async (executionId: number) => {
    try {
      const data = await testExecutionApi.get(executionId)
      setExecution(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载执行详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !execution) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red' }}>{error || '执行记录不存在'}</div>
        <button
          onClick={() => {
            const returnPath = (location.state as any)?.returnPath
            if (returnPath) {
              navigate(returnPath)
            } else {
              navigate(-1)
            }
          }}
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: '#28a745',
      failure: '#dc3545',
      skipped: '#6c757d',
    }
    return colors[status] || '#6c757d'
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            const returnPath = (location.state as any)?.returnPath
            if (returnPath) {
              navigate(returnPath, (location.state as any)?.returnState || {})
            } else {
              navigate(-1)
            }
          }}
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
        <h2>测试执行详情 #{execution.id}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div>
            <strong>状态:</strong>{' '}
            <span
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(execution.status),
                color: 'white',
              }}
            >
              {execution.status}
            </span>
          </div>
          <div>
            <strong>线程数:</strong> {execution.thread_count}
          </div>
          <div>
            <strong>总请求数:</strong> {execution.total_requests}
          </div>
          <div>
            <strong>成功:</strong> <span style={{ color: '#28a745' }}>{execution.success_count}</span>
          </div>
          <div>
            <strong>失败:</strong> <span style={{ color: '#dc3545' }}>{execution.failure_count}</span>
          </div>
          <div>
            <strong>耗时:</strong> {execution.duration ? `${execution.duration.toFixed(2)}秒` : '-'}
          </div>
        </div>
        {execution.error_message && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '6px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#721c24' }}>执行错误信息：</div>
            <pre style={{ margin: 0, color: '#721c24', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px' }}>
              {execution.error_message}
            </pre>
          </div>
        )}
      </div>

      <h3>执行结果 ({execution.results.length})</h3>
      {execution.results.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          {execution.status === 'running' ? '正在执行...' : '还没有执行结果'}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>顺序</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>API ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>状态</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>状态码</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>响应时间</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>重试</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {execution.results.map((result) => (
              <>
                <tr key={result.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>#{result.order}</td>
                  <td style={{ padding: '10px' }}>API #{result.api_id}</td>
                  <td style={{ padding: '10px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(result.status),
                        color: 'white',
                        fontSize: '12px',
                      }}
                    >
                      {result.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{result.status_code || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    {result.response_time ? `${result.response_time.toFixed(2)}ms` : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>{result.retry_count}</td>
                  <td style={{ padding: '10px' }}>
                    {(result.error_message || result.status === 'failure') && (
                      <button
                        onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: expandedResult === result.id ? '#dc3545' : '#f8d7da',
                          color: '#721c24',
                          border: '1px solid #f5c6cb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {expandedResult === result.id ? '收起详情' : '查看详情'}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedResult === result.id && (
                  <tr key={`${result.id}-detail`}>
                    <td colSpan={7} style={{ padding: '15px', backgroundColor: '#f8f9fa' }}>
                      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #dee2e6' }}>
                        {result.error_message && (
                          <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#721c24' }}>错误信息：</div>
                            <pre style={{ 
                              margin: 0, 
                              padding: '10px', 
                              backgroundColor: '#f8d7da', 
                              border: '1px solid #f5c6cb', 
                              borderRadius: '4px',
                              color: '#721c24', 
                              whiteSpace: 'pre-wrap', 
                              wordBreak: 'break-word', 
                              fontSize: '13px',
                              maxHeight: '300px',
                              overflow: 'auto'
                            }}>
                              {result.error_message}
                            </pre>
                          </div>
                        )}
                        {result.request_url && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>请求URL：</div>
                            <div style={{ fontSize: '13px', color: '#666', wordBreak: 'break-all' }}>{result.request_method} {result.request_url}</div>
                          </div>
                        )}
                        {result.status_code && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>HTTP状态码：</div>
                            <div style={{ fontSize: '13px', color: result.status_code >= 400 ? '#dc3545' : '#28a745' }}>
                              {result.status_code}
                            </div>
                          </div>
                        )}
                        {result.response_time && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>响应时间：</div>
                            <div style={{ fontSize: '13px', color: '#666' }}>{result.response_time.toFixed(2)}ms</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


