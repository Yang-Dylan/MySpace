import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TestCase, testCaseApi } from '../api/testCase'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'

export default function TestCaseList() {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadTestCases()
  }, [])

  const loadTestCases = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await testCaseApi.list()
      setTestCases(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载测试用例列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个测试用例吗？')) {
      return
    }

    try {
      await testCaseApi.delete(id)
      setTestCases(testCases.filter((tc) => tc.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  if (loading) {
    return <Loading text="加载测试用例列表..." />
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>测试用例管理</h2>
        <button
          onClick={() => navigate('/test-cases/create')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          + 创建测试用例
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {testCases.length === 0 ? (
        <div className="card">
          <EmptyState
            title="还没有测试用例"
            description="创建您的第一个测试用例，开始自动化测试之旅"
            actionLabel="立即创建"
            onAction={() => navigate('/test-cases/create')}
            icon="🧪"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>名称</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>描述</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>状态</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>创建时间</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc) => (
                <tr key={tc.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '16px' }}>
                    <a
                      href={`/test-cases/${tc.id}`}
                      style={{ color: '#007bff', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {tc.name}
                    </a>
                  </td>
                  <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                    {tc.description || <span style={{ color: '#999' }}>-</span>}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: tc.is_active ? '#d4edda' : '#e9ecef',
                        color: tc.is_active ? '#155724' : '#6c757d',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {tc.is_active ? '激活' : '禁用'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                    {new Date(tc.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/test-cases/${tc.id}`)}
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
                      <button
                        onClick={() => navigate(`/test-cases/${tc.id}/edit`)}
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
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(tc.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        删除
                      </button>
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

