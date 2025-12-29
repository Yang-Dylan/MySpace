import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <header
        className="header"
        style={{
          backgroundColor: '#1a1a2e',
          color: 'white',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          <Link to="/api-groups" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            API自动化测试平台
          </Link>
        </h1>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link
            to="/api-groups"
            style={{ 
              color: 'rgba(255,255,255,0.9)', 
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
          >
            API分组
          </Link>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                👤 {user.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 16px',
                  backgroundColor: 'rgba(220, 53, 69, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.9)')}
              >
                退出
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className="main" style={{ minHeight: 'calc(100vh - 56px)', padding: '24px', backgroundColor: '#f5f5f7' }}>
        {children}
      </main>
    </div>
  )
}
