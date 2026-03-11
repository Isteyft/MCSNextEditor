import { PenLine, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { NpcWuDaoEntry } from '../../types'

type Option = { id: number; name: string }
type ExtraValueMapping = { label: string; valueIndex: number }

type NpcWuDaoFormProps = {
    values: NpcWuDaoEntry | null
    onChange: (patch: Partial<NpcWuDaoEntry>) => void
    wudaoSkillOptions: Option[]
    extraValueMappings: ExtraValueMapping[]
    extraValues: Record<string, number>
    onChangeExtraValue: (valueIndex: number, value: number) => void
}

const LEVEL_OPTIONS: Option[] = [
    { id: 0, name: '凡人' },
    { id: 1, name: '炼气前期' },
    { id: 2, name: '炼气中期' },
    { id: 3, name: '炼气后期' },
    { id: 4, name: '筑基前期' },
    { id: 5, name: '筑基中期' },
    { id: 6, name: '筑基后期' },
    { id: 7, name: '金丹前期' },
    { id: 8, name: '金丹中期' },
    { id: 9, name: '金丹后期' },
    { id: 10, name: '元婴前期' },
    { id: 11, name: '元婴中期' },
    { id: 12, name: '元婴后期' },
    { id: 13, name: '化神前期' },
    { id: 14, name: '化神中期' },
    { id: 15, name: '化神后期' },
]

const PROFICIENCY_OPTIONS: Option[] = [
    { id: 0, name: '一窍不通' },
    { id: 1, name: '初窥门径' },
    { id: 2, name: '略有小成' },
    { id: 3, name: '融会贯通' },
    { id: 4, name: '大道已成' },
    { id: 5, name: '道之真境' },
]

const VALUE_FIELDS = [
    { key: 'value1', label: '金' },
    { key: 'value2', label: '木' },
    { key: 'value3', label: '水' },
    { key: 'value4', label: '火' },
    { key: 'value5', label: '土' },
    { key: 'value6', label: '神' },
    { key: 'value7', label: '体' },
    { key: 'value8', label: '剑' },
    { key: 'value9', label: '气' },
    { key: 'value10', label: '阵' },
    { key: 'value11', label: '丹' },
    { key: 'value12', label: '器' },
] as const satisfies Array<{ key: keyof NpcWuDaoEntry; label: string }>

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function parseIdList(input: string) {
    return input
        .split(/[，,\s]+/)
        .map(item => Number(item.trim()))
        .filter(item => Number.isFinite(item) && item > 0)
        .filter((item, index, array) => array.indexOf(item) === index)
}

export function NpcWuDaoForm({
    values,
    onChange,
    wudaoSkillOptions,
    extraValueMappings,
    extraValues,
    onChangeExtraValue,
}: NpcWuDaoFormProps) {
    const [pickerOpen, setPickerOpen] = useState(false)
    const [searchDraft, setSearchDraft] = useState('')
    const [searchText, setSearchText] = useState('')
    const [tempSelectedIds, setTempSelectedIds] = useState<number[]>([])
    const currentIds = values?.wudaoID ?? []

    const pickerKeyword = searchText.trim().toLowerCase()
    const filteredOptions = useMemo(() => {
        if (!pickerKeyword) return wudaoSkillOptions
        return wudaoSkillOptions.filter(option => `${option.id} ${option.name}`.toLowerCase().includes(pickerKeyword))
    }, [pickerKeyword, wudaoSkillOptions])

    const joinedIds = currentIds.join(', ')
    const selectedSummary = currentIds
        .map(id => {
            const match = wudaoSkillOptions.find(option => option.id === id)
            return match ? `${match.id}. ${match.name || '-'}` : String(id)
        })
        .join(' / ')

    useEffect(() => {
        if (!pickerOpen) return
        setTempSelectedIds(currentIds)
    }, [pickerOpen, currentIds])

    if (!values) return <div className="todo-box">请选择一条 NPC 悟道数据</div>
    const currentValues = values

    function openPicker() {
        setTempSelectedIds(currentValues.wudaoID)
        setSearchDraft('')
        setSearchText('')
        setPickerOpen(true)
    }

    function closePicker() {
        setPickerOpen(false)
        setSearchDraft('')
        setSearchText('')
    }

    function togglePickerValue(optionId: number) {
        setTempSelectedIds(prev =>
            prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId].sort((a, b) => a - b)
        )
    }

    function applyPickerSelection() {
        onChange({ wudaoID: tempSelectedIds })
        closePicker()
    }

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input
                    inputMode="numeric"
                    value={currentValues.id}
                    onChange={event => onChange({ id: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>类型</span>
                <input
                    inputMode="numeric"
                    value={currentValues.Type}
                    onChange={event => onChange({ Type: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>境界</span>
                <select value={currentValues.lv} onChange={event => onChange({ lv: toSafeNumber(event.target.value) })}>
                    {LEVEL_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <div className="config-field">
                <span>悟道技能</span>
                <div className="drawer-input-row">
                    <input
                        value={joinedIds}
                        placeholder="多个 ID 用逗号分隔"
                        onChange={event => onChange({ wudaoID: parseIdList(event.target.value) })}
                        onClick={openPicker}
                    />
                    <button className="icon-btn" type="button" title="选择悟道技能" onClick={openPicker}>
                        <PenLine size={14} />
                    </button>
                </div>
                {selectedSummary ? <div className="drawer-inline-label drawer-inline-label-multiline">{selectedSummary}</div> : null}
            </div>
            <div className="config-field">
                <span>熟练度</span>
                <div className="affix-list">
                    {VALUE_FIELDS.map(({ key, label }) => (
                        <label className="config-field" key={key}>
                            <span>{label}</span>
                            <select
                                value={currentValues[key]}
                                onChange={event => onChange({ [key]: toSafeNumber(event.target.value) } as Partial<NpcWuDaoEntry>)}
                            >
                                {PROFICIENCY_OPTIONS.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.id}. {option.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                    {extraValueMappings.map(item => (
                        <label className="config-field" key={`extra-${item.valueIndex}`}>
                            <span>{item.label}</span>
                            <select
                                value={Number(extraValues[String(item.valueIndex)] ?? 0)}
                                onChange={event => onChangeExtraValue(item.valueIndex, toSafeNumber(event.target.value))}
                            >
                                {PROFICIENCY_OPTIONS.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.id}. {option.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                </div>
            </div>
            {pickerOpen ? (
                <div className="modal-mask drawer-mask" onClick={closePicker}>
                    <div className="create-modal drawer-modal" onClick={event => event.stopPropagation()}>
                        <div className="create-modal-head">
                            <strong>选择悟道技能</strong>
                            <button className="modal-close" onClick={closePicker} type="button">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="search-input-wrap">
                            <input
                                className="modal-search-input"
                                value={searchDraft}
                                placeholder="搜索 id/name"
                                onChange={event => setSearchDraft(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') setSearchText(searchDraft)
                                }}
                            />
                            <button className="search-action-btn" type="button" onClick={() => setSearchText(searchDraft)}>
                                <Search size={14} />
                            </button>
                        </div>
                        <div className="drawer-list">
                            {filteredOptions.length === 0 ? <div className="todo-box">当前没有可选数据</div> : null}
                            {filteredOptions.map(option => {
                                const active = tempSelectedIds.includes(option.id)
                                return (
                                    <button
                                        key={option.id}
                                        className={`drawer-row${active ? ' active' : ''}`}
                                        type="button"
                                        onClick={() => togglePickerValue(option.id)}
                                    >
                                        <span className="drawer-row-main">
                                            {option.id}. {option.name || '-'}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        <div className="drawer-actions">
                            <button className="icon-btn" type="button" onClick={closePicker}>
                                取消
                            </button>
                            <button className="save-btn" type="button" onClick={applyPickerSelection}>
                                确认选择
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
