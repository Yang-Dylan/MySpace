import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { orchestrationApi, FlowData } from '../api/orchestration'
import { apiDocApi, API } from '../api/apiDoc'

const nodeTypes = {}

export default function OrchestrationEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [flowName, setFlowName] = useState('')
  const [flowDescription, setFlowDescription] = useState('')
  const [apis, setApis] = useState<API[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showApiList, setShowApiList] = useState(false)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 加载API列表
      const apiList = await apiDocApi.listAPIs()
      setApis(apiList)

      // 如果存在flow ID，加载已有流程
      if (id) {
        const flow = await orchestrationApi.getFlow(parseInt(id))
        setFlowName(flow.name)
        setFlowDescription(flow.description || '')
        
        // 恢复节点和连线
        if (flow.flow_data) {
          setNodes(flow.flow_data.nodes.map((n: any) => ({
            ...n,
            position: n.position || { x: 0, y: 0 },
          })))
          setEdges(flow.flow_data.edges || [])
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const handleAddApiNode = (api: API) => {
    const newNode: Node = {
      id: `api-${api.id}-${Date.now()}`,
      type: 'default',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        label: `${api.method} ${api.path}`,
        api: api,
        api_id: api.id,
      },
    }
    setNodes((nds) => [...nds, newNode])
    setShowApiList(false)
  }

  const handleDeleteNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
    }
  }

  const handleSave = async () => {
    if (!flowName.trim()) {
      alert('请输入流程名称')
      return
    }

    try {
      setSaving(true)
      const flowData: FlowData = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type || 'api',
          api_id: n.data?.api_id,
          position: n.position,
          data: n.data || {},
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: e.type,
          data: e.data || {},
        })),
      }

      if (id) {
        await orchestrationApi.updateFlow(parseInt(id), {
          name: flowName,
          description: flowDescription,
          flow_data: flowData,
        })
        alert('保存成功！')
      } else {
        const flow = await orchestrationApi.createFlow({
          name: flowName,
          description: flowDescription,
          flow_data: flowData,
        })
        navigate(`/orchestration/${flow.id}`)
        alert('创建成功！')
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>加载中...</div>
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧工具栏 */}
      <div style={{ width: '300px', borderRight: '1px solid #ddd', padding: '20px', overflowY: 'auto' }}>
        <h2>编排编辑器</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            流程名称
          </label>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="输入流程名称"
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
            value={flowDescription}
            onChange={(e) => setFlowDescription(e.target.value)}
            placeholder="输入流程描述"
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowApiList(!showApiList)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showApiList ? '隐藏API列表' : '添加API节点'}
          </button>
        </div>

        {showApiList && (
          <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
            <h3>API列表</h3>
            {apis.length === 0 ? (
              <p>暂无API</p>
            ) : (
              <div>
                {apis.map((api) => (
                  <div
                    key={api.id}
                    onClick={() => handleAddApiNode(api)}
                    style={{
                      padding: '10px',
                      marginBottom: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: '#f9f9f9',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9e9e9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9f9f9'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{api.method} {api.path}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{api.summary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedNode && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <h3>选中节点</h3>
            <p>{selectedNode.data?.label}</p>
            <button
              onClick={handleDeleteNode}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              删除节点
            </button>
          </div>
        )}

        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              marginBottom: '10px',
            }}
          >
            {saving ? '保存中...' : id ? '保存更改' : '创建流程'}
          </button>
          <button
            onClick={() => navigate('/orchestration')}
            style={{
              width: '100%',
              padding: '10px',
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
      </div>

      {/* 右侧画布 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}


