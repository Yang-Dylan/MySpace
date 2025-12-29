import { useState } from 'react'
import { ExecutionCondition, ExecutionConditionItem, ConditionOperator } from '../api/testCase'

interface Props {
  condition?: ExecutionCondition
  availableApis: Array<{ id: number; order: number; method: string; path: string }>
  onChange: (condition: ExecutionCondition | undefined) => void
}

const OPERATORS: { value: ConditionOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: '等于', needsValue: true },
  { value: 'not_equals', label: '不等于', needsValue: true },
  { value: 'contains', label: '包含', needsValue: true },
  { value: 'not_contains', label: '不包含', needsValue: true },
  { value: 'gt', label: '大于', needsValue: true },
  { value: 'gte', label: '大于等于', needsValue: true },
  { value: 'lt', label: '小于', needsValue: true },
  { value: 'lte', label: '小于等于', needsValue: true },
  { value: 'exists', label: '存在', needsValue: false },
  { value: 'not_exists', label: '不存在', needsValue: false },
  { value: 'is_empty', label: '为空', needsValue: false },
  { value: 'not_empty', label: '不为空', needsValue: false },
]

export default function ConditionEditor({ condition, availableApis, onChange }: Props) {
  const [enabled, setEnabled] = useState(condition?.enabled || false)
  const [conditions, setConditions] = useState<ExecutionConditionItem[]>(condition?.conditions || [])
  const [logic, setLogic] = useState<'AND' | 'OR'>(condition?.logic || 'AND')
  const [onFail, setOnFail] = useState<'skip' | 'fail' | 'continue'>(condition?.on_fail || 'skip')

  const updateCondition = (
    newEnabled: boolean,
    newConditions: ExecutionConditionItem[],
    newLogic: 'AND' | 'OR',
    newOnFail: 'skip' | 'fail' | 'continue'
  ) => {
    if (!newEnabled || newConditions.length === 0) {
      onChange(undefined)
    } else {
      onChange({
        enabled: newEnabled,
        conditions: newConditions,
        logic: newLogic,
        on_fail: newOnFail,
      })
    }
  }

  const handleToggleEnabled = () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    updateCondition(newEnabled, conditions, logic, onFail)
  }

  const handleAddCondition = () => {
    if (availableApis.length === 0) return
    
    const newCondition: ExecutionConditionItem = {
      source_api_id: availableApis[0].id,
      field_path: '',
      operator: 'equals',
      value: '',
    }
    const newConditions = [...conditions, newCondition]
    setConditions(newConditions)
    updateCondition(enabled, newConditions, logic, onFail)
  }

  const handleUpdateConditionItem = (index: number, updates: Partial<ExecutionConditionItem>) => {
    const newConditions = conditions.map((c, i) => (i === index ? { ...c, ...updates } : c))
    setConditions(newConditions)
    updateCondition(enabled, newConditions, logic, onFail)
  }

  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
    updateCondition(enabled, newConditions, logic, onFail)
  }

  const handleLogicChange = (newLogic: 'AND' | 'OR') => {
    setLogic(newLogic)
    updateCondition(enabled, conditions, newLogic, onFail)
  }

  const handleOnFailChange = (newOnFail: 'skip' | 'fail' | 'continue') => {
    setOnFail(newOnFail)
    updateCondition(enabled, conditions, logic, newOnFail)
  }

  return (
    <div
      style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      {/* 启用开关 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggleEnabled}
            style={{ width: '18px', height: '18px' }}
          />
          <span style={{ fontWeight: 'bold' }}>启用条件执行</span>
        </label>
        {enabled && (
          <span style={{ color: '#666', fontSize: '13px' }}>
            仅当条件满足时才执行此API
          </span>
        )}
      </div>

      {enabled && (
        <>
          {/* 条件列表 */}
          {conditions.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              {conditions.map((cond, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* 条件序号和逻辑 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {index > 0 && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: logic === 'AND' ? '#cce5ff' : '#d4edda',
                          color: logic === 'AND' ? '#004085' : '#155724',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      >
                        {logic}
                      </span>
                    )}
                    <span style={{ color: '#999', fontSize: '12px' }}>条件 {index + 1}</span>
                  </div>

                  {/* 源API选择 */}
                  <select
                    value={cond.source_api_id}
                    onChange={(e) =>
                      handleUpdateConditionItem(index, { source_api_id: parseInt(e.target.value) })
                    }
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    {availableApis.map((api) => (
                      <option key={api.id} value={api.id}>
                        #{api.order + 1} {api.method} {api.path.substring(0, 30)}
                        {api.path.length > 30 ? '...' : ''}
                      </option>
                    ))}
                  </select>

                  {/* 字段路径 */}
                  <input
                    type="text"
                    value={cond.field_path}
                    onChange={(e) => handleUpdateConditionItem(index, { field_path: e.target.value })}
                    placeholder="如: data.status"
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      width: '150px',
                    }}
                  />

                  {/* 运算符 */}
                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleUpdateConditionItem(index, { operator: e.target.value as ConditionOperator })
                    }
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* 期望值 */}
                  {OPERATORS.find((op) => op.value === cond.operator)?.needsValue && (
                    <input
                      type="text"
                      value={cond.value || ''}
                      onChange={(e) => handleUpdateConditionItem(index, { value: e.target.value })}
                      placeholder="期望值"
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        width: '120px',
                      }}
                    />
                  )}

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleRemoveCondition(index)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#fff0f0',
                      color: '#dc3545',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 添加条件按钮 */}
          <button
            onClick={handleAddCondition}
            disabled={availableApis.length === 0}
            style={{
              padding: '8px 15px',
              backgroundColor: availableApis.length === 0 ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: availableApis.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              marginBottom: '15px',
            }}
          >
            + 添加条件
          </button>

          {availableApis.length === 0 && (
            <p style={{ color: '#999', fontSize: '12px', margin: '0 0 15px 0' }}>
              提示：需要先添加前置API才能配置条件
            </p>
          )}

          {/* 逻辑和失败策略 */}
          {conditions.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '20px',
                paddingTop: '15px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                  条件逻辑
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={logic === 'AND'}
                      onChange={() => handleLogicChange('AND')}
                    />
                    <span>全部满足 (AND)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={logic === 'OR'}
                      onChange={() => handleLogicChange('OR')}
                    />
                    <span>任一满足 (OR)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {conditions.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>
                条件不满足时
              </label>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={onFail === 'skip'}
                    onChange={() => handleOnFailChange('skip')}
                  />
                  <span>跳过此API及后续</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={onFail === 'fail'}
                    onChange={() => handleOnFailChange('fail')}
                  />
                  <span>标记用例失败</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={onFail === 'continue'}
                    onChange={() => handleOnFailChange('continue')}
                  />
                  <span>忽略继续执行</span>
                </label>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

