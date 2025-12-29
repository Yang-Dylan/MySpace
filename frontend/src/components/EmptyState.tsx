import React from 'react'

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export default function EmptyState({
  title = '暂无数据',
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }}>
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#333',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '24px',
            maxWidth: '400px',
          }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}


