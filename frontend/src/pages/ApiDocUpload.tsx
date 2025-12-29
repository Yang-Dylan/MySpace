import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiDocApi, apiGroupApi, APIGroup } from '../api/apiDoc'

type GroupMode = 'existing' | 'new' | 'none'

export default function ApiDocUpload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 分组相关状态
  const [groups, setGroups] = useState<APIGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupMode, setGroupMode] = useState<GroupMode>('existing')
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>()
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setGroupsLoading(true)
      const data = await apiGroupApi.list()
      setGroups(data)
      if (data.length > 0) {
        setSelectedGroupId(data[0].id)
      } else {
        setGroupMode('new')
      }
    } catch (err: any) {
      console.error('加载分组失败:', err)
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('请选择文件')
      return
    }

    // 验证分组设置
    if (groupMode === 'existing' && !selectedGroupId) {
      setError('请选择分组')
      return
    }
    if (groupMode === 'new' && !newGroupName.trim()) {
      setError('请输入新分组名称')
      return
    }

    setLoading(true)
    setError('')

    try {
      const uploadOptions: any = {}
      
      if (groupMode === 'existing' && selectedGroupId) {
        uploadOptions.groupId = selectedGroupId
      } else if (groupMode === 'new') {
        uploadOptions.newGroupName = newGroupName.trim()
        uploadOptions.newGroupDescription = newGroupDescription.trim() || undefined
      }
      
      const result = await apiDocApi.upload(file, uploadOptions)
      
      // 显示上传结果
      if (result.parse_error) {
        setError(`文档已上传，但解析API失败: ${result.parse_error}`)
      } else if (result.apis_count === 0) {
        setError(`文档已上传，但未解析出任何API接口。请检查文档格式是否正确。`)
      }
      
      // 如果有分组，跳转到分组页面；否则跳转到文档详情
      if (result.group_id) {
        navigate(`/api-groups/${result.group_id}`)
      } else {
        navigate(`/api-docs/${result.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h2>上传API文档</h2>
      
      <form onSubmit={handleSubmit}>
        {/* 文件选择 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            选择文件
          </label>
          <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
            支持 OpenAPI/Swagger 格式的 JSON 或 YAML 文件
          </p>
          <input
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '2px dashed #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          />
          {file && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
              <strong>已选择:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* 分组选择 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            所属分组
          </label>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="groupMode"
                checked={groupMode === 'existing'}
                onChange={() => setGroupMode('existing')}
                disabled={groups.length === 0}
              />
              选择已有分组
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="groupMode"
                checked={groupMode === 'new'}
                onChange={() => setGroupMode('new')}
              />
              新建分组
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="groupMode"
                checked={groupMode === 'none'}
                onChange={() => setGroupMode('none')}
              />
              不选择分组
            </label>
          </div>

          {groupMode === 'existing' && (
            <div>
              {groupsLoading ? (
                <p style={{ color: '#666' }}>加载分组列表...</p>
              ) : groups.length === 0 ? (
                <p style={{ color: '#999' }}>暂无分组，请新建分组</p>
              ) : (
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(parseInt(e.target.value) || undefined)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.api_count || 0} 接口)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {groupMode === 'new' && (
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  分组名称 *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="如：用户管理模块"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  分组描述
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="描述这个分组的用途..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}

          {groupMode === 'none' && (
            <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
              文档将不会归属于任何分组，您可以稍后再设置
            </p>
          )}
        </div>

        {error && (
          <div style={{ 
            color: '#dc3545', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#fff0f0', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading || !file}
            style={{
              padding: '12px 25px',
              backgroundColor: loading || !file ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !file ? 'not-allowed' : 'pointer',
              fontSize: '15px',
            }}
          >
            {loading ? '上传中...' : '上传'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/api-docs')}
            style={{
              padding: '12px 25px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
