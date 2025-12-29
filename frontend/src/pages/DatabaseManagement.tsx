import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SQLFile, databaseManagementApi } from '../api/databaseManagement'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import ErrorAlert from '../components/ErrorAlert'

export default function DatabaseManagement() {
  const [sqlFiles, setSqlFiles] = useState<SQLFile[]>([])
  const [filterType, setFilterType] = useState<'init' | 'cleanup' | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadSQLFiles()
  }, [filterType])

  const loadSQLFiles = async () => {
    try {
      setLoading(true)
      setError('')
      const fileType = filterType === 'all' ? undefined : filterType
      const data = await databaseManagementApi.listSQLFiles(fileType)
      setSqlFiles(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载SQL文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个SQL文件吗？')) {
      return
    }

    try {
      await databaseManagementApi.deleteSQLFile(id)
      setSqlFiles(sqlFiles.filter((f) => f.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  const handleExecute = async (file: SQLFile, operationType: 'init' | 'cleanup') => {
    if (operationType === 'cleanup') {
      if (!confirm('警告：清理操作将删除数据，确定要继续吗？')) {
        return
      }
    }

    try {
      const operation = await databaseManagementApi.executeSQLFile(
        file.id,
        operationType,
        undefined,
        operationType === 'cleanup'
      )
      alert(`操作已启动，状态: ${operation.status}`)
      navigate(`/database/operations/${operation.id}`)
    } catch (err: any) {
      alert(err.response?.data?.detail || '执行失败')
    }
  }

  if (loading) {
    return <Loading text="加载SQL文件列表..." />
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>数据库管理</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
          >
            <option value="all">全部</option>
            <option value="init">初始化</option>
            <option value="cleanup">清理</option>
          </select>
          <button
            onClick={() => navigate('/database/sql-files/upload')}
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
            + 上传SQL文件
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {sqlFiles.length === 0 ? (
        <div className="card">
          <EmptyState
            title="还没有SQL文件"
            description="上传SQL文件用于数据库初始化和清理操作"
            actionLabel="立即上传"
            onAction={() => navigate('/database/sql-files/upload')}
            icon="🗄️"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>名称</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>类型</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>验证状态</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>创建时间</th>
                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sqlFiles.map((file) => (
                <tr key={file.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '16px' }}>
                    <a
                      href={`/database/sql-files/${file.id}`}
                      style={{ color: '#007bff', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {file.name}
                    </a>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: file.file_type === 'init' ? '#d4edda' : '#fff3cd',
                        color: file.file_type === 'init' ? '#155724' : '#856404',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {file.file_type === 'init' ? '初始化' : '清理'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {file.is_validated ? (
                      <span style={{ color: '#28a745', fontWeight: 500 }}>✓ 已验证</span>
                    ) : (
                      <span style={{ color: '#dc3545', fontWeight: 500 }}>✗ 验证失败</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>
                    {new Date(file.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => navigate(`/database/sql-files/${file.id}`)}
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
                      {file.file_type === 'init' && (
                        <button
                          onClick={() => handleExecute(file, 'init')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          执行初始化
                        </button>
                      )}
                      {file.file_type === 'cleanup' && (
                        <button
                          onClick={() => handleExecute(file, 'cleanup')}
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
                          执行清理
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(file.id)}
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

