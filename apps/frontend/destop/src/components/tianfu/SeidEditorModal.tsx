import { Check, ChevronDown, ChevronUp, Minus, PenLine, Plus, Search, X } from 'lucide-react'
import { useState } from 'react'

import { SeidMetaItem } from './SeidPickerModal'

type DrawerOption = {
    id: number
    name: string
}

type DrawerState = {
    seidId: number
    propertyId: string
    drawerType: string
    title: string
    multiple: boolean
}

type SeidEditorModalProps = {
    open: boolean
    seidIds: number[]
    activeSeidId: number | null
    seidData: Record<string, Record<string, string | number | number[]>>
    metaMap: Record<number, SeidMetaItem>
    drawerOptionsMap: Record<string, DrawerOption[]>
    onClose: () => void
    onSelectSeid: (id: number) => void
    onRequestAdd: () => void
    onDeleteSelected: () => void
    onMoveUp: () => void
    onMoveDown: () => void
    onChangeProperty: (seidId: number, key: string, value: string | number | number[]) => void
}

function toArrayText(value: string | number | number[] | undefined) {
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'number') return String(value)
    return value ?? ''
}

function normalizeToNumberArray(value: string | number | number[] | undefined) {
    if (Array.isArray(value)) return value.map(item => Number(item)).filter(item => Number.isFinite(item))
    if (typeof value === 'number') return Number.isFinite(value) ? [value] : []
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(item => Number(item.trim()))
            .filter(item => Number.isFinite(item))
    }
    return []
}

function normalizeToNumber(value: string | number | number[] | undefined) {
    if (Array.isArray(value)) return Number(value[0] ?? 0)
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (typeof value === 'string') {
        const num = Number(value.trim())
        return Number.isFinite(num) ? num : 0
    }
    return 0
}

function isArrayDrawer(drawerType: string) {
    return drawerType.toLowerCase().includes('array')
}

function includesText(...fields: Array<string | number | undefined>) {
    return fields
        .map(item => String(item ?? '').toLowerCase())
        .join(' ')
        .trim()
}

function getDefaultByType(type: string) {
    const lower = type.toLowerCase()
    if (lower === 'int' || lower === 'float' || lower === 'number') return 0
    if (lower === 'intarray') return [] as number[]
    return ''
}

export function SeidEditorModal({
    open,
    seidIds,
    activeSeidId,
    seidData,
    metaMap,
    drawerOptionsMap,
    onClose,
    onSelectSeid,
    onRequestAdd,
    onDeleteSelected,
    onMoveUp,
    onMoveDown,
    onChangeProperty,
}: SeidEditorModalProps) {
    const [drawerState, setDrawerState] = useState<DrawerState | null>(null)
    const [drawerSelected, setDrawerSelected] = useState<number[]>([])
    const [seidSearchDraft, setSeidSearchDraft] = useState('')
    const [seidSearchText, setSeidSearchText] = useState('')
    const [drawerSearchDraft, setDrawerSearchDraft] = useState('')
    const [drawerSearchText, setDrawerSearchText] = useState('')

    const hasActive = activeSeidId !== null
    const meta = hasActive ? metaMap[activeSeidId] : undefined
    const values = hasActive ? (seidData[String(activeSeidId)] ?? {}) : {}
    const seidKeyword = seidSearchText.trim().toLowerCase()
    const filteredSeidIds = seidIds.filter(id => {
        if (!seidKeyword) return true
        const item = metaMap[id]
        return includesText(id, item?.name, item?.desc).includes(seidKeyword)
    })

    const activeDrawerOptions = drawerState ? (drawerOptionsMap[drawerState.drawerType] ?? []) : []
    const drawerKeyword = drawerSearchText.trim().toLowerCase()
    const filteredDrawerOptions = !drawerKeyword
        ? activeDrawerOptions
        : activeDrawerOptions.filter(item => includesText(item.id, item.name).includes(drawerKeyword))

    if (!open) return null

    function openDrawer(
        seidId: number,
        propertyId: string,
        drawerType: string,
        title: string,
        currentValue: string | number | number[] | undefined
    ) {
        const multiple = isArrayDrawer(drawerType)
        setDrawerState({ seidId, propertyId, drawerType, title, multiple })
        setDrawerSelected(multiple ? normalizeToNumberArray(currentValue) : [normalizeToNumber(currentValue)])
        setDrawerSearchDraft('')
        setDrawerSearchText('')
    }

    function closeDrawer() {
        setDrawerState(null)
        setDrawerSelected([])
        setDrawerSearchDraft('')
        setDrawerSearchText('')
    }

    function applyDrawerSelection() {
        if (!drawerState) return
        const value = drawerState.multiple ? drawerSelected : Number(drawerSelected[0] ?? 0)
        onChangeProperty(drawerState.seidId, drawerState.propertyId, value)
        closeDrawer()
    }

    return (
        <div className="modal-mask" onClick={onClose}>
            <div className="create-modal seid-editor-modal" onClick={event => event.stopPropagation()}>
                <div className="create-modal-head">
                    <strong>Seid 编辑</strong>
                    <button className="modal-close" onClick={onClose} type="button">
                        <X size={14} />
                    </button>
                </div>

                <div className="seid-editor-layout">
                    <section className="seid-left">
                        <div className="seid-left-tools">
                            <button className="icon-btn" onClick={onRequestAdd} title="新增 Seid" type="button">
                                <Plus size={14} />
                            </button>
                            <button className="icon-btn" onClick={onDeleteSelected} title="删除当前 Seid" type="button">
                                <Minus size={14} />
                            </button>
                            <button className="icon-btn" onClick={onMoveUp} title="上移" type="button">
                                <ChevronUp size={14} />
                            </button>
                            <button className="icon-btn" onClick={onMoveDown} title="下移" type="button">
                                <ChevronDown size={14} />
                            </button>
                        </div>
                        <div className="search-input-wrap">
                            <input
                                className="modal-search-input"
                                onChange={event => setSeidSearchDraft(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') setSeidSearchText(seidSearchDraft)
                                }}
                                placeholder="搜索 Seid id/name/desc"
                                value={seidSearchDraft}
                            />
                            <button
                                className="search-action-btn"
                                onClick={() => setSeidSearchText(seidSearchDraft)}
                                title="搜索"
                                type="button"
                            >
                                <Search size={14} />
                            </button>
                        </div>
                        <div className="seid-list">
                            {filteredSeidIds.map(id => {
                                const item = metaMap[id]
                                const text = `${id} ${item?.name ?? ''}`
                                return (
                                    <button
                                        className={`seid-list-item ${activeSeidId === id ? 'active' : ''}`}
                                        key={id}
                                        onClick={() => onSelectSeid(id)}
                                        type="button"
                                    >
                                        {text}
                                    </button>
                                )
                            })}
                            {filteredSeidIds.length === 0 ? <div className="todo-box">没有匹配的 Seid</div> : null}
                        </div>
                    </section>

                    <section className="seid-right">
                        {meta && hasActive ? (
                            <div className="config-form-wrap">
                                <div className="seid-meta-title">{meta.name}</div>
                                <div className="muted">{meta.desc || '-'}</div>
                                {meta.properties.length === 0 ? (
                                    <div className="todo-box">该 Seid 没有可编辑属性</div>
                                ) : (
                                    meta.properties.map(property => {
                                        const type = (property.Type || '').toLowerCase()
                                        const value = values[property.ID] ?? getDefaultByType(type)
                                        const specialDrawer = property.SpecialDrawer?.[0]

                                        const inputNode =
                                            type === 'intarray' ? (
                                                <input
                                                    onChange={event => {
                                                        const list = event.target.value
                                                            .split(',')
                                                            .map(item => Number(item.trim()))
                                                            .filter(item => Number.isFinite(item))
                                                        onChangeProperty(activeSeidId, property.ID, list)
                                                    }}
                                                    placeholder="例如: 1,2,3"
                                                    value={toArrayText(value)}
                                                />
                                            ) : type === 'int' || type === 'float' || type === 'number' ? (
                                                <input
                                                    inputMode="numeric"
                                                    onChange={event => {
                                                        const raw = event.target.value.trim()
                                                        const num = raw === '' ? 0 : Number(raw)
                                                        onChangeProperty(activeSeidId, property.ID, Number.isFinite(num) ? num : 0)
                                                    }}
                                                    value={String(value ?? 0)}
                                                />
                                            ) : (
                                                <input
                                                    onChange={event => onChangeProperty(activeSeidId, property.ID, event.target.value)}
                                                    value={String(value ?? '')}
                                                />
                                            )

                                        return (
                                            <label className="config-field" key={property.ID}>
                                                <span>
                                                    {property.ID} ({property.Type}) - {property.Desc || '-'}
                                                </span>
                                                <div className="drawer-input-row">
                                                    {inputNode}
                                                    {specialDrawer ? (
                                                        <button
                                                            className="icon-btn"
                                                            onClick={() =>
                                                                openDrawer(
                                                                    activeSeidId,
                                                                    property.ID,
                                                                    specialDrawer,
                                                                    `${property.ID} - ${property.Desc || specialDrawer}`,
                                                                    value
                                                                )
                                                            }
                                                            title={`打开 ${specialDrawer}`}
                                                            type="button"
                                                        >
                                                            <PenLine size={14} />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </label>
                                        )
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="todo-box">请选择左侧 Seid</div>
                        )}
                    </section>
                </div>
            </div>

            {drawerState ? (
                <div className="modal-mask drawer-mask" onClick={closeDrawer}>
                    <div className="create-modal drawer-modal" onClick={event => event.stopPropagation()}>
                        <div className="create-modal-head">
                            <strong>{drawerState.title}</strong>
                            <button className="modal-close" onClick={closeDrawer} type="button">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="search-input-wrap">
                            <input
                                className="modal-search-input"
                                onChange={event => setDrawerSearchDraft(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') setDrawerSearchText(drawerSearchDraft)
                                }}
                                placeholder="搜索 id/name"
                                value={drawerSearchDraft}
                            />
                            <button
                                className="search-action-btn"
                                onClick={() => setDrawerSearchText(drawerSearchDraft)}
                                title="搜索"
                                type="button"
                            >
                                <Search size={14} />
                            </button>
                        </div>
                        <div className="drawer-list">
                            {filteredDrawerOptions.length === 0 ? <div className="todo-box">当前 Drawer 没有可选数据</div> : null}
                            {filteredDrawerOptions.map(option => {
                                const checked = drawerSelected.includes(option.id)
                                return (
                                    <button
                                        className={`drawer-row ${checked ? 'active' : ''}`}
                                        key={option.id}
                                        onClick={() => {
                                            if (drawerState.multiple) {
                                                setDrawerSelected(prev =>
                                                    prev.includes(option.id)
                                                        ? prev.filter(item => item !== option.id)
                                                        : [...prev, option.id]
                                                )
                                            } else {
                                                setDrawerSelected([option.id])
                                            }
                                        }}
                                        type="button"
                                    >
                                        <span className="drawer-row-main">
                                            {option.id}. {option.name || '-'}
                                        </span>
                                        {checked ? <Check size={14} /> : null}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="drawer-actions">
                            <button className="cancel-btn" onClick={closeDrawer} type="button">
                                取消
                            </button>
                            <button className="save-btn" onClick={applyDrawerSelection} type="button">
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
