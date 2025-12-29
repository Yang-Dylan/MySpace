import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrchestrationFlow, orchestrationApi } from '../api/orchestration'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'

export default function OrchestrationList() {
  const [flows, setFlows] = useState<OrchestrationFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadFlows()
  }, [])

  const loadFlows = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await orchestrationApi.listFlows()
      setFlows(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载编排流程列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个编排流程吗？')) {
      return
    }

    try {
      await orchestrationApi.deleteFlow(id)
      setFlows(flows.filter((f) => f.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  if (loading) {
    return <Loading text="加载编排流程列表..." />
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>可视化编排</h2>
        <button
          onClick={() => navigate('/orchestration/new')}
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
          + 创建新流程
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {flows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="还没有编排流程"
            description="通过拖拽方式创建API编排流程，可视化配置测试用例"
            actionLabel="立即创建"
            onAction={() => navigate('/orchestration/new')}
            icon="🎨"
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {flows.map((flow) => (
            <div
              key={flow.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
                <a
                  href={`/orchestration/${flow.id}`}
                  style={{ color: '#007bff', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/orchestration/${flow.id}`)
                  }}
                >
                  {flow.name}
                </a>
              </h3>
              {flow.description && (
                <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                  {flow.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: '#999' }}>
                <span>节点: <strong style={{ color: '#333' }}>{flow.flow_data?.nodes?.length || 0}</strong></span>
                <span>连线: <strong style={{ color: '#333' }}>{flow.flow_data?.edges?.length || 0}</strong></span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
                {new Date(flow.created_at).toLocaleString('zh-CN')}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button
                  onClick={() => navigate(`/orchestration/${flow.id}`)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(flow.id)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

