import React from 'react'

interface LoadingProps {
  text?: string
  size?: 'small' | 'medium' | 'large'
}

export default function Loading({ text = '加载中...', size = 'medium' }: LoadingProps) {
  const sizeMap = {
    small: '20px',
    medium: '32px',
    large: '48px',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '200px',
      }}
    >
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: `3px solid #f3f3f3`,
          borderTop: `3px solid #007bff`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }}
      />
      <p style={{ color: '#666', fontSize: '14px' }}>{text}</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}


