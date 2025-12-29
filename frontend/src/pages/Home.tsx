import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      <h2>欢迎使用API自动化测试平台</h2>
      {user && <p>欢迎, {user.username}!</p>}
      
      <div style={{ marginTop: '30px' }}>
        <h3>功能导航</h3>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <Link
            to="/api-docs"
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              display: 'block',
              minWidth: '200px',
            }}
          >
            <h4>API文档管理</h4>
            <p>上传、查看和管理API文档</p>
          </Link>
          <Link
            to="/test-cases"
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              display: 'block',
              minWidth: '200px',
            }}
          >
            <h4>测试用例管理</h4>
            <p>创建、查看和管理测试用例</p>
          </Link>
          <Link
            to="/api-configs"
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              display: 'block',
              minWidth: '200px',
            }}
          >
            <h4>API配置管理</h4>
            <p>配置重试、等待时间和依赖关系</p>
          </Link>
          <Link
            to="/database"
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              display: 'block',
              minWidth: '200px',
            }}
          >
            <h4>数据库管理</h4>
            <p>SQL文件管理和数据库操作</p>
          </Link>
          <Link
            to="/orchestration"
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              display: 'block',
              minWidth: '200px',
            }}
          >
            <h4>可视化编排</h4>
            <p>拖拽式API编排和字段映射</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

