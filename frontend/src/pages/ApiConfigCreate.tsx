import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiConfigApi, APIConfigCreate } from '../api/apiConfig'
import { apiDocApi, API, APIDocument } from '../api/apiDoc'

export default function ApiConfigCreate() {
  const [name, setName] = useState('')
  const [selectedApiId, setSelectedApiId] = useState<number | undefined>(undefined)
  const [retryCount, setRetryCount] = useState(0)
  const [retryInterval, setRetryInterval] = useState(0)
  const [waitTime, setWaitTime] = useState(0)
  const [timeout, setTimeout] = useState(30)
  const [dependsOn, setDependsOn] = useState<number[]>([])
  const [apiDocs, setApiDocs] = useState<APIDocument[]>([])
  const [apis, setApis] = useState<API[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadApiDocs()
  }, [])

  const loadApiDocs = async () => {
    try {
      const docs = await apiDocApi.list()
      setApiDocs(docs)
      if (docs.length > 0) {
        loadAPIs(docs[0].id)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载API文档失败')
    }
  }

  const loadAPIs = async (docId: number) => {
    try {
      const apiList = await apiDocApi.getAPIs(docId)
      setApis(apiList)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载API列表失败')
    }
  }

  const handleToggleDependency = (apiId: number) => {
    if (dependsOn.includes(apiId)) {
      setDependsOn(dependsOn.filter((id) => id !== apiId))
    } else {
      setDependsOn([...dependsOn, apiId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('请输入配置名称')
      return
    }

    setLoading(true)
    setError('')

    try {
      const configData: APIConfigCreate = {
        name,
        api_id: selectedApiId,
        retry_count: retryCount,
        retry_interval: retryInterval,
        wait_time: waitTime,
        timeout,
        depends_on: dependsOn.length > 0 ? dependsOn : undefined,
      }
      
      const result = await apiConfigApi.create(configData)
      navigate(`/api-configs/${result.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建配置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>创建API配置</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            配置名称 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            关联API（可选，留空表示全局模板）
          </label>
          <select
            value={selectedApiId || ''}
            onChange={(e) => setSelectedApiId(e.target.value ? parseInt(e.target.value) : undefined)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">全局模板（不关联特定API）</option>
            {apis.map((api) => (
              <option key={api.id} value={api.id}>
                {api.method} {api.path}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              重试次数
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={retryCount}
              onChange={(e) => setRetryCount(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              重试间隔（秒）
            </label>
            <input
              type="number"
              min="0"
              value={retryInterval}
              onChange={(e) => setRetryInterval(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              等待时间（秒）
            </label>
            <input
              type="number"
              min="0"
              value={waitTime}
              onChange={(e) => setWaitTime(parseInt(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              超时时间（秒）
            </label>
            <input
              type="number"
              min="1"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 30)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            选择API文档
          </label>
          <select
            onChange={(e) => loadAPIs(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            {apiDocs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            依赖的API（可选）
          </label>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {apis.length === 0 ? (
              <p>没有可用的API</p>
            ) : (
              apis.map((api) => (
                <label
                  key={api.id}
                  style={{
                    display: 'block',
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: dependsOn.includes(api.id) ? '#e7f3ff' : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={dependsOn.includes(api.id)}
                    onChange={() => handleToggleDependency(api.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>{api.method}</strong> {api.path}
                </label>
              ))
            )}
          </div>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '创建中...' : '创建配置'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/api-configs')}
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
    </div>
  )
}

