import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { databaseManagementApi } from '../api/databaseManagement'

export default function SQLFileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'init' | 'cleanup'>('init')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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

    setLoading(true)
    setError('')

    try {
      const sqlFile = await databaseManagementApi.uploadSQLFile(file, fileType)
      
      if (!sqlFile.is_validated) {
        alert(`SQL文件验证失败: ${sqlFile.validation_error}`)
      }
      
      navigate(`/database/sql-files/${sqlFile.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h2>上传SQL文件</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            文件类型
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as 'init' | 'cleanup')}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="init">初始化（用于数据库初始化）</option>
            <option value="cleanup">清理（用于数据库清理）</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            选择SQL文件
          </label>
          <input
            type="file"
            accept=".sql,.txt"
            onChange={handleFileChange}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          {file && (
            <div style={{ marginTop: '10px', color: '#666' }}>
              已选择: {file.name}
            </div>
          )}
        </div>

        {fileType === 'cleanup' && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
            <strong>⚠️ 警告：</strong>清理类型的SQL文件可能包含删除操作，请谨慎使用。
          </div>
        )}

        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading || !file}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !file ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '上传中...' : '上传'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/database')}
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


