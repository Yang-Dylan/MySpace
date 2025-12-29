import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APIConfig, apiConfigApi } from '../api/apiConfig'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'

export default function ApiConfigList() {
  const [configs, setConfigs] = useState<APIConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiConfigApi.list()
      setConfigs(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载配置列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个API配置吗？')) {
      return
    }

    try {
      await apiConfigApi.delete(id)
      setConfigs(configs.filter((c) => c.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  if (loading) {
    return <Loading text="加载API配置列表..." />
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>API配置管理</h2>
        <button
          onClick={() => navigate('/api-configs/create')}
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
          + 创建配置
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {configs.length === 0 ? (
        <div className="card">
          <EmptyState
            title="还没有API配置"
            description="创建API配置，设置重试机制、等待时间和依赖关系"
            actionLabel="立即创建"
            onAction={() => navigate('/api-configs/create')}
            icon="⚙️"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>名称</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>关联API</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>重试</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>等待时间</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>依赖</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '16px' }}>
                    <a
                      href={`/api-configs/${config.id}`}
                      style={{ color: '#007bff', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {config.name}
                    </a>
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {config.api_id ? `API #${config.api_id}` : <span style={{ color: '#999' }}>全局模板</span>}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {config.retry_count > 0 ? (
                      <span style={{ color: '#007bff', fontWeight: 500 }}>{config.retry_count}次</span>
                    ) : (
                      <span style={{ color: '#999' }}>否</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {config.wait_time > 0 ? (
                      <span style={{ color: '#007bff', fontWeight: 500 }}>{config.wait_time}秒</span>
                    ) : (
                      <span style={{ color: '#999' }}>否</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {config.depends_on && config.depends_on.length > 0 ? (
                      <span style={{ color: '#007bff', fontWeight: 500 }}>{config.depends_on.length}个依赖</span>
                    ) : (
                      <span style={{ color: '#999' }}>无</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/api-configs/${config.id}`)}
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
                        onClick={() => handleDelete(config.id)}
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

