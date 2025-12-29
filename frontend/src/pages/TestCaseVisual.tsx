import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { testCaseApi, TestCaseVisual as TestCaseVisualData, VisualAPINode, VisualAPIParam, TestCaseExecutionRecord, TestCaseDetail, FieldMappingItem } from '../api/testCase'
import { testExecutionApi, testDataSetApi, TestDataSet } from '../api/testExecution'
import { apiGroupApi, GroupDataSet, apiDocApi, API, APIParam } from '../api/apiDoc'
import Loading from '../components/Loading'
import ErrorAlert from '../components/ErrorAlert'

export default function TestCaseVisual() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const testCaseId = parseInt(id || '0')

  const [data, setData] = useState<TestCaseVisualData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  
  // 执行相关状态
  const [executing, setExecuting] = useState(false)
  const [executions, setExecutions] = useState<TestCaseExecutionRecord[]>([])
  const [executionsTotal, setExecutionsTotal] = useState(0)
  const [executionsLoading, setExecutionsLoading] = useState(false)
  
  // 编辑相关状态
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<TestCaseDetail | null>(null)
  const [testCaseSaving, setTestCaseSaving] = useState(false)
  const [availableDataSets, setAvailableDataSets] = useState<{ group: GroupDataSet[], global: TestDataSet[] }>({ group: [], global: [] })
  
  // API详情抽屉相关状态
  const [showApiDetailDrawer, setShowApiDetailDrawer] = useState(false)
  const [selectedApi, setSelectedApi] = useState<API | null>(null)
  const [apiTags, setApiTags] = useState<string[]>([])
  const [apiRequestParams, setApiRequestParams] = useState<APIParam[]>([])
  const [apiResponseParams, setApiResponseParams] = useState<APIParam[]>([])
  const [newTag, setNewTag] = useState('')
  const [apiSaving, setApiSaving] = useState(false)

  const loadVisualData = useCallback(async () => {
    try {
      setLoading(true)
      const visualData = await testCaseApi.getVisual(testCaseId)
      setData(visualData)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载可视化数据失败')
    } finally {
      setLoading(false)
    }
  }, [testCaseId])

  const loadExecutions = useCallback(async () => {
    try {
      setExecutionsLoading(true)
      const result = await testCaseApi.getExecutions(testCaseId, 10)
      setExecutions(result.items)
      setExecutionsTotal(result.total)
    } catch (err: any) {
      console.error('加载执行记录失败:', err)
    } finally {
      setExecutionsLoading(false)
    }
  }, [testCaseId])

  useEffect(() => {
    loadVisualData()
    loadExecutions()
  }, [loadVisualData, loadExecutions])

  const handleExecute = async () => {
    if (executing) return
    
    // 执行前校验参数配置
    try {
      const validation = await testCaseApi.validateParams(testCaseId)
      if (!validation.valid && validation.missing_params.length > 0) {
        // 有未配置的参数，打开编辑抽屉让用户配置
        await handleOpenEditDrawer()
        alert(`发现 ${validation.missing_params.length} 个未配置的必需参数，请在编辑界面中配置字段映射后再执行。`)
        return
      }
    } catch (err: any) {
      console.error('参数校验失败:', err)
      // 校验失败也继续执行，让后端处理
    }
    
    setExecuting(true)
    try {
      await testExecutionApi.create({
        test_case_id: testCaseId,
        thread_count: 1,
      })
      // 延迟刷新执行记录
      setTimeout(() => {
        loadExecutions()
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.detail || '执行失败')
    } finally {
      setExecuting(false)
    }
  }

  // 打开编辑抽屉
  const handleOpenEditDrawer = async () => {
    try {
      const detail = await testCaseApi.get(testCaseId)
      
      // 加载所有API的详细信息（用于字段映射）
      const apiDetails = await Promise.all(
        detail.apis.map(api => apiDocApi.getAPIDetail(api.api_id).catch(() => null))
      )
      
      // 将API详情附加到用例数据中
      detail.apis = detail.apis.map((api, index) => ({
        ...api,
        apiDetail: apiDetails[index]
      }))
      
      setEditingTestCase(detail)
      
      // 获取分组ID（从第一个API的文档中获取）
      let groupId: number | undefined = undefined
      if (detail.apis.length > 0) {
        try {
          const firstApiDetail = await apiDocApi.getAPIDetail(detail.apis[0].api_id)
          if (firstApiDetail.document_id) {
            const doc = await apiDocApi.get(firstApiDetail.document_id)
            groupId = doc.group_id
          }
        } catch (err) {
          console.error('获取分组ID失败:', err)
        }
      }
      
      if (groupId) {
        // 加载数据集（用于字段映射选择）
        const [groupDataSets, globalDataSets] = await Promise.all([
          apiGroupApi.getDataSets(groupId, 1, 100).then(r => r.items),
          testDataSetApi.list()
        ])
        setAvailableDataSets({ group: groupDataSets, global: globalDataSets })
      } else {
        // 如果没有分组ID，只加载全局数据集
        const globalDataSets = await testDataSetApi.list()
        setAvailableDataSets({ group: [], global: globalDataSets })
      }
      
      setShowEditDrawer(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载用例详情失败')
    }
  }

  // 更新用例字段映射
  const handleUpdateTestCaseMapping = (apiIndex: number, mappingIndex: number, field: keyof FieldMappingItem, value: any) => {
    if (!editingTestCase) return
    const updated = { ...editingTestCase }
    if (updated.apis[apiIndex].enhanced_field_mappings) {
      updated.apis[apiIndex].enhanced_field_mappings![mappingIndex] = {
        ...updated.apis[apiIndex].enhanced_field_mappings![mappingIndex],
        [field]: value
      }
      setEditingTestCase(updated)
    }
  }

  // 添加用例字段映射
  const handleAddTestCaseMapping = (apiIndex: number) => {
    if (!editingTestCase) return
    const updated = { ...editingTestCase }
    if (!updated.apis[apiIndex].enhanced_field_mappings) {
      updated.apis[apiIndex].enhanced_field_mappings = []
    }
    const isFirstApi = apiIndex === 0
    updated.apis[apiIndex].enhanced_field_mappings!.push({
      source_field: '',
      target_field: '',
      source_type: isFirstApi ? 'data_set' : 'api', // 第一个接口默认数据集
      source_api_id: undefined
    })
    setEditingTestCase(updated)
  }

  // 基于数据集添加映射
  const handleAddTestCaseMappingFromDataSet = (apiIndex: number, dataSetId: number) => {
    if (!editingTestCase) return
    const updated = { ...editingTestCase }
    if (!updated.apis[apiIndex].enhanced_field_mappings) {
      updated.apis[apiIndex].enhanced_field_mappings = []
    }
    updated.apis[apiIndex].enhanced_field_mappings!.push({
      source_field: '',
      target_field: '',
      source_type: 'data_set',
      source_api_id: dataSetId
    })
    setEditingTestCase(updated)
  }

  // 提取字段名（从路径中提取最后的字段名）
  const extractFieldName = (fieldPath: string): string => {
    if (!fieldPath) return ''
    // 移除路径前缀，只保留最后的字段名
    const parts = fieldPath.split('.')
    return parts[parts.length - 1].toLowerCase().replace(/[_-]/g, '')
  }

  // 字段名匹配（忽略大小写、下划线、连字符）
  const isFieldNameMatch = (field1: string, field2: string): boolean => {
    const name1 = extractFieldName(field1)
    const name2 = extractFieldName(field2)
    return name1 === name2 && name1 !== ''
  }

  // 自动匹配字段映射
  const handleAutoMatchFields = (apiIndex: number, sourceType: 'api' | 'data_set', sourceId?: number) => {
    if (!editingTestCase) return
    
    const apiDetail = (editingTestCase.apis[apiIndex] as any).apiDetail
    const currentApiRequestParams = apiDetail?.parsed_request_params || []
    
    let sourceFields: string[] = []
    
    if (sourceType === 'data_set' && sourceId) {
      sourceFields = getDataSetFields(sourceId)
    } else if (sourceType === 'api' && sourceId) {
      const sourceApi = editingTestCase.apis.find(a => a.api_id === sourceId)
      if (sourceApi) {
        const sourceApiDetail = (sourceApi as any).apiDetail
        const responseParams = sourceApiDetail?.parsed_response_params || []
        sourceFields = responseParams.map((p: any) => p.path)
      }
    }
    
    if (sourceFields.length === 0 || currentApiRequestParams.length === 0) {
      return
    }
    
    const updated = { ...editingTestCase }
    if (!updated.apis[apiIndex].enhanced_field_mappings) {
      updated.apis[apiIndex].enhanced_field_mappings = []
    }
    
    // 获取已存在的映射，避免重复
    const existingMappings = updated.apis[apiIndex].enhanced_field_mappings || []
    const existingTargetFields = new Set(existingMappings.map(m => m.target_field))
    
    // 匹配同名字段
    const newMappings: FieldMappingItem[] = []
    for (const sourceField of sourceFields) {
      for (const targetParam of currentApiRequestParams) {
        const targetField = targetParam.path || `body.${targetParam.name}`
        // 如果字段名匹配且目标字段未被映射
        if (isFieldNameMatch(sourceField, targetField) && !existingTargetFields.has(targetField)) {
          newMappings.push({
            source_field: sourceField,
            target_field: targetField,
            source_type: sourceType,
            source_api_id: sourceId
          })
          existingTargetFields.add(targetField) // 标记为已映射
          break // 一个源字段只匹配一个目标字段
        }
      }
    }
    
    // 添加新匹配的映射
    if (newMappings.length > 0) {
      updated.apis[apiIndex].enhanced_field_mappings!.push(...newMappings)
      setEditingTestCase(updated)
    }
  }

  // 删除用例字段映射
  const handleDeleteTestCaseMapping = (apiIndex: number, mappingIndex: number) => {
    if (!editingTestCase) return
    const updated = { ...editingTestCase }
    if (updated.apis[apiIndex].enhanced_field_mappings) {
      updated.apis[apiIndex].enhanced_field_mappings = updated.apis[apiIndex].enhanced_field_mappings!.filter((_, i) => i !== mappingIndex)
      setEditingTestCase(updated)
    }
  }

  // 获取数据集字段列表
  const getDataSetFields = (dataSetId?: number): string[] => {
    if (!dataSetId) return []
    
    const groupDs = availableDataSets.group.find(ds => ds.id === dataSetId)
    if (groupDs && groupDs.data) {
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
      extractFields(groupDs.data)
      return fields
    }
    
    const globalDs = availableDataSets.global.find(ds => ds.id === dataSetId)
    if (globalDs && globalDs.data && Array.isArray(globalDs.data) && globalDs.data.length > 0) {
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
      extractFields(globalDs.data[0])
      return fields
    }
    
    return []
  }

  // 打开API详情抽屉
  const handleOpenApiDetail = async (apiId: number) => {
    try {
      const apiDetail = await apiDocApi.getAPIDetail(apiId)
      setSelectedApi(apiDetail)
      setApiTags(apiDetail.tags || [])
      setApiRequestParams(apiDetail.parsed_request_params || [])
      setApiResponseParams(apiDetail.parsed_response_params || [])
      setNewTag('')
      setShowApiDetailDrawer(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载API详情失败')
    }
  }

  // 新增参数
  const handleAddParam = (type: 'request' | 'response') => {
    const newParam: APIParam = {
      name: '',
      path: '',
      type: 'string',
      required: false,
      description: '',
    }
    if (type === 'request') {
      setApiRequestParams([...apiRequestParams, newParam])
    } else {
      setApiResponseParams([...apiResponseParams, newParam])
    }
  }

  // 更新参数
  const handleUpdateParam = (type: 'request' | 'response', index: number, field: keyof APIParam, value: any) => {
    if (type === 'request') {
      const updated = [...apiRequestParams]
      updated[index] = { ...updated[index], [field]: value }
      // 自动更新path
      if (field === 'name') {
        updated[index].path = `body.${value}`
      }
      setApiRequestParams(updated)
    } else {
      const updated = [...apiResponseParams]
      updated[index] = { ...updated[index], [field]: value }
      if (field === 'name') {
        updated[index].path = `response.${value}`
      }
      setApiResponseParams(updated)
    }
  }

  // 删除参数
  const handleDeleteParam = (type: 'request' | 'response', index: number) => {
    if (type === 'request') {
      setApiRequestParams(apiRequestParams.filter((_, i) => i !== index))
    } else {
      setApiResponseParams(apiResponseParams.filter((_, i) => i !== index))
    }
  }

  // 保存接口
  const handleSaveApi = async () => {
    if (!selectedApi) return
    setApiSaving(true)
    try {
      await apiDocApi.updateAPI(selectedApi.id, {
        tags: apiTags,
        parsed_request_params: apiRequestParams,
        parsed_response_params: apiResponseParams,
        is_available: true,
      })
      setShowApiDetailDrawer(false)
      // 重新加载可视化数据以反映更改
      loadVisualData()
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败')
    } finally {
      setApiSaving(false)
    }
  }

  // 保存用例
  const handleSaveTestCase = async () => {
    if (!editingTestCase) return
    setTestCaseSaving(true)
    try {
      let dataSetId: number | undefined = undefined
      for (const api of editingTestCase.apis) {
        if (api.enhanced_field_mappings) {
          for (const mapping of api.enhanced_field_mappings) {
            if (mapping.source_type === 'data_set' && mapping.source_api_id) {
              dataSetId = mapping.source_api_id
              break
            }
          }
          if (dataSetId) break
        }
      }
      
      await testCaseApi.update(editingTestCase.id, {
        name: editingTestCase.name,
        description: editingTestCase.description,
        data_set_id: dataSetId,
        apis: editingTestCase.apis.map(api => ({
          api_id: api.api_id,
          order: api.order,
          retry_count: api.retry_count || 0,
          retry_interval: api.retry_interval || 0,
          wait_time: api.wait_time || 0,
          enhanced_field_mappings: api.enhanced_field_mappings?.filter(m => m.source_field && m.target_field) || []
        }))
      })
      setShowEditDrawer(false)
      // 重新加载可视化数据
      loadVisualData()
      loadExecutions()
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败')
    } finally {
      setTestCaseSaving(false)
    }
  }

  const toggleNodeExpand = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      GET: { bg: '#d4edda', text: '#155724' },
      POST: { bg: '#cce5ff', text: '#004085' },
      PUT: { bg: '#fff3cd', text: '#856404' },
      DELETE: { bg: '#f8d7da', text: '#721c24' },
      PATCH: { bg: '#d1ecf1', text: '#0c5460' },
    }
    return colors[method.toUpperCase()] || { bg: '#e2e3e5', text: '#383d41' }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#fff3cd', text: '#856404' },
      running: { bg: '#cce5ff', text: '#004085' },
      completed: { bg: '#d4edda', text: '#155724' },
      failed: { bg: '#f8d7da', text: '#721c24' },
      cancelled: { bg: '#e2e3e5', text: '#383d41' },
    }
    return colors[status] || { bg: '#e2e3e5', text: '#383d41' }
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '等待中',
      running: '执行中',
      completed: '成功',
      failed: '失败',
      cancelled: '已取消',
    }
    return texts[status] || status
  }

  const renderParam = (param: VisualAPIParam) => (
    <div
      key={param.path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: param.is_mapped ? '#e7f1ff' : '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        marginBottom: '4px',
      }}
    >
      <span style={{ fontWeight: 'bold', color: '#333' }}>{param.name}</span>
      <span style={{ color: '#999' }}>({param.type})</span>
      {param.is_mapped && (
        <span
          style={{
            padding: '2px 6px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '10px',
            fontSize: '10px',
          }}
        >
          ← {param.mapping_source}
        </span>
      )}
    </div>
  )

  const renderAPICard = (node: VisualAPINode, index: number) => {
    const methodStyle = getMethodColor(node.method)
    const isExpanded = expandedNodes.has(node.id)

    return (
      <div key={node.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
        {index > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginRight: '15px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '2px',
                backgroundColor: '#007bff',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '-4px',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid #007bff',
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                }}
              />
            </div>
            {node.incoming_mappings.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  fontSize: '10px',
                  color: '#007bff',
                  whiteSpace: 'nowrap',
                }}
              >
                {node.incoming_mappings.length} 个字段映射
              </div>
            )}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '15px',
            minWidth: '280px',
            maxWidth: '350px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={() => handleOpenApiDetail(node.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
            e.currentTarget.style.borderColor = '#007bff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
            e.currentTarget.style.borderColor = '#e0e0e0'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              width: '24px',
              height: '24px',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {node.order + 1}
          </div>

          {node.has_condition && (
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '10px',
                padding: '3px 8px',
                backgroundColor: '#ffc107',
                color: '#856404',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              条件执行
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span
              style={{
                padding: '4px 10px',
                backgroundColor: methodStyle.bg,
                color: methodStyle.text,
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {node.method}
            </span>
            <code
              style={{
                fontSize: '13px',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
              title={node.path}
            >
              {node.path}
            </code>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenApiDetail(node.id)
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              title="编辑接口"
            >
              编辑
            </button>
          </div>

          {node.summary && (
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
              {node.summary}
            </div>
          )}

          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                fontSize: '11px',
                color: '#999',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              参数
            </div>
            {node.key_params.length > 0 ? (
              node.key_params.map(renderParam)
            ) : (
              <div style={{ fontSize: '12px', color: '#999' }}>无参数</div>
            )}
          </div>

          {node.all_params.length > 3 && (
            <button
              onClick={() => toggleNodeExpand(node.id)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#666',
              }}
            >
              {isExpanded ? '收起' : `展开全部 (${node.all_params.length} 个参数)`}
            </button>
          )}

          {isExpanded && (
            <div
              style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              {node.all_params.slice(3).map(renderParam)}
            </div>
          )}

          {/* 字段映射关系 */}
          {node.incoming_mappings.length > 0 && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#e7f1ff',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#004085' }}>
                📊 字段映射 ({node.incoming_mappings.length})
              </div>
              {node.incoming_mappings.map((mapping, i) => (
                <div key={i} style={{ marginBottom: '6px', padding: '6px', backgroundColor: 'white', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: '#666', fontSize: '11px' }}>
                      {mapping.source_type === 'data_set' ? '📦 数据集' : `API #${mapping.source_api_order}`}
                    </span>
                    <span style={{ color: '#999', fontSize: '10px' }}>→</span>
                    <span style={{ color: '#333', fontSize: '11px', fontWeight: 'bold' }}>{mapping.target_field}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', paddingLeft: '8px' }}>
                    {mapping.source_field}
                  </div>
                </div>
              ))}
            </div>
          )}

          {node.has_condition && node.condition && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fff8e1',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#856404' }}>
                执行条件 ({node.condition.logic})
              </div>
              {node.condition.conditions.map((cond, i) => (
                <div key={i} style={{ color: '#666', marginBottom: '3px' }}>
                  • API #{cond.source_api_id}: {cond.field_path} {cond.operator} {String(cond.value)}
                </div>
              ))}
              <div style={{ marginTop: '5px', color: '#856404' }}>
                失败策略: {
                  node.condition?.on_fail === 'skip' ? '跳过' :
                  node.condition?.on_fail === 'fail' ? '标记失败' : '继续执行'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return <Loading text="加载可视化数据..." />
  }

  if (!data) {
    return <ErrorAlert message="用例不存在" />
  }

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => {
            // 从location.state获取返回信息
            const returnPath = (location.state as any)?.returnPath
            const returnTab = (location.state as any)?.returnTab
            if (returnPath) {
              navigate(returnPath, { state: { activeTab: returnTab } })
            } else {
              navigate(-1)
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          ← 返回
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1a1a2e' }}>{data.name}</h2>
            {data.description && (
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{data.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleExecute}
              disabled={executing}
              style={{
                padding: '10px 24px',
                backgroundColor: executing ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: executing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {executing ? '⏳ 执行中...' : '▶️ 执行用例'}
            </button>
            <button
              onClick={handleOpenEditDrawer}
              style={{
                padding: '10px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ✏️ 编辑用例
            </button>
            {data.has_data_set && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e7f1ff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#007bff',
                }}
              >
                📊 数据集: {data.data_set_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {/* 图例 */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          fontSize: '13px',
          border: '1px solid #e0e0e0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: '#007bff',
              borderRadius: '50%',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}
          >
            1
          </span>
          <span>执行顺序</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '2px', backgroundColor: '#007bff' }} />
          <span>调用流向</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: '#e7f1ff',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            已映射
          </span>
          <span>字段映射</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: '#ffc107',
              color: '#856404',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          >
            条件执行
          </span>
          <span>需满足条件</span>
        </div>
      </div>

      {/* 可视化卡片流 */}
      {data.nodes.length === 0 ? (
        <div
          style={{
            padding: '60px',
            textAlign: 'center',
            color: '#999',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          该用例暂无API配置
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0',
            overflowX: 'auto',
            padding: '30px 24px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}
        >
          {data.nodes.map((node, index) => renderAPICard(node, index))}
        </div>
      )}

      {/* 统计信息 */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          gap: '32px',
          padding: '16px 20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          fontSize: '14px',
        }}
      >
        <div>
          <strong>API总数:</strong> {data.nodes.length}
        </div>
        <div>
          <strong>带条件执行:</strong> {data.nodes.filter((n) => n.has_condition).length}
        </div>
        <div>
          <strong>字段映射:</strong>{' '}
          {data.nodes.reduce((sum, n) => sum + n.incoming_mappings.length, 0)} 个
        </div>
      </div>

      {/* 执行记录 */}
      <div
        style={{
          marginTop: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            执行记录 ({executionsTotal})
          </h3>
          <button
            onClick={loadExecutions}
            disabled={executionsLoading}
            style={{
              padding: '6px 14px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {executionsLoading ? '刷新中...' : '刷新'}
          </button>
        </div>

        {executionsLoading && executions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            加载中...
          </div>
        ) : executions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            暂无执行记录
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>时间</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>状态</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>成功/失败</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>耗时</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => {
                const statusStyle = getStatusColor(exec.status)
                return (
                  <tr key={exec.id} style={{ borderTop: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px 20px', fontSize: '13px' }}>
                      {new Date(exec.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text,
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      >
                        {getStatusText(exec.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#28a745' }}>{exec.success_count}</span>
                      {' / '}
                      <span style={{ color: '#dc3545' }}>{exec.failure_count}</span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: '13px' }}>
                      {exec.duration ? `${exec.duration.toFixed(2)}s` : '-'}
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => navigate(`/test-executions/${exec.id}`, { 
                          state: { 
                            returnPath: `/test-cases/${testCaseId}/visual`,
                            returnState: {}
                          } 
                        })}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 编辑抽屉 */}
      {showEditDrawer && editingTestCase && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setShowEditDrawer(false)}
        >
          <div
            style={{
              width: '700px',
              maxWidth: '100%',
              backgroundColor: 'white',
              height: '100%',
              overflow: 'auto',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>编辑用例: {editingTestCase.name}</h3>
              <button
                onClick={() => setShowEditDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* 用例基本信息 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>用例名称</label>
                <input
                  type="text"
                  value={editingTestCase.name}
                  onChange={(e) => setEditingTestCase({ ...editingTestCase, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>描述</label>
                <textarea
                  value={editingTestCase.description || ''}
                  onChange={(e) => setEditingTestCase({ ...editingTestCase, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', minHeight: '60px', boxSizing: 'border-box' }}
                />
              </div>

              {/* API列表和字段映射 */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>
                  API列表和字段映射 ({editingTestCase.apis.length} 个API)
                </label>
                
                {editingTestCase.apis.map((api, apiIndex) => {
                  // 获取当前API的详细信息（从apiDetail或data中获取）
                  const apiDetail = (api as any).apiDetail
                  const currentApiNode = data?.nodes.find(n => n.order === api.order)
                  const currentApiRequestParams = apiDetail?.parsed_request_params || currentApiNode?.all_params.filter(p => p.path.startsWith('body.') || p.path.startsWith('query.') || p.path.startsWith('path.')) || []
                  
                  // 获取源API的响应参数
                  const getSourceApiResponseParams = (sourceApiId: number) => {
                    const sourceApi = editingTestCase.apis.find(a => a.api_id === sourceApiId)
                    if (!sourceApi) return []
                    const sourceApiDetail = (sourceApi as any).apiDetail
                    const sourceApiNode = data?.nodes.find(n => n.order === sourceApi.order)
                    return sourceApiDetail?.parsed_response_params || sourceApiNode?.all_params.filter(p => p.path.startsWith('response.')) || []
                  }
                  
                  return (
                    <div key={api.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600 }}>#{api.order + 1}</span>
                        {currentApiNode && (
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {currentApiNode.method} {currentApiNode.path}
                            {currentApiNode.summary && ` - ${currentApiNode.summary}`}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>字段映射</span>
                          <button
                            onClick={() => handleAddTestCaseMapping(apiIndex)}
                            style={{ padding: '4px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            + 添加映射
                          </button>
                        </div>
                        
                        {(!api.enhanced_field_mappings || api.enhanced_field_mappings.length === 0) ? (
                          <div style={{ fontSize: '12px', color: '#999', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            暂无字段映射
                          </div>
                        ) : (
                          api.enhanced_field_mappings.map((mapping, mappingIndex) => {
                            const sourceType = mapping.source_type || 'api'
                            // 第一个接口只能选择数据集
                            const isFirstApi = apiIndex === 0
                            // 第一个接口强制使用数据集类型
                            const effectiveSourceType = isFirstApi ? 'data_set' : sourceType
                            const dataSetFields = effectiveSourceType === 'data_set' && mapping.source_api_id 
                              ? getDataSetFields(mapping.source_api_id) 
                              : []
                            const sourceApiResponseParams = mapping.source_api_id && effectiveSourceType === 'api'
                              ? getSourceApiResponseParams(mapping.source_api_id)
                              : []
                            // 如果是第一个接口且当前类型不是数据集，自动设置为数据集
                            if (isFirstApi && mapping.source_type !== 'data_set') {
                              handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_type', 'data_set')
                            }
                            
                            return (
                              <div key={mappingIndex} style={{ padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#fafafa' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                  {/* 源类型选择 - 第一个接口不显示，固定为数据集 */}
                                  {!isFirstApi && (
                                    <select
                                      value={sourceType}
                                      onChange={(e) => {
                                        const newType = e.target.value as 'api' | 'data_set'
                                        handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_type', newType)
                                        handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_api_id', undefined)
                                      }}
                                      style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', width: '100px' }}
                                    >
                                      <option value="api">源API</option>
                                      <option value="data_set">数据集</option>
                                    </select>
                                  )}
                                  
                                  {/* 根据源类型显示不同的选择器 */}
                                  {effectiveSourceType === 'api' ? (
                                    <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <select
                                        value={mapping.source_api_id || ''}
                                        onChange={(e) => {
                                          const newSourceId = e.target.value ? parseInt(e.target.value) : undefined
                                          handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_api_id', newSourceId)
                                          // 选择源API后自动匹配
                                          if (newSourceId) {
                                            setTimeout(() => {
                                              handleAutoMatchFields(apiIndex, 'api', newSourceId)
                                            }, 100)
                                          }
                                        }}
                                        style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                                      >
                                        <option value="">选择源API</option>
                                        {editingTestCase.apis.slice(0, apiIndex).map((srcApi) => {
                                          const srcApiDetail = (srcApi as any).apiDetail
                                          const srcApiNode = data?.nodes.find(n => n.order === srcApi.order)
                                          const apiPath = srcApiDetail?.path || srcApiNode?.path || ''
                                          const apiSummary = srcApiDetail?.summary || srcApiNode?.summary || `API #${srcApi.order + 1}`
                                          return (
                                            <option 
                                              key={srcApi.api_id} 
                                              value={srcApi.api_id}
                                              title={apiPath}
                                            >
                                              {apiSummary}
                                            </option>
                                          )
                                        })}
                                      </select>
                                      {mapping.source_api_id && (
                                        <button
                                          onClick={() => handleAutoMatchFields(apiIndex, 'api', mapping.source_api_id)}
                                          style={{ padding: '6px 10px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                                          title="自动匹配同名字段"
                                        >
                                          🔍 自动匹配
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <select
                                        value={mapping.source_api_id || ''}
                                        onChange={(e) => {
                                          const newSourceId = e.target.value ? parseInt(e.target.value) : undefined
                                          handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_api_id', newSourceId)
                                          // 选择数据集后自动匹配
                                          if (newSourceId) {
                                            setTimeout(() => {
                                              handleAutoMatchFields(apiIndex, 'data_set', newSourceId)
                                            }, 100)
                                          }
                                        }}
                                        style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                                      >
                                        <option value="">选择数据集</option>
                                        {availableDataSets.group.length > 0 && (
                                          <optgroup label="分组数据集">
                                            {availableDataSets.group.map((ds) => (
                                              <option key={`group-${ds.id}`} value={ds.id}>
                                                {ds.name}
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                        {availableDataSets.global.length > 0 && (
                                          <optgroup label="全局数据集">
                                            {availableDataSets.global.map((ds) => (
                                              <option key={`global-${ds.id}`} value={ds.id}>
                                                {ds.name}
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                      </select>
                                      {mapping.source_api_id && (
                                        <>
                                          <button
                                            onClick={() => handleAutoMatchFields(apiIndex, 'data_set', mapping.source_api_id)}
                                            style={{ padding: '6px 10px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                                            title="自动匹配同名字段"
                                          >
                                            🔍 自动匹配
                                          </button>
                                          <button
                                            onClick={() => handleAddTestCaseMappingFromDataSet(apiIndex, mapping.source_api_id!)}
                                            style={{ padding: '6px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                                            title="基于此数据集添加新映射"
                                          >
                                            + 添加映射
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteTestCaseMapping(apiIndex, mappingIndex)}
                                    style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                  >
                                    ×
                                  </button>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  {/* 源字段选择 */}
                                  {effectiveSourceType === 'api' ? (
                                    <select
                                      value={mapping.source_field}
                                      onChange={(e) => handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_field', e.target.value)}
                                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                                    >
                                      <option value="">选择源API响应字段</option>
                                      {sourceApiResponseParams.map((param: { path: string; type?: string; name?: string }, idx: number) => (
                                        <option key={param.path || idx} value={param.path}>
                                          {param.path} ({param.type || 'string'})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <select
                                      value={mapping.source_field}
                                      onChange={(e) => handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_field', e.target.value)}
                                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                                    >
                                      <option value="">选择数据集字段</option>
                                      {dataSetFields.map((field) => (
                                        <option key={field} value={field}>{field}</option>
                                      ))}
                                    </select>
                                  )}
                                  
                                  <span style={{ color: '#666' }}>→</span>
                                  
                                  {/* 目标字段 - 下拉选择当前接口的请求字段 */}
                                  <select
                                    value={mapping.target_field}
                                    onChange={(e) => handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'target_field', e.target.value)}
                                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                                  >
                                    <option value="">选择目标字段</option>
                                  {currentApiRequestParams.map((param: any, idx: number) => (
                                    <option key={param.path || param.name || idx} value={param.path || `body.${param.name}`}>
                                      {param.path || `body.${param.name}`} ({param.type || 'string'}) {param.required && '*'}
                                    </option>
                                  ))}
                                  </select>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditDrawer(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveTestCase}
                disabled={testCaseSaving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: testCaseSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: testCaseSaving ? 0.7 : 1,
                }}
              >
                {testCaseSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API详情抽屉 */}
      {showApiDetailDrawer && selectedApi && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setShowApiDetailDrawer(false)}
        >
          <div
            style={{
              width: '650px',
              maxWidth: '100%',
              backgroundColor: 'white',
              height: '100%',
              overflow: 'auto',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>接口详情</h3>
              <button
                onClick={() => setShowApiDetailDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* 基本信息 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span
                    style={{
                      padding: '6px 12px',
                      backgroundColor: getMethodColor(selectedApi.method).bg,
                      color: getMethodColor(selectedApi.method).text,
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    {selectedApi.method}
                  </span>
                  <code style={{ fontSize: '14px', color: '#333' }}>{selectedApi.path}</code>
                </div>
                {selectedApi.summary && (
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{selectedApi.summary}</p>
                )}
              </div>

              {/* 标签 */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>标签</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {apiTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#e7f1ff',
                        color: '#007bff',
                        borderRadius: '16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => setApiTags(apiTags.filter((t) => t !== tag))}
                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0, fontSize: '16px' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="添加标签"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newTag.trim() && !apiTags.includes(newTag.trim())) {
                        setApiTags([...apiTags, newTag.trim()])
                        setNewTag('')
                      }
                    }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => {
                      if (newTag.trim() && !apiTags.includes(newTag.trim())) {
                        setApiTags([...apiTags, newTag.trim()])
                        setNewTag('')
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 请求参数 - 支持编辑 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>
                    请求参数 ({apiRequestParams.length})
                  </label>
                  <button
                    onClick={() => handleAddParam('request')}
                    style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + 添加
                  </button>
                </div>
                {apiRequestParams.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', color: '#666', fontSize: '13px' }}>
                    暂无请求参数，点击上方按钮添加
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
                    {apiRequestParams.map((param, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', padding: '10px', borderBottom: i < apiRequestParams.length - 1 ? '1px solid #e0e0e0' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <input
                          placeholder="名称"
                          value={param.name}
                          onChange={(e) => handleUpdateParam('request', i, 'name', e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        />
                        <select
                          value={param.type}
                          onChange={(e) => handleUpdateParam('request', i, 'type', e.target.value)}
                          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', width: '100px' }}
                        >
                          <option value="string">string</option>
                          <option value="integer">integer</option>
                          <option value="boolean">boolean</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => handleUpdateParam('request', i, 'required', e.target.checked)}
                          />
                          必填
                        </label>
                        <button
                          onClick={() => handleDeleteParam('request', i)}
                          style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 响应参数 - 支持编辑 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>
                    响应参数 ({apiResponseParams.length})
                  </label>
                  <button
                    onClick={() => handleAddParam('response')}
                    style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + 添加
                  </button>
                </div>
                {apiResponseParams.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', color: '#666', fontSize: '13px' }}>
                    暂无响应参数，点击上方按钮添加
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
                    {apiResponseParams.map((param, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', padding: '10px', borderBottom: i < apiResponseParams.length - 1 ? '1px solid #e0e0e0' : 'none', backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <input
                          placeholder="名称"
                          value={param.name}
                          onChange={(e) => handleUpdateParam('response', i, 'name', e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        />
                        <select
                          value={param.type}
                          onChange={(e) => handleUpdateParam('response', i, 'type', e.target.value)}
                          style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', width: '100px' }}
                        >
                          <option value="string">string</option>
                          <option value="integer">integer</option>
                          <option value="boolean">boolean</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                        </select>
                        <button
                          onClick={() => handleDeleteParam('response', i)}
                          style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowApiDetailDrawer(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveApi}
                disabled={apiSaving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: apiSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: apiSaving ? 0.7 : 1,
                }}
              >
                {apiSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
