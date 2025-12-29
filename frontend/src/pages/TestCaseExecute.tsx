import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { testCaseApi } from '../api/testCase'
import { testExecutionApi, testDataSetApi, TestDataSet } from '../api/testExecution'

export default function TestCaseExecute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [threadCount, setThreadCount] = useState(1)
  const [dataSetId, setDataSetId] = useState<number | undefined>(undefined)
  const [dataSets, setDataSets] = useState<TestDataSet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDataSets()
  }, [])

  const loadDataSets = async () => {
    try {
      const data = await testDataSetApi.list()
      setDataSets(data)
    } catch (err: any) {
      // 忽略错误，数据集是可选的
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) {
      setError('测试用例ID无效')
      return
    }

    setLoading(true)
    setError('')

    try {
      const execution = await testExecutionApi.create({
        test_case_id: parseInt(id),
        thread_count: threadCount,
        data_set_id: dataSetId,
      })
      
      navigate(`/test-executions/${execution.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '启动执行失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>执行测试用例</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            线程数
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={threadCount}
            onChange={(e) => setThreadCount(parseInt(e.target.value) || 1)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <small style={{ color: '#666' }}>建议1-5个线程，过多可能影响性能</small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            数据集（可选）
          </label>
          <select
            value={dataSetId || ''}
            onChange={(e) => setDataSetId(e.target.value ? parseInt(e.target.value) : undefined)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">不使用数据集</option>
            {dataSets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.data.length} 条数据)
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '启动中...' : '开始执行'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/test-cases/${id}`)}
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


