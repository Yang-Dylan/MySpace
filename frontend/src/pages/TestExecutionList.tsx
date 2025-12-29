import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestExecution, testExecutionApi } from '../api/testExecution'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'

export default function TestExecutionList() {
  const [executions, setExecutions] = useState<TestExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadExecutions()
    // 每5秒刷新一次，以便查看执行状态
    const interval = setInterval(loadExecutions, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadExecutions = async () => {
    try {
      setError('')
      const data = await testExecutionApi.list()
      setExecutions(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载执行记录失败')
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
      cancelled: '#ffc107',
    }
    return colors[status] || '#6c757d'
  }

  if (loading && executions.length === 0) {
    return <Loading text="加载执行记录..." />
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>测试执行记录</h2>
        <button
          onClick={loadExecutions}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          🔄 刷新
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {executions.length === 0 ? (
        <div className="card">
          <EmptyState
            title="还没有执行记录"
            description="执行测试用例后，执行记录将显示在这里"
            icon="📊"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>测试用例</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>状态</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>线程数</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>成功/失败</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>耗时</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>创建时间</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr key={exec.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '16px', fontWeight: 500, color: '#666' }}>#{exec.id}</td>
                  <td style={{ padding: '16px', color: '#666' }}>测试用例 #{exec.test_case_id}</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: getStatusColor(exec.status) + '20',
                        color: getStatusColor(exec.status),
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {exec.status === 'pending' ? '等待中' :
                       exec.status === 'running' ? '执行中' :
                       exec.status === 'completed' ? '已完成' :
                       exec.status === 'failed' ? '失败' : '已取消'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>{exec.thread_count}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ color: '#28a745', fontWeight: 500 }}>{exec.success_count}</span>
                    <span style={{ color: '#999', margin: '0 4px' }}>/</span>
                    <span style={{ color: '#dc3545', fontWeight: 500 }}>{exec.failure_count}</span>
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {exec.duration ? `${exec.duration.toFixed(2)}秒` : <span style={{ color: '#999' }}>-</span>}
                  </td>
                  <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                    {new Date(exec.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/test-executions/${exec.id}`)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        查看
                      </button>
                      {exec.status === 'running' && (
                        <button
                          onClick={async () => {
                            try {
                              await testExecutionApi.cancel(exec.id)
                              loadExecutions()
                            } catch (err: any) {
                              alert(err.response?.data?.detail || '取消失败')
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ffc107',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

