import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { apiGroupApi, apiDocApi, APIGroup, API, GroupDataSet, APIRelatedTestCase, APIParam } from '../api/apiDoc'
import { testCaseApi, TestCaseDetail, FieldMappingItem } from '../api/testCase'
import { TestCase } from '../api/testCase'
import { testDataSetApi, TestDataSet } from '../api/testExecution'
import Loading from '../components/Loading'
import ErrorAlert from '../components/ErrorAlert'
import EmptyState from '../components/EmptyState'

type TabType = 'apis' | 'test-cases' | 'datasets'

// 数据集键值对类型
interface DataField {
  key: string
  value: string
}

export default function ApiGroupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const groupId = parseInt(id || '0')

  const [group, setGroup] = useState<APIGroup | null>(null)
  // 从location.state获取activeTab，如果没有则默认为'apis'
  const locationState = location.state as { activeTab?: TabType } | null
  const [activeTab, setActiveTab] = useState<TabType>(locationState?.activeTab || 'apis')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // APIs 分页状态
  const [apis, setApis] = useState<API[]>([])
  const [apisPage, setApisPage] = useState(1)
  const [apisTotal, setApisTotal] = useState(0)
  const [apisPages, setApisPages] = useState(0)
  const [apisLoading, setApisLoading] = useState(false)
  const [apiSearch, setApiSearch] = useState('')
  const [apiMethod, setApiMethod] = useState('')

  // Test Cases 分页状态
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testCasesPage, setTestCasesPage] = useState(1)
  const [testCasesTotal, setTestCasesTotal] = useState(0)
  const [testCasesPages, setTestCasesPages] = useState(0)
  const [testCasesLoading, setTestCasesLoading] = useState(false)
  const [testCaseSearch, setTestCaseSearch] = useState('')

  // Datasets 状态
  const [datasets, setDatasets] = useState<GroupDataSet[]>([])
  const [datasetsTotal, setDatasetsTotal] = useState(0)
  const [datasetsLoading, setDatasetsLoading] = useState(false)

  // 弹窗状态
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDataSetModal, setShowDataSetModal] = useState(false)
  const [showApiDetailDrawer, setShowApiDetailDrawer] = useState(false)
  const [selectedApi, setSelectedApi] = useState<API | null>(null)
  const [apiRelatedCases, setApiRelatedCases] = useState<{ [key: number]: APIRelatedTestCase[] }>({})
  const [expandedApiCases, setExpandedApiCases] = useState<number | null>(null)

  // 用例编辑抽屉状态
  const [showTestCaseDrawer, setShowTestCaseDrawer] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<TestCaseDetail | null>(null)
  const [testCaseSaving, setTestCaseSaving] = useState(false)
  const [availableDataSets, setAvailableDataSets] = useState<{ group: GroupDataSet[], global: TestDataSet[] }>({ group: [], global: [] })

  // 上传相关状态
  const [uploadTab, setUploadTab] = useState<'file' | 'manual'>('file')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [manualApiMethod, setManualApiMethod] = useState('GET')
  const [manualApiPath, setManualApiPath] = useState('')
  const [manualApiSummary, setManualApiSummary] = useState('')
  const [manualApiTags, setManualApiTags] = useState('')
  const [manualReqParams, setManualReqParams] = useState<APIParam[]>([])
  const [manualResParams, setManualResParams] = useState<APIParam[]>([])

  // 数据集编辑状态 - 改为键值对形式
  const [editingDataset, setEditingDataset] = useState<GroupDataSet | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [datasetDescription, setDatasetDescription] = useState('')
  const [dataFields, setDataFields] = useState<DataField[]>([{ key: '', value: '' }])
  const [datasetSaving, setDatasetSaving] = useState(false)

  // API编辑状态
  const [apiTags, setApiTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [apiRequestParams, setApiRequestParams] = useState<APIParam[]>([])
  const [apiResponseParams, setApiResponseParams] = useState<APIParam[]>([])
  const [apiSaving, setApiSaving] = useState(false)

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiGroupApi.get(groupId)
      setGroup(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载分组信息失败')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const loadApis = useCallback(async () => {
    try {
      setApisLoading(true)
      setError('')
      const data = await apiGroupApi.getAPIs(groupId, apisPage, 20, {
        search: apiSearch || undefined,
        method: apiMethod || undefined,
      })
      setApis(data.items)
      setApisTotal(data.total)
      setApisPages(data.pages)
    } catch (err: any) {
      console.error('加载接口列表失败:', err)
    } finally {
      setApisLoading(false)
    }
  }, [groupId, apisPage, apiSearch, apiMethod])

  const loadTestCases = useCallback(async () => {
    try {
      setTestCasesLoading(true)
      setError('')
      const data = await apiGroupApi.getTestCases(
        groupId,
        testCasesPage,
        20,
        testCaseSearch || undefined
      )
      setTestCases(data.items)
      setTestCasesTotal(data.total)
      setTestCasesPages(data.pages)
    } catch (err: any) {
      console.error('加载用例列表失败:', err)
    } finally {
      setTestCasesLoading(false)
    }
  }, [groupId, testCasesPage, testCaseSearch])

  const loadDatasets = useCallback(async () => {
    try {
      setDatasetsLoading(true)
      setError('')
      const data = await apiGroupApi.getDataSets(groupId, 1, 100)
      setDatasets(data.items)
      setDatasetsTotal(data.total)
    } catch (err: any) {
      console.error('加载数据集失败:', err)
    } finally {
      setDatasetsLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (groupId) {
      loadGroup()
      // 同时加载数据集数量（用于Tab显示）
      loadDatasets()
    }
  }, [groupId, loadGroup, loadDatasets])

  // 监听location.state的变化，更新activeTab
  useEffect(() => {
    const stateTab = (location.state as { activeTab?: TabType } | null)?.activeTab
    if (stateTab && stateTab !== activeTab) {
      setActiveTab(stateTab)
    }
  }, [location.state, activeTab])

  useEffect(() => {
    if (!groupId) return
    setError('')
    if (activeTab === 'apis') {
      loadApis()
    } else if (activeTab === 'test-cases') {
      loadTestCases()
    } else if (activeTab === 'datasets') {
      // 数据集已在初始加载时获取，这里不需要重复加载
      // 但如果列表为空，可能是加载失败，重新尝试
      if (datasets.length === 0 && !datasetsLoading) {
        loadDatasets()
      }
    }
  }, [activeTab, groupId, loadApis, loadTestCases, loadDatasets])

  const handleSearchApis = () => {
    setApisPage(1)
    loadApis()
  }

  const handleSearchTestCases = () => {
    setTestCasesPage(1)
    loadTestCases()
  }

  // 加载接口关联用例
  const loadApiRelatedCases = async (apiId: number) => {
    if (apiRelatedCases[apiId]) {
      setExpandedApiCases(expandedApiCases === apiId ? null : apiId)
      return
    }
    try {
      const data = await apiDocApi.getAPIRelatedTestCases(apiId)
      setApiRelatedCases((prev) => ({ ...prev, [apiId]: data.items }))
      setExpandedApiCases(apiId)
    } catch (err: any) {
      console.error('加载关联用例失败:', err)
    }
  }

  // 打开接口详情
  const handleOpenApiDetail = (api: API) => {
    setSelectedApi(api)
    setApiTags(api.tags || [])
    setApiRequestParams(api.parsed_request_params || [])
    setApiResponseParams(api.parsed_response_params || [])
    setNewTag('')
    setShowApiDetailDrawer(true)
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
      loadApis()
      loadGroup()
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败')
    } finally {
      setApiSaving(false)
    }
  }

  // 上传文件
  const handleUploadFile = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      await apiDocApi.upload(uploadFile, { groupId })
      setShowUploadModal(false)
      setUploadFile(null)
      loadApis()
      loadGroup()
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 手动添加接口
  const handleManualAdd = async () => {
    if (!manualApiMethod || !manualApiPath) {
      setError('请填写HTTP方法和路径')
      return
    }
    setUploading(true)
    try {
      await apiGroupApi.createAPI(groupId, {
        method: manualApiMethod,
        path: manualApiPath,
        summary: manualApiSummary || undefined,
        tags: manualApiTags ? manualApiTags.split(',').map((t) => t.trim()) : undefined,
        parsed_request_params: manualReqParams.filter(p => p.name),
        parsed_response_params: manualResParams.filter(p => p.name),
      })
      setShowUploadModal(false)
      resetManualForm()
      loadApis()
      loadGroup()
    } catch (err: any) {
      setError(err.response?.data?.detail || '添加失败')
    } finally {
      setUploading(false)
    }
  }

  const resetManualForm = () => {
    setManualApiMethod('GET')
    setManualApiPath('')
    setManualApiSummary('')
    setManualApiTags('')
    setManualReqParams([])
    setManualResParams([])
  }

  // 打开数据集编辑
  const handleOpenDatasetModal = (dataset?: GroupDataSet) => {
    if (dataset) {
      setEditingDataset(dataset)
      setDatasetName(dataset.name)
      setDatasetDescription(dataset.description || '')
      // 将对象转换为键值对数组
      if (dataset.data && typeof dataset.data === 'object') {
        const fields = Object.entries(dataset.data).map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        }))
        setDataFields(fields.length > 0 ? fields : [{ key: '', value: '' }])
      } else {
        setDataFields([{ key: '', value: '' }])
      }
    } else {
      setEditingDataset(null)
      setDatasetName('')
      setDatasetDescription('')
      setDataFields([{ key: '', value: '' }])
    }
    setShowDataSetModal(true)
  }

  // 添加数据字段
  const handleAddDataField = () => {
    setDataFields([...dataFields, { key: '', value: '' }])
  }

  // 更新数据字段
  const handleUpdateDataField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...dataFields]
    updated[index][field] = value
    setDataFields(updated)
  }

  // 删除数据字段
  const handleDeleteDataField = (index: number) => {
    if (dataFields.length > 1) {
      setDataFields(dataFields.filter((_, i) => i !== index))
    }
  }

  // 保存数据集
  const handleSaveDataset = async () => {
    if (!datasetName.trim()) {
      setError('请填写数据集名称')
      return
    }
    setDatasetSaving(true)
    try {
      // 将键值对数组转换为对象
      const dataObj: Record<string, any> = {}
      dataFields.forEach(field => {
        if (field.key.trim()) {
          // 尝试解析JSON，如果失败则作为字符串
          try {
            dataObj[field.key.trim()] = JSON.parse(field.value)
          } catch {
            dataObj[field.key.trim()] = field.value
          }
        }
      })

      if (editingDataset) {
        await apiGroupApi.updateDataSet(groupId, editingDataset.id, {
          name: datasetName.trim(),
          description: datasetDescription.trim() || undefined,
          data: dataObj,
        })
      } else {
        await apiGroupApi.createDataSet(groupId, {
          name: datasetName.trim(),
          description: datasetDescription.trim() || undefined,
          data: dataObj,
        })
      }
      setShowDataSetModal(false)
      loadDatasets()
      loadGroup()
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败')
    } finally {
      setDatasetSaving(false)
    }
  }

  // 删除数据集
  const handleDeleteDataset = async (datasetId: number) => {
    if (!window.confirm('确定删除该数据集？')) return
    try {
      await apiGroupApi.deleteDataSet(groupId, datasetId)
      loadDatasets()
      loadGroup()
    } catch (err: any) {
      setError(err.response?.data?.detail || '删除失败')
    }
  }

  // 打开用例编辑抽屉
  const handleOpenTestCaseDrawer = async (tc: TestCase) => {
    try {
      const detail = await testCaseApi.get(tc.id)
      
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
      
      // 加载数据集（用于字段映射选择）
      const [groupDataSets, globalDataSets] = await Promise.all([
        apiGroupApi.getDataSets(groupId, 1, 100).then(r => r.items),
        testDataSetApi.list()
      ])
      setAvailableDataSets({ group: groupDataSets, global: globalDataSets })
      
      setShowTestCaseDrawer(true)
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
        sourceFields = responseParams.map((p: APIParam) => p.path)
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
        const targetField = targetParam.path
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

  // 获取数据集字段列表（根据数据集ID）
  const getDataSetFields = (dataSetId?: number): string[] => {
    if (!dataSetId) return []
    
    // 查找分组数据集
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
    
    // 查找全局数据集
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

  // 保存用例
  const handleSaveTestCase = async () => {
    if (!editingTestCase) return
    setTestCaseSaving(true)
    try {
      // 从字段映射中提取数据集ID（如果有数据集类型的映射，使用第一个数据集ID）
      let dataSetId: number | undefined = undefined
      for (const api of editingTestCase.apis) {
        if (api.enhanced_field_mappings) {
          for (const mapping of api.enhanced_field_mappings) {
            if (mapping.source_type === 'data_set' && mapping.source_api_id) {
              // source_api_id在数据集类型时存储的是数据集ID
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
      setShowTestCaseDrawer(false)
      loadTestCases()
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存失败')
    } finally {
      setTestCaseSaving(false)
    }
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: '#28a745',
      POST: '#007bff',
      PUT: '#ffc107',
      DELETE: '#dc3545',
      PATCH: '#17a2b8',
    }
    return colors[method.toUpperCase()] || '#6c757d'
  }

  if (loading) {
    return <Loading text="加载分组信息..." />
  }

  if (!group) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>分组不存在</h3>
        <button
          onClick={() => navigate('/api-groups')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px',
          }}
        >
          返回分组列表
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 头部 */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/api-groups')}
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
          ← 返回分组列表
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1a1a2e' }}>{group.name}</h2>
            {group.description && (
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{group.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              📤 接口上传
            </button>
            <div style={{ display: 'flex', gap: '20px', marginLeft: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                  {group.api_count || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>接口</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                  {group.test_case_count || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>用例</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError('')} />}

      {/* Tab 切换 */}
      <div style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '24px' }}>
        {(['apis', 'test-cases', 'datasets'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setError('')
              setActiveTab(tab)
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#007bff' : '#666',
              borderBottom: activeTab === tab ? '2px solid #007bff' : 'none',
              marginBottom: '-2px',
            }}
          >
            {tab === 'apis' && `接口 (${group.api_count || 0})`}
            {tab === 'test-cases' && `用例 (${group.test_case_count || 0})`}
            {tab === 'datasets' && `数据集 (${datasetsTotal})`}
          </button>
        ))}
      </div>

      {/* APIs Tab */}
      {activeTab === 'apis' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="搜索接口路径或摘要..."
              value={apiSearch}
              onChange={(e) => setApiSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchApis()}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <select
              value={apiMethod}
              onChange={(e) => {
                setApiMethod(e.target.value)
                setApisPage(1)
              }}
              style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="">全部方法</option>
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={handleSearchApis}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              搜索
            </button>
          </div>

          {apisLoading ? (
            <Loading text="加载接口列表..." />
          ) : apis.length === 0 ? (
            <EmptyState
              title="暂无接口"
              description="该分组下还没有API接口，点击上方按钮上传"
              actionLabel="上传接口"
              onAction={() => setShowUploadModal(true)}
            />
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '14px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>方法</th>
                    <th style={{ padding: '14px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>路径</th>
                    <th style={{ padding: '14px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>摘要</th>
                    <th style={{ padding: '14px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>标签</th>
                    <th style={{ padding: '14px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>关联用例</th>
                    <th style={{ padding: '14px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>状态</th>
                    <th style={{ padding: '14px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontSize: '14px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {apis.map((api) => (
                    <>
                      <tr
                        key={api.id}
                        style={{ borderBottom: '1px solid #dee2e6', cursor: 'pointer' }}
                        onClick={() => handleOpenApiDetail(api)}
                      >
                        <td style={{ padding: '14px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              backgroundColor: getMethodColor(api.method),
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                            }}
                          >
                            {api.method}
                          </span>
                        </td>
                        <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '13px' }}>{api.path}</td>
                        <td style={{ padding: '14px', color: '#666', fontSize: '14px' }}>{api.summary || '-'}</td>
                        <td style={{ padding: '14px' }}>
                          {api.tags && api.tags.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {api.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    padding: '2px 8px',
                                    backgroundColor: '#e7f1ff',
                                    color: '#007bff',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              loadApiRelatedCases(api.id)
                            }}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#f0f0f0',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            {apiRelatedCases[api.id]?.length ?? '查看'}
                          </button>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              backgroundColor: api.is_available ? '#d4edda' : '#f8d7da',
                              color: api.is_available ? '#155724' : '#721c24',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {api.is_available ? '可用' : '不可用'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenApiDetail(api)
                            }}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#f0f0f0',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                            }}
                          >
                            编辑
                          </button>
                        </td>
                      </tr>
                      {expandedApiCases === api.id && apiRelatedCases[api.id] && (
                        <tr key={`${api.id}-cases`}>
                          <td colSpan={7} style={{ padding: '0 14px 14px 14px', backgroundColor: '#f8f9fa' }}>
                            <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>关联用例:</div>
                              {apiRelatedCases[api.id].length === 0 ? (
                                <div style={{ color: '#999', fontSize: '13px' }}>暂无关联用例</div>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {apiRelatedCases[api.id].map((tc) => (
                                    <span
                                      key={tc.id}
                                      onClick={() => navigate(`/test-cases/${tc.id}/visual`, { 
                                        state: { 
                                          returnPath: `/api-groups/${groupId}`,
                                          returnTab: 'test-cases'
                                        } 
                                      })}
                                      style={{
                                        padding: '4px 12px',
                                        backgroundColor: '#e7f1ff',
                                        color: '#007bff',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {tc.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>

              {apisPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => setApisPage((p) => Math.max(1, p - 1))}
                    disabled={apisPage === 1}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: apisPage === 1 ? '#f0f0f0' : '#007bff',
                      color: apisPage === 1 ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: apisPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    上一页
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: '14px' }}>
                    {apisPage} / {apisPages} (共 {apisTotal} 条)
                  </span>
                  <button
                    onClick={() => setApisPage((p) => Math.min(apisPages, p + 1))}
                    disabled={apisPage === apisPages}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: apisPage === apisPages ? '#f0f0f0' : '#007bff',
                      color: apisPage === apisPages ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: apisPage === apisPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Test Cases Tab */}
      {activeTab === 'test-cases' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="搜索用例名称或描述..."
              value={testCaseSearch}
              onChange={(e) => setTestCaseSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchTestCases()}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <button
              onClick={handleSearchTestCases}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              搜索
            </button>
            <button
              onClick={() => navigate(`/api-groups/${groupId}/test-cases/create`)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ➕ 新增用例
            </button>
          </div>

          {testCasesLoading ? (
            <Loading text="加载用例列表..." />
          ) : testCases.length === 0 ? (
            <EmptyState
              title="暂无用例"
              description="该分组下还没有测试用例"
              actionLabel="创建用例"
              onAction={() => navigate(`/api-groups/${groupId}/test-cases/create`)}
            />
          ) : (
            <>
              <div style={{ display: 'grid', gap: '12px' }}>
                {testCases.map((tc) => (
                  <div
                    key={tc.id}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{tc.name}</h4>
                      {tc.description && (
                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{tc.description}</p>
                      )}
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                        创建于 {new Date(tc.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => navigate(`/test-cases/${tc.id}/visual`, { 
                          state: { 
                            returnPath: `/api-groups/${groupId}`,
                            returnTab: 'test-cases'
                          } 
                        })}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        可视化
                      </button>
                      <button
                        onClick={() => handleOpenTestCaseDrawer(tc)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {testCasesPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    onClick={() => setTestCasesPage((p) => Math.max(1, p - 1))}
                    disabled={testCasesPage === 1}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: testCasesPage === 1 ? '#f0f0f0' : '#007bff',
                      color: testCasesPage === 1 ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: testCasesPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    上一页
                  </button>
                  <span style={{ padding: '8px 16px', fontSize: '14px' }}>
                    {testCasesPage} / {testCasesPages} (共 {testCasesTotal} 条)
                  </span>
                  <button
                    onClick={() => setTestCasesPage((p) => Math.min(testCasesPages, p + 1))}
                    disabled={testCasesPage === testCasesPages}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: testCasesPage === testCasesPages ? '#f0f0f0' : '#007bff',
                      color: testCasesPage === testCasesPages ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: testCasesPage === testCasesPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Datasets Tab */}
      {activeTab === 'datasets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button
              onClick={() => handleOpenDatasetModal()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              ➕ 新增数据集
            </button>
          </div>

          {datasetsLoading ? (
            <Loading text="加载数据集..." />
          ) : datasets.length === 0 ? (
            <EmptyState
              title="暂无数据集"
              description="该分组下还没有数据集"
              actionLabel="新增数据集"
              onAction={() => handleOpenDatasetModal()}
            />
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{ds.name}</h4>
                      {ds.description && (
                        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>{ds.description}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleOpenDatasetModal(ds)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f0f0f0',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteDataset(ds.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {/* 显示数据字段 */}
                  {ds.data && Object.keys(ds.data).length > 0 && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>数据字段:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {Object.entries(ds.data).slice(0, 10).map(([key, value]) => (
                          <span
                            key={key}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: 'white',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            <strong>{key}</strong>: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        ))}
                        {Object.keys(ds.data).length > 10 && (
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            +{Object.keys(ds.data).length - 10} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 上传弹窗 */}
      {showUploadModal && (
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
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '700px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>接口上传</h3>
            </div>
            
            <div style={{ borderBottom: '1px solid #e0e0e0' }}>
              {(['file', 'manual'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setUploadTab(tab)}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: uploadTab === tab ? 600 : 400,
                    color: uploadTab === tab ? '#007bff' : '#666',
                    borderBottom: uploadTab === tab ? '2px solid #007bff' : 'none',
                    marginBottom: '-1px',
                  }}
                >
                  {tab === 'file' ? '📄 文件上传' : '✍️ 手动添加'}
                </button>
              ))}
            </div>

            <div style={{ padding: '24px' }}>
              {uploadTab === 'file' ? (
                <div>
                  <div
                    style={{
                      border: '2px dashed #ddd',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type="file"
                      accept=".json,.yaml,.yml"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                      <div style={{ color: '#666', marginBottom: '8px' }}>
                        {uploadFile ? uploadFile.name : '点击选择或拖拽文件'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        支持 OpenAPI/Swagger 格式 (.json, .yaml, .yml)
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select
                      value={manualApiMethod}
                      onChange={(e) => setManualApiMethod(e.target.value)}
                      style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '120px' }}
                    >
                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="接口路径，如 /api/users"
                      value={manualApiPath}
                      onChange={(e) => setManualApiPath(e.target.value)}
                      style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="接口摘要"
                    value={manualApiSummary}
                    onChange={(e) => setManualApiSummary(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    placeholder="标签（用逗号分隔，如：token,auth）"
                    value={manualApiTags}
                    onChange={(e) => setManualApiTags(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  
                  {/* 请求参数 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontWeight: 600, fontSize: '14px' }}>请求参数</label>
                      <button
                        type="button"
                        onClick={() => setManualReqParams([...manualReqParams, { name: '', path: '', type: 'string', required: false }])}
                        style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        + 添加
                      </button>
                    </div>
                    {manualReqParams.map((param, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          placeholder="参数名"
                          value={param.name}
                          onChange={(e) => {
                            const updated = [...manualReqParams]
                            updated[i] = { ...updated[i], name: e.target.value, path: `body.${e.target.value}` }
                            setManualReqParams(updated)
                          }}
                          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        />
                        <select
                          value={param.type}
                          onChange={(e) => {
                            const updated = [...manualReqParams]
                            updated[i] = { ...updated[i], type: e.target.value }
                            setManualReqParams(updated)
                          }}
                          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        >
                          <option value="string">string</option>
                          <option value="integer">integer</option>
                          <option value="boolean">boolean</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={param.required}
                            onChange={(e) => {
                              const updated = [...manualReqParams]
                              updated[i] = { ...updated[i], required: e.target.checked }
                              setManualReqParams(updated)
                            }}
                          />
                          必填
                        </label>
                        <button
                          onClick={() => setManualReqParams(manualReqParams.filter((_, idx) => idx !== i))}
                          style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 响应参数 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontWeight: 600, fontSize: '14px' }}>响应参数</label>
                      <button
                        type="button"
                        onClick={() => setManualResParams([...manualResParams, { name: '', path: '', type: 'string', required: false }])}
                        style={{ padding: '4px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        + 添加
                      </button>
                    </div>
                    {manualResParams.map((param, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          placeholder="参数名"
                          value={param.name}
                          onChange={(e) => {
                            const updated = [...manualResParams]
                            updated[i] = { ...updated[i], name: e.target.value, path: `response.${e.target.value}` }
                            setManualResParams(updated)
                          }}
                          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        />
                        <select
                          value={param.type}
                          onChange={(e) => {
                            const updated = [...manualResParams]
                            updated[i] = { ...updated[i], type: e.target.value }
                            setManualResParams(updated)
                          }}
                          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                        >
                          <option value="string">string</option>
                          <option value="integer">integer</option>
                          <option value="boolean">boolean</option>
                          <option value="object">object</option>
                          <option value="array">array</option>
                        </select>
                        <button
                          onClick={() => setManualResParams(manualResParams.filter((_, idx) => idx !== i))}
                          style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  resetManualForm()
                }}
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
                onClick={uploadTab === 'file' ? handleUploadFile : handleManualAdd}
                disabled={uploading || (uploadTab === 'file' && !uploadFile)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? '处理中...' : (uploadTab === 'file' ? '上传' : '添加')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 数据集弹窗 - 改为键值对形式 */}
      {showDataSetModal && (
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
          onClick={() => setShowDataSetModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '600px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>
                {editingDataset ? '编辑数据集' : '新增数据集'}
              </h3>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  名称 *
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="数据集名称"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>
                  描述
                </label>
                <input
                  type="text"
                  value={datasetDescription}
                  onChange={(e) => setDatasetDescription(e.target.value)}
                  placeholder="数据集描述"
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              
              {/* 键值对形式的数据字段 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>数据字段</label>
                  <button
                    type="button"
                    onClick={handleAddDataField}
                    style={{ padding: '6px 14px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    + 添加字段
                  </button>
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {dataFields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="字段名 (Key)"
                        value={field.key}
                        onChange={(e) => handleUpdateDataField(index, 'key', e.target.value)}
                        style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                      />
                      <input
                        type="text"
                        placeholder="字段值 (Value)"
                        value={field.value}
                        onChange={(e) => handleUpdateDataField(index, 'value', e.target.value)}
                        style={{ flex: 2, padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                      />
                      <button
                        onClick={() => handleDeleteDataField(index)}
                        disabled={dataFields.length <= 1}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: dataFields.length <= 1 ? '#ccc' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: dataFields.length <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDataSetModal(false)}
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
                onClick={handleSaveDataset}
                disabled={datasetSaving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: datasetSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: datasetSaving ? 0.7 : 1,
                }}
              >
                {datasetSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API详情抽屉 - 支持编辑字段 */}
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
                      backgroundColor: getMethodColor(selectedApi.method),
                      color: 'white',
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

      {/* 用例编辑抽屉 */}
      {showTestCaseDrawer && editingTestCase && (
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
          onClick={() => setShowTestCaseDrawer(false)}
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
                onClick={() => setShowTestCaseDrawer(false)}
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
                  // 获取当前API的请求和响应参数
                  const apiDetail = (api as any).apiDetail
                  const currentApiRequestParams = apiDetail?.parsed_request_params || []
                  
                  // 获取源API的响应参数
                  const getSourceApiResponseParams = (sourceApiId: number) => {
                    const sourceApi = editingTestCase.apis.find(a => a.api_id === sourceApiId)
                    if (!sourceApi) return []
                    const sourceApiDetail = (sourceApi as any).apiDetail
                    return sourceApiDetail?.parsed_response_params || []
                  }
                  
                  return (
                    <div key={api.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600 }}>#{api.order + 1}</span>
                        {apiDetail && (
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {apiDetail.method} {apiDetail.path}
                            {apiDetail.summary && ` - ${apiDetail.summary}`}
                          </span>
                        )}
                      </div>
                    
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>字段映射</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAddTestCaseMapping(apiIndex)}
                            style={{ padding: '4px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            + 添加映射
                          </button>
                        </div>
                      </div>
                      
                      {(!api.enhanced_field_mappings || api.enhanced_field_mappings.length === 0) ? (
                        <div style={{ fontSize: '12px', color: '#999', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          暂无字段映射
                        </div>
                      ) : (() => {
                        // 第一个接口只能选择数据集
                        const isFirstApi = apiIndex === 0
                        
                        // 按 source_type 和 source_api_id 分组
                        const groupedMappings: Record<string, { mappings: Array<{ mapping: FieldMappingItem, index: number }>, sourceType: 'api' | 'data_set', sourceId?: number }> = {}
                        
                        api.enhanced_field_mappings.forEach((mapping, mappingIndex) => {
                          const sourceType = mapping.source_type || 'api'
                          const effectiveSourceType = isFirstApi ? 'data_set' : sourceType
                          // 如果是第一个接口且当前类型不是数据集，自动设置为数据集
                          if (isFirstApi && mapping.source_type !== 'data_set') {
                            handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_type', 'data_set')
                          }
                          
                          const groupKey = `${effectiveSourceType}_${mapping.source_api_id || 'none'}`
                          if (!groupedMappings[groupKey]) {
                            groupedMappings[groupKey] = {
                              mappings: [],
                              sourceType: effectiveSourceType,
                              sourceId: mapping.source_api_id
                            }
                          }
                          groupedMappings[groupKey].mappings.push({ mapping, index: mappingIndex })
                        })
                        
                        return Object.entries(groupedMappings).map(([groupKey, group]) => {
                          const { mappings, sourceType, sourceId } = group
                          const dataSetFields = sourceType === 'data_set' && sourceId 
                            ? getDataSetFields(sourceId) 
                            : []
                          const sourceApiResponseParams = sourceId && sourceType === 'api'
                            ? getSourceApiResponseParams(sourceId)
                            : []
                          
                          
                          return (
                            <div key={groupKey} style={{ padding: '16px', border: '1px solid #d0d0d0', borderRadius: '8px', marginBottom: '12px', backgroundColor: '#f9f9f9' }}>
                              {/* 源选择器头部 */}
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                                {/* 源类型选择 - 第一个接口不显示，固定为数据集 */}
                                {!isFirstApi && (
                                  <select
                                    value={sourceType}
                                    onChange={(e) => {
                                      const newType = e.target.value as 'api' | 'data_set'
                                      // 更新该组所有映射的源类型
                                      mappings.forEach(({ index }) => {
                                        handleUpdateTestCaseMapping(apiIndex, index, 'source_type', newType)
                                        handleUpdateTestCaseMapping(apiIndex, index, 'source_api_id', undefined)
                                      })
                                    }}
                                    style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', width: '100px' }}
                                  >
                                    <option value="api">源API</option>
                                    <option value="data_set">数据集</option>
                                  </select>
                                )}
                                
                                {/* 根据源类型显示不同的选择器 */}
                                {sourceType === 'api' ? (
                                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <select
                                      value={sourceId || ''}
                                      onChange={(e) => {
                                        const newSourceId = e.target.value ? parseInt(e.target.value) : undefined
                                        // 更新该组所有映射的源ID
                                        mappings.forEach(({ index }) => {
                                          handleUpdateTestCaseMapping(apiIndex, index, 'source_api_id', newSourceId)
                                        })
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
                                        return (
                                          <option 
                                            key={srcApi.api_id} 
                                            value={srcApi.api_id}
                                            title={srcApiDetail?.path}
                                          >
                                            {srcApiDetail?.summary || `API #${srcApi.order + 1}`}
                                          </option>
                                        )
                                      })}
                                    </select>
                                    {sourceId && (
                                      <button
                                        onClick={() => handleAutoMatchFields(apiIndex, 'api', sourceId)}
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
                                      value={sourceId || ''}
                                      onChange={(e) => {
                                        const newSourceId = e.target.value ? parseInt(e.target.value) : undefined
                                        // 更新该组所有映射的源ID
                                        mappings.forEach(({ index }) => {
                                          handleUpdateTestCaseMapping(apiIndex, index, 'source_api_id', newSourceId)
                                        })
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
                                    {sourceId && (
                                      <>
                                        <button
                                          onClick={() => handleAutoMatchFields(apiIndex, 'data_set', sourceId)}
                                          style={{ padding: '6px 10px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
                                          title="自动匹配同名字段"
                                        >
                                          🔍 自动匹配
                                        </button>
                                        <button
                                          onClick={() => handleAddTestCaseMappingFromDataSet(apiIndex, sourceId)}
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
                                  onClick={() => {
                                    // 删除该组所有映射
                                    mappings.forEach(({ index }) => {
                                      handleDeleteTestCaseMapping(apiIndex, index)
                                    })
                                  }}
                                  style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                  title="删除该组所有映射"
                                >
                                  × 删除组
                                </button>
                              </div>
                              
                              {/* 该组内的字段映射列表 */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {mappings.map(({ mapping, index: mappingIndex }) => {
                                  return (
                                    <div key={mappingIndex} style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      {/* 源字段选择 */}
                                      {sourceType === 'api' ? (
                                        <select
                                          value={mapping.source_field}
                                          onChange={(e) => handleUpdateTestCaseMapping(apiIndex, mappingIndex, 'source_field', e.target.value)}
                                          style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                                        >
                                          <option value="">选择源API响应字段</option>
                                          {sourceApiResponseParams.map((param: APIParam) => (
                                            <option key={param.path} value={param.path}>
                                              {param.path} ({param.type})
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
                                        {currentApiRequestParams.map((param: APIParam) => (
                                          <option key={param.path} value={param.path}>
                                            {param.path} ({param.type}) {param.required && '*'}
                                          </option>
                                        ))}
                                      </select>
                                      
                                      <button
                                        onClick={() => handleDeleteTestCaseMapping(apiIndex, mappingIndex)}
                                        style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        title="删除此映射"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTestCaseDrawer(false)}
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
    </div>
  )
}
