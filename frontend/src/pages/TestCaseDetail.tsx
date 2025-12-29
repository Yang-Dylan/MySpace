import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { TestCaseDetail, testCaseApi, TestCaseAPI } from '../api/testCase'
import { apiDocApi, API } from '../api/apiDoc'

export default function TestCaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [testCase, setTestCase] = useState<TestCaseDetail | null>(null)
  const [apis, setApis] = useState<Record<number, API>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadTestCase(parseInt(id))
    }
  }, [id])

  const loadTestCase = async (testCaseId: number) => {
    try {
      setLoading(true)
      const data = await testCaseApi.get(testCaseId)
      setTestCase(data)
      
      // 加载所有API的详细信息
      const apiIds = data.apis.map((tca) => tca.api_id)
      const apiMap: Record<number, API> = {}
      for (const apiId of apiIds) {
        try {
          // 需要从API文档中查找API，这里简化处理
          // 实际应该通过API ID查询
        } catch (e) {
          // 忽略单个API加载失败
        }
      }
      setApis(apiMap)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载测试用例失败')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!id) return
    
    try {
      const result = await testCaseApi.validate(parseInt(id))
      if (result.valid) {
        alert('测试用例配置有效！')
      } else {
        alert(`配置错误：\n${result.errors.join('\n')}`)
      }
      if (result.warnings.length > 0) {
        alert(`警告：\n${result.warnings.join('\n')}`)
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || '验证失败')
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !testCase) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: 'red' }}>{error || '测试用例不存在'}</div>
        <button
          onClick={() => navigate('/test-cases')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/test-cases')}
          style={{
            marginBottom: '20px',
            padding: '5px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← 返回列表
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{testCase.name}</h2>
            {testCase.description && <p style={{ color: '#666' }}>{testCase.description}</p>}
            <div style={{ color: '#666', marginTop: '10px' }}>
              <div>创建时间: {new Date(testCase.created_at).toLocaleString('zh-CN')}</div>
              <div>状态: {testCase.is_active ? '激活' : '禁用'}</div>
            </div>
          </div>
          <div>
            <button
              onClick={handleValidate}
              style={{
                marginRight: '10px',
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              验证配置
            </button>
            <button
              onClick={() => navigate(`/test-cases/${testCase.id}/execute`)}
              style={{
                marginRight: '10px',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              执行测试
            </button>
            <button
              onClick={() => navigate(`/test-cases/${testCase.id}/edit`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ffc107',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              编辑
            </button>
          </div>
        </div>
      </div>

      <h3>API列表 ({testCase.apis.length})</h3>
      {testCase.apis.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          该测试用例中还没有配置API
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>顺序</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>方法</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>路径</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>重试</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>等待时间</th>
            </tr>
          </thead>
          <tbody>
            {testCase.apis.map((tca) => (
              <tr key={tca.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>#{tca.order}</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    API #{tca.api_id}
                  </span>
                </td>
                <td style={{ padding: '10px', fontFamily: 'monospace' }}>
                  API ID: {tca.api_id}
                </td>
                <td style={{ padding: '10px' }}>
                  {tca.retry_count > 0 ? `${tca.retry_count}次` : '否'}
                </td>
                <td style={{ padding: '10px' }}>
                  {tca.wait_time > 0 ? `${tca.wait_time}秒` : '否'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


