import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APIDocument, apiDocApi } from '../api/apiDoc'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'

export default function ApiDocList() {
  const [docs, setDocs] = useState<APIDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadDocs()
  }, [])

  const loadDocs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiDocApi.list()
      setDocs(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个API文档吗？')) {
      return
    }

    try {
      await apiDocApi.delete(id)
      setDocs(docs.filter((doc) => doc.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  if (loading) {
    return <Loading text="加载API文档列表..." />
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>API文档管理</h2>
        <button
          onClick={() => navigate('/api-docs/upload')}
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
          + 上传文档
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {docs.length === 0 ? (
        <div className="card">
          <EmptyState
            title="还没有API文档"
            description="上传您的第一个API文档，开始使用API自动化测试平台"
            actionLabel="立即上传"
            onAction={() => navigate('/api-docs/upload')}
            icon="📄"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>名称</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>格式</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>创建时间</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '16px' }}>
                    <a
                      href={`/api-docs/${doc.id}`}
                      style={{ color: '#007bff', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {doc.name}
                    </a>
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {doc.format || '未知'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                    {new Date(doc.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/api-docs/${doc.id}`)}
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
                        onClick={() => handleDelete(doc.id)}
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

