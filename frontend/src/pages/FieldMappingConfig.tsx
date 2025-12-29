import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orchestrationApi, FieldMapping } from '../api/orchestration'

export default function FieldMappingConfig() {
  const { flowId } = useParams<{ flowId: string }>()
  const navigate = useNavigate()
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    source_node_id: '',
    target_node_id: '',
    source_field_path: '',
    target_field_path: '',
    mapping_type: 'request_param',
  })

  useEffect(() => {
    if (flowId) {
      loadMappings()
    }
  }, [flowId])

  const loadMappings = async () => {
    try {
      setLoading(true)
      const data = await orchestrationApi.listFieldMappings(parseInt(flowId!))
      setMappings(data)
    } catch (err: any) {
      alert(err.response?.data?.detail || '加载字段映射失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.source_node_id || !formData.target_node_id || !formData.source_field_path || !formData.target_field_path) {
      alert('请填写所有字段')
      return
    }

    try {
      await orchestrationApi.createFieldMapping(parseInt(flowId!), formData)
      setShowForm(false)
      setFormData({
        source_node_id: '',
        target_node_id: '',
        source_field_path: '',
        target_field_path: '',
        mapping_type: 'request_param',
      })
      loadMappings()
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建字段映射失败')
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/orchestration/${flowId}`)}
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
          ← 返回编排编辑器
        </button>
        <h2>字段映射配置</h2>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showForm ? '取消' : '添加字段映射'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              源节点ID
            </label>
            <input
              type="text"
              value={formData.source_node_id}
              onChange={(e) => setFormData({ ...formData, source_node_id: e.target.value })}
              placeholder="例如: api-1-1234567890"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              目标节点ID
            </label>
            <input
              type="text"
              value={formData.target_node_id}
              onChange={(e) => setFormData({ ...formData, target_node_id: e.target.value })}
              placeholder="例如: api-2-1234567890"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              源字段路径
            </label>
            <input
              type="text"
              value={formData.source_field_path}
              onChange={(e) => setFormData({ ...formData, source_field_path: e.target.value })}
              placeholder="例如: data.user.id 或 response.token"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <small style={{ color: '#666' }}>使用点号分隔的JSON路径，如 data.user.id</small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              目标字段路径
            </label>
            <input
              type="text"
              value={formData.target_field_path}
              onChange={(e) => setFormData({ ...formData, target_field_path: e.target.value })}
              placeholder="例如: userId 或 headers.Authorization"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              映射类型
            </label>
            <select
              value={formData.mapping_type}
              onChange={(e) => setFormData({ ...formData, mapping_type: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="request_param">请求参数</option>
              <option value="request_header">请求头</option>
              <option value="request_body">请求体</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              创建映射
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        </form>
      )}

      {mappings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>还没有字段映射</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>源节点</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>目标节点</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>源字段</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>目标字段</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>映射类型</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => (
              <tr key={mapping.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{mapping.source_node_id}</td>
                <td style={{ padding: '10px' }}>{mapping.target_node_id}</td>
                <td style={{ padding: '10px' }}>{mapping.source_field_path}</td>
                <td style={{ padding: '10px' }}>{mapping.target_field_path}</td>
                <td style={{ padding: '10px' }}>{mapping.mapping_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


