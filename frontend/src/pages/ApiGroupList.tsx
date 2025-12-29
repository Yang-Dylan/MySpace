import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGroupApi, APIGroup, APIGroupCreate } from '../api/apiDoc'
import EmptyState from '../components/EmptyState'
import Loading from '../components/Loading'
import ErrorAlert from '../components/ErrorAlert'

export default function ApiGroupList() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<APIGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 新建/编辑分组弹窗
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<APIGroup | null>(null)
  const [formData, setFormData] = useState<APIGroupCreate>({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await apiGroupApi.list()
      setGroups(data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载分组列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingGroup(null)
    setFormData({ name: '', description: '' })
    setShowModal(true)
  }

  const handleOpenEdit = (group: APIGroup) => {
    setEditingGroup(group)
    setFormData({ name: group.name, description: group.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      return
    }

    setSubmitting(true)
    try {
      if (editingGroup) {
        await apiGroupApi.update(editingGroup.id, formData)
      } else {
        await apiGroupApi.create(formData)
      }
      setShowModal(false)
      loadGroups()
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (group: APIGroup) => {
    if (!window.confirm(`确定要删除分组"${group.name}"吗？\n分组内的API文档将变为未分组状态。`)) {
      return
    }

    try {
      await apiGroupApi.delete(group.id)
      loadGroups()
    } catch (err: any) {
      setError(err.response?.data?.detail || '删除失败')
    }
  }

  if (loading) {
    return <Loading message="加载分组列表..." />
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>API分组管理</h2>
        <button
          onClick={handleOpenCreate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + 新建分组
        </button>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {groups.length === 0 ? (
        <EmptyState
          title="暂无API分组"
          description="创建分组来组织和管理您的API文档"
          actionText="新建分组"
          onAction={handleOpenCreate}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'none'
              }}
              onClick={() => navigate(`/api-groups/${group.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>
                  {group.name}
                </h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenEdit(group)
                    }}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f0f0f0',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(group)
                    }}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#fff0f0',
                      color: '#dc3545',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
              
              {group.description && (
                <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                  {group.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                    {group.api_count || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>接口</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                    {group.test_case_count || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>用例</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>
                    {group.document_count || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>文档</div>
                </div>
              </div>

              <div style={{ marginTop: '15px', fontSize: '12px', color: '#999' }}>
                创建于 {new Date(group.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新建/编辑分组弹窗 */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '25px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0' }}>
              {editingGroup ? '编辑分组' : '新建分组'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  分组名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：用户管理模块"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  分组描述
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个分组的用途..."
                  rows={3}
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

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? '保存中...' : (editingGroup ? '保存' : '创建')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

