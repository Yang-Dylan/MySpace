import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { APIDocument, API, apiDocApi } from '../api/apiDoc'

export default function ApiDocDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<APIDocument | null>(null)
  const [apis, setApis] = useState<API[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadDoc(parseInt(id))
    }
  }, [id])

  const loadDoc = async (docId: number) => {
    try {
      setLoading(true)
      const [docData, apisData] = await Promise.all([
        apiDocApi.get(docId),
        apiDocApi.getAPIs(docId),
      ])
      setDoc(docData)
      setApis(apisData)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载文档失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !doc) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red' }}>{error || '文档不存在'}</div>
        <button
          onClick={() => navigate('/api-docs')}
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
          onClick={() => navigate('/api-docs')}
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
        <h2>{doc.name}</h2>
        <div style={{ color: '#666', marginTop: '10px' }}>
          <div>格式: {doc.format || '-'}</div>
          <div>创建时间: {new Date(doc.created_at).toLocaleString('zh-CN')}</div>
          {doc.description && <div>描述: {doc.description}</div>}
        </div>
      </div>

      <h3>API列表 ({apis.length})</h3>
      {apis.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          该文档中还没有解析出API
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>方法</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>路径</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>摘要</th>
            </tr>
          </thead>
          <tbody>
            {apis.map((api) => (
              <tr key={api.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: getMethodColor(api.method),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    {api.method}
                  </span>
                </td>
                <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                  {api.path}
                </td>
                <td style={{ padding: '10px' }}>{api.summary || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#28a745',
    POST: '#007bff',
    PUT: '#ffc107',
    DELETE: '#dc3545',
    PATCH: '#17a2b8',
  }
  return colors[method.toUpperCase()] || '#6c757d'
}

