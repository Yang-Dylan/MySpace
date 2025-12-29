import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { testCaseApi, FieldMappingItem } from '../api/testCase'
import { apiDocApi, apiGroupApi, API, APIDocument, APIGroup, APIParam, GroupDataSet } from '../api/apiDoc'
import { testDataSetApi, TestDataSet } from '../api/testExecution'

interface SelectedAPI {
  api: API
  order: number
  params: Record<string, any>
  enhanced_field_mappings: FieldMappingItem[]
}

export default function TestCaseCreate() {
  const { groupId: urlGroupId } = useParams<{ groupId?: string }>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAPIs, setSelectedAPIs] = useState<SelectedAPI[]>([])
  const [, setApiDocs] = useState<APIDocument[]>([])
  const [apis, setApis] = useState<API[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // API分组相关状态
  const [apiGroups, setApiGroups] = useState<APIGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(
    urlGroupId ? parseInt(urlGroupId) : undefined
  )
  
  // 标签API（如token）相关状态
  const [taggedApis, setTaggedApis] = useState<API[]>([])
  const [selectedTokenApi, setSelectedTokenApi] = useState<API | null>(null)

  // 数据集相关状态（全局数据集）
  const [dataSets, setDataSets] = useState<TestDataSet[]>([])
  // 分组数据集
  const [groupDataSets, setGroupDataSets] = useState<GroupDataSet[]>([])
  const [selectedDataSetId, setSelectedDataSetId] = useState<number | undefined>()
  const [dataSetFieldMappings, setDataSetFieldMappings] = useState<FieldMappingItem[]>([])
  const [selectedDataSet, setSelectedDataSet] = useState<TestDataSet | null>(null)
  const [selectedGroupDataSet, setSelectedGroupDataSet] = useState<GroupDataSet | null>(null)
  
  // 字段映射配置弹窗状态
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [editingApiIndex, setEditingApiIndex] = useState<number | null>(null)

  useEffect(() => {
    loadApiGroups()
    if (!urlGroupId) {
      loadApiDocs()
    }
    loadDataSets()
  }, [])

  useEffect(() => {
    if (selectedDataSetId) {
      const ds = dataSets.find(d => d.id === selectedDataSetId)
      setSelectedDataSet(ds || null)
      const gds = groupDataSets.find(d => d.id === selectedDataSetId)
      setSelectedGroupDataSet(gds || null)
    } else {
      setSelectedDataSet(null)
      setSelectedGroupDataSet(null)
    }
  }, [selectedDataSetId, dataSets, groupDataSets])

  // 当选择分组变化时，加载分组API和标签API和分组数据集
  useEffect(() => {
    if (selectedGroupId) {
      loadTaggedApis(selectedGroupId)
      loadGroupApis(selectedGroupId)
      loadGroupDataSets(selectedGroupId)
    } else {
      setTaggedApis([])
      setApis([])
      setGroupDataSets([])
    }
  }, [selectedGroupId])

  const loadApiGroups = async () => {
    try {
      const groups = await apiGroupApi.list()
      setApiGroups(groups)
    } catch (err: any) {
      console.error('加载API分组失败:', err)
    }
  }

  const loadTaggedApis = async (groupId: number) => {
    try {
      const taggedApis = await apiDocApi.getAPIsByTag('token', groupId)
      setTaggedApis(taggedApis)
    } catch (err: any) {
      console.error('加载标签API失败:', err)
    }
  }

  const loadGroupApis = async (groupId: number) => {
    try {
      const groupApis = await apiDocApi.getAPIsByGroup(groupId, true)
      setApis(groupApis)
    } catch (err: any) {
      console.error('加载分组API失败:', err)
    }
  }

  const loadGroupDataSets = async (groupId: number) => {
    try {
      const result = await apiGroupApi.getDataSets(groupId)
      setGroupDataSets(result.items)
    } catch (err: any) {
      console.error('加载分组数据集失败:', err)
    }
  }

  const loadApiDocs = async () => {
    try {
      const docs = await apiDocApi.list()
      setApiDocs(docs)
      if (docs.length > 0) {
        loadAPIs(docs[0].id)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载API文档失败')
    }
  }

  const loadDataSets = async () => {
    try {
      const sets = await testDataSetApi.list()
      setDataSets(sets)
    } catch (err: any) {
      console.error('加载数据集失败:', err)
    }
  }

  const loadAPIs = async (docId: number) => {
    try {
      const apiList = await apiDocApi.getAPIs(docId)
      setApis(apiList)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载API列表失败')
    }
  }

  const handleAddAPI = (api: API) => {
    if (selectedAPIs.find((item) => item.api.id === api.id)) {
      alert('该API已添加')
      return
    }
    setSelectedAPIs([
      ...selectedAPIs,
      { api, order: selectedAPIs.length + 1, params: {}, enhanced_field_mappings: [] },
    ])
  }

  const handleRemoveAPI = (apiId: number) => {
    setSelectedAPIs(selectedAPIs.filter((item) => item.api.id !== apiId))
  }

  const handleEditMappings = (index: number) => {
    setEditingApiIndex(index)
    setShowMappingModal(true)
  }

  // 获取数据集中的字段列表
  const getDataSetFields = (): string[] => {
    // 优先使用分组数据集
    if (selectedGroupDataSet && selectedGroupDataSet.data) {
      const fields: string[] = []
      const extractFields = (obj: Record<string, any>, prefix: string = '') => {
        for (const key in obj) {
          const path = prefix ? `${prefix}.${key}` : key
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            extractFields(obj[key], path)
          } else {
            fields.push(path)
          }
        }
      }
      extractFields(selectedGroupDataSet.data)
      return fields
    }
    
    // 使用全局数据集
    if (!selectedDataSet || !selectedDataSet.data || selectedDataSet.data.length === 0) {
      return []
    }
    // 从第一条数据中获取所有字段名
    const firstItem = selectedDataSet.data[0]
    const fields: string[] = []
    const extractFields = (obj: Record<string, any>, prefix: string = '') => {
      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          extractFields(obj[key], path)
        } else {
          fields.push(path)
        }
      }
    }
    extractFields(firstItem)
    return fields
  }

  // 添加数据集字段映射
  const handleAddDataSetMapping = () => {
    setDataSetFieldMappings([
      ...dataSetFieldMappings,
      { source_field: '', target_field: '', source_type: 'data_set' }
    ])
  }

  // 更新数据集字段映射
  const handleUpdateDataSetMapping = (index: number, field: keyof FieldMappingItem, value: any) => {
    const updated = [...dataSetFieldMappings]
    updated[index] = { ...updated[index], [field]: value }
    setDataSetFieldMappings(updated)
  }

  // 删除数据集字段映射
  const handleRemoveDataSetMapping = (index: number) => {
    setDataSetFieldMappings(dataSetFieldMappings.filter((_, i) => i !== index))
  }

  // 添加API间字段映射
  const handleAddApiMapping = (apiIndex: number) => {
    const updated = [...selectedAPIs]
    updated[apiIndex].enhanced_field_mappings.push({
      source_field: '',
      target_field: '',
      source_type: 'api',
      source_api_id: undefined
    })
    setSelectedAPIs(updated)
  }

  // 更新API间字段映射
  const handleUpdateApiMapping = (apiIndex: number, mappingIndex: number, field: keyof FieldMappingItem, value: any) => {
    const updated = [...selectedAPIs]
    updated[apiIndex].enhanced_field_mappings[mappingIndex] = {
      ...updated[apiIndex].enhanced_field_mappings[mappingIndex],
      [field]: value
    }
    setSelectedAPIs(updated)
  }

  // 删除API间字段映射
  const handleRemoveApiMapping = (apiIndex: number, mappingIndex: number) => {
    const updated = [...selectedAPIs]
    updated[apiIndex].enhanced_field_mappings = updated[apiIndex].enhanced_field_mappings.filter((_, i) => i !== mappingIndex)
    setSelectedAPIs(updated)
  }

  // 获取可作为源API的列表（只能是当前API之前的API）
  const getAvailableSourceApis = (currentIndex: number): SelectedAPI[] => {
    return selectedAPIs.slice(0, currentIndex)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('请输入测试用例名称')
      return
    }

    if (selectedAPIs.length === 0) {
      setError('请至少添加一个API')
      return
    }

    setLoading(true)
    setError('')

    try {
      const testCaseData = {
        name,
        description,
        data_set_id: selectedDataSetId,
        data_set_field_mappings: dataSetFieldMappings.filter(m => m.source_field && m.target_field),
        apis: selectedAPIs.map((item) => ({
          api_id: item.api.id,
          order: item.order,
          retry_count: 0,
          retry_interval: 0,
          wait_time: 0,
          request_params: item.params,
          enhanced_field_mappings: item.enhanced_field_mappings.filter(m => m.source_field && m.target_field && m.source_api_id)
        })),
      }
      
      const result = await testCaseApi.create(testCaseData)
      // 如果是从分组创建的，返回分组详情页
      if (urlGroupId) {
        navigate(`/api-groups/${urlGroupId}`)
      } else {
        navigate(`/test-cases/${result.id}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || '创建测试用例失败')
    } finally {
      setLoading(false)
    }
  }

  const dataSetFields = getDataSetFields()

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2>创建测试用例</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            测试用例名称 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* API分组选择 */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>API分组配置</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              选择API分组 *
            </label>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => {
                setSelectedGroupId(e.target.value ? parseInt(e.target.value) : undefined)
                setSelectedAPIs([]) // 清空已选API
              }}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">请选择API分组</option>
              {apiGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.document_count || 0} 个文档)
                </option>
              ))}
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              只有同一分组内的API才能组合成测试用例
            </p>
          </div>

          {/* Token API选择 */}
          {selectedGroupId && taggedApis.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                前置Token接口（可选）
              </label>
              <select
                value={selectedTokenApi?.id || ''}
                onChange={(e) => {
                  const api = taggedApis.find(a => a.id === parseInt(e.target.value))
                  setSelectedTokenApi(api || null)
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="">不使用Token接口</option>
                {taggedApis.map((api) => (
                  <option key={api.id} value={api.id}>
                    {api.method} {api.path} - {api.summary || '无描述'}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                选择带有"token"标签的接口作为前置调用，可从中获取token值
              </p>
            </div>
          )}
        </div>

        {/* 数据集选择 */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>数据集配置</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              选择数据集（可选）
            </label>
            <select
              value={selectedDataSetId || ''}
              onChange={(e) => setSelectedDataSetId(e.target.value ? parseInt(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              <option value="">不使用数据集</option>
              {/* 分组数据集 */}
              {groupDataSets.length > 0 && (
                <optgroup label="分组数据集">
                  {groupDataSets.map((ds) => (
                    <option key={`group-${ds.id}`} value={ds.id}>
                      {ds.name} - {Object.keys(ds.data || {}).length} 个字段
                    </option>
                  ))}
                </optgroup>
              )}
              {/* 全局数据集 */}
              {dataSets.length > 0 && (
                <optgroup label="全局数据集">
                  {dataSets.map((ds) => (
                    <option key={`global-${ds.id}`} value={ds.id}>
                      {ds.name} ({ds.data?.length || 0} 条数据)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 数据集字段映射 */}
          {selectedDataSet && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold' }}>数据集字段映射</label>
                <button
                  type="button"
                  onClick={handleAddDataSetMapping}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  + 添加映射
                </button>
              </div>
              
              {dataSetFieldMappings.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>暂无字段映射，点击"添加映射"配置数据集字段到API请求参数的映射</p>
              ) : (
                dataSetFieldMappings.map((mapping, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <select
                      value={mapping.source_field}
                      onChange={(e) => handleUpdateDataSetMapping(index, 'source_field', e.target.value)}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">选择数据集字段</option>
                      {dataSetFields.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    <span>→</span>
                    <input
                      type="text"
                      value={mapping.target_field}
                      onChange={(e) => handleUpdateDataSetMapping(index, 'target_field', e.target.value)}
                      placeholder="目标字段路径（如 body.userId）"
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDataSetMapping(index)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
              
              {/* 数据集预览 */}
              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', color: '#007bff' }}>预览数据集内容</summary>
                <pre style={{ 
                  backgroundColor: '#fff', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  overflow: 'auto', 
                  maxHeight: '200px',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(selectedDataSet.data?.slice(0, 3), null, 2)}
                  {(selectedDataSet.data?.length || 0) > 3 && '\n... 更多数据'}
                </pre>
              </details>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <h3>可用API {selectedGroupId && `(${apis.length})`}</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {!selectedGroupId ? (
                <p style={{ color: '#666' }}>请先选择API分组</p>
              ) : apis.length === 0 ? (
                <p style={{ color: '#666' }}>该分组下没有可用的API</p>
              ) : (
                apis.map((api) => (
                  <div
                    key={api.id}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{api.method}</strong> {api.path}
                      {api.summary && <div style={{ fontSize: '12px', color: '#666' }}>{api.summary}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddAPI(api)}
                      disabled={selectedAPIs.some((item) => item.api.id === api.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: selectedAPIs.some((item) => item.api.id === api.id) ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedAPIs.some((item) => item.api.id === api.id) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {selectedAPIs.some((item) => item.api.id === api.id) ? '已添加' : '添加'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3>已选API（执行顺序）</h3>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {selectedAPIs.length === 0 ? (
                <p>还没有选择API</p>
              ) : (
                selectedAPIs.map((item, index) => (
                  <div
                    key={item.api.id}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <strong>#{item.order}</strong> <strong>{item.api.method}</strong> {item.api.path}
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditMappings(index)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          字段映射 {item.enhanced_field_mappings.length > 0 && `(${item.enhanced_field_mappings.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAPI(item.api.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                    {item.enhanced_field_mappings.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#666', paddingLeft: '20px' }}>
                        {item.enhanced_field_mappings.map((m, i) => (
                          <div key={i}>
                            {m.source_type === 'api' ? `API #${selectedAPIs.findIndex(a => a.api.id === m.source_api_id) + 1}` : '数据集'}: {m.source_field} → {m.target_field}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '创建中...' : '创建测试用例'}
          </button>
          <button
            type="button"
            onClick={() => navigate(urlGroupId ? `/api-groups/${urlGroupId}` : '/api-groups')}
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

      {/* API字段映射弹窗 */}
      {showMappingModal && editingApiIndex !== null && (
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
          onClick={() => setShowMappingModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '600px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              配置字段映射 - {selectedAPIs[editingApiIndex].api.method} {selectedAPIs[editingApiIndex].api.path}
            </h3>
            
            <p style={{ color: '#666', fontSize: '14px' }}>
              配置从其他API响应中提取字段值并映射到当前API的请求参数
            </p>

            <div style={{ marginBottom: '15px' }}>
              <button
                type="button"
                onClick={() => handleAddApiMapping(editingApiIndex)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                + 添加字段映射
              </button>
            </div>

            {selectedAPIs[editingApiIndex].enhanced_field_mappings.length === 0 ? (
              <p style={{ color: '#999' }}>暂无字段映射配置</p>
            ) : (
              selectedAPIs[editingApiIndex].enhanced_field_mappings.map((mapping, mappingIndex) => {
                // 获取源API的响应参数列表
                const sourceApi = mapping.source_api_id 
                  ? selectedAPIs.find(s => s.api.id === mapping.source_api_id)?.api 
                  : null
                const sourceResponseParams = sourceApi?.parsed_response_params || []
                
                // 获取当前API的请求参数列表
                const targetApi = selectedAPIs[editingApiIndex].api
                const targetRequestParams = targetApi?.parsed_request_params || []

                return (
                  <div
                    key={mappingIndex}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>源类型</label>
                        <select
                          value={mapping.source_type || 'api'}
                          onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'source_type', e.target.value as 'api' | 'data_set')}
                          style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="api">来自其他API响应</option>
                          <option value="data_set">来自数据集</option>
                        </select>
                      </div>
                      {mapping.source_type !== 'data_set' && (
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>源API</label>
                          <select
                            value={mapping.source_api_id || ''}
                            onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'source_api_id', e.target.value ? parseInt(e.target.value) : undefined)}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="">选择源API</option>
                            {getAvailableSourceApis(editingApiIndex).map((sourceApi, sourceIndex) => (
                              <option key={sourceApi.api.id} value={sourceApi.api.id}>
                                #{sourceIndex + 1} {sourceApi.api.method} {sourceApi.api.path}
                                {!sourceApi.api.is_available && ' ⚠️不可用'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveApiMapping(editingApiIndex, mappingIndex)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          alignSelf: 'flex-end',
                        }}
                      >
                        删除
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
                          源字段（{mapping.source_type === 'data_set' ? '数据集字段' : '响应参数'}）
                        </label>
                        {mapping.source_type === 'data_set' ? (
                          <select
                            value={mapping.source_field}
                            onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'source_field', e.target.value)}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="">选择数据集字段</option>
                            {dataSetFields.map((field) => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        ) : sourceResponseParams.length > 0 ? (
                          <select
                            value={mapping.source_field}
                            onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'source_field', e.target.value)}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="">选择响应参数</option>
                            {sourceResponseParams.map((param: APIParam) => (
                              <option key={param.path} value={param.path}>
                                {param.path} ({param.type})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={mapping.source_field}
                            onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'source_field', e.target.value)}
                            placeholder="如: response.data.token"
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        )}
                      </div>
                      <span style={{ alignSelf: 'flex-end', paddingBottom: '8px' }}>→</span>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>目标字段（请求参数）</label>
                        {targetRequestParams.length > 0 ? (
                          <select
                            value={mapping.target_field}
                            onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'target_field', e.target.value)}
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          >
                            <option value="">选择请求参数</option>
                            {targetRequestParams.map((param: APIParam) => (
                              <option key={param.path} value={param.path}>
                                {param.path} ({param.type}) {param.required && '*'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={mapping.target_field}
                            onChange={(e) => handleUpdateApiMapping(editingApiIndex, mappingIndex, 'target_field', e.target.value)}
                            placeholder="如: body.token"
                            style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowMappingModal(false)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
