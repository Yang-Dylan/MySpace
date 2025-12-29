import React from 'react'

interface ErrorAlertProps {
  message: string
  onClose?: () => void
}

export default function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '6px',
        color: '#721c24',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: '14px' }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#721c24',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            marginLeft: '12px',
            lineHeight: '1',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}


