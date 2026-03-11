import { PenLine, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { BackpackEntry } from '../../types'

type Option = { id: number; name: string }

type BackpackFormProps = {
    values: BackpackEntry | null
    onChange: (patch: Partial<BackpackEntry>) => void
    npcOptions: Option[]
    itemOptions: Option[]
    itemTypeOptions: Option[]
    itemQualityOptions: Option[]
}

type PickerState = { kind: 'npc'; title: string } | { kind: 'item'; index: number; title: string }

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function withCurrent(options: Option[], current: number) {
    return options.some(item => item.id === current) ? options : [{ id: current, name: `当前值 ${current}` }, ...options]
}

function findOptionLabel(options: Option[], id: number) {
    if (!id) return ''
    const match = options.find(option => option.id === id)
    return match ? `${match.id}. ${match.name || '-'}` : ''
}

export function BackpackForm({ values, onChange, npcOptions, itemOptions, itemTypeOptions, itemQualityOptions }: BackpackFormProps) {
    const [pickerState, setPickerState] = useState<PickerState | null>(null)
    const [searchText, setSearchText] = useState('')
    const current = values
    const sourceOptions = pickerState?.kind === 'npc' ? npcOptions : itemOptions
    const filteredOptions = useMemo(() => {
        const keyword = searchText.trim().toLowerCase()
        if (!keyword) return sourceOptions
        return sourceOptions.filter(option => `${option.id} ${option.name}`.toLowerCase().includes(keyword))
    }, [searchText, sourceOptions])

    if (!current) return <div className="todo-box">请选择一条背包数据</div>
    const entry = current

    const rowCount = Math.max(entry.ItemID.length, entry.randomNum.length)
    const itemRows = Array.from({ length: rowCount }, (_, index) => ({
        itemId: entry.ItemID[index] ?? 0,
        quantity: entry.randomNum[index] ?? 1,
    }))
    function closePicker() {
        setPickerState(null)
        setSearchText('')
    }

    function updateItemRow(index: number, patch: { itemId?: number; quantity?: number }) {
        const size = Math.max(entry.ItemID.length, entry.randomNum.length, index + 1)
        const itemIds = Array.from({ length: size }, (_, currentIndex) => entry.ItemID[currentIndex] ?? 0)
        const quantities = Array.from({ length: size }, (_, currentIndex) => entry.randomNum[currentIndex] ?? 1)
        if (patch.itemId !== undefined) itemIds[index] = patch.itemId
        if (patch.quantity !== undefined) quantities[index] = patch.quantity
        onChange({ ItemID: itemIds, randomNum: quantities })
    }

    function removeItemRow(index: number) {
        onChange({
            ItemID: entry.ItemID.filter((_, currentIndex) => currentIndex !== index),
            randomNum: entry.randomNum.filter((_, currentIndex) => currentIndex !== index),
        })
    }

    function applyOption(optionId: number) {
        if (!pickerState) return
        if (pickerState.kind === 'npc') {
            onChange({ AvatrID: optionId })
        } else {
            updateItemRow(pickerState.index, { itemId: optionId })
        }
        closePicker()
    }

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" value={entry.id} onChange={event => onChange({ id: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>NPC ID</span>
                <div className="affix-row">
                    <input
                        inputMode="numeric"
                        value={entry.AvatrID}
                        onChange={event => onChange({ AvatrID: toSafeNumber(event.target.value) })}
                    />
                    <button
                        className="icon-btn"
                        type="button"
                        title="选择 NPC"
                        onClick={() => setPickerState({ kind: 'npc', title: '选择 NPC' })}
                    >
                        <PenLine size={14} />
                    </button>
                    <span className="drawer-inline-label">{findOptionLabel(npcOptions, entry.AvatrID)}</span>
                </div>
            </label>
            <label className="config-field">
                <span>背包名称</span>
                <input value={entry.BackpackName} onChange={event => onChange({ BackpackName: event.target.value })} />
            </label>
            <label className="config-field">
                <span>物品类型</span>
                <select value={entry.Type} onChange={event => onChange({ Type: toSafeNumber(event.target.value) })}>
                    {withCurrent(itemTypeOptions, entry.Type).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>物品等级</span>
                <select value={entry.quality} onChange={event => onChange({ quality: toSafeNumber(event.target.value) })}>
                    {withCurrent(itemQualityOptions, entry.quality).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <div className="config-field">
                <span>物品列表</span>
                <div className="affix-list">
                    {itemRows.map((row, index) => (
                        <div className="affix-row backpack-item-row" key={`${row.itemId}-${index}`}>
                            <input
                                className="backpack-item-id-input"
                                inputMode="numeric"
                                value={row.itemId}
                                onChange={event => updateItemRow(index, { itemId: toSafeNumber(event.target.value) })}
                            />
                            <button
                                className="icon-btn"
                                type="button"
                                title="选择物品"
                                onClick={() => setPickerState({ kind: 'item', index, title: '选择物品' })}
                            >
                                <PenLine size={14} />
                            </button>
                            <span className="drawer-inline-label">{findOptionLabel(itemOptions, row.itemId)}</span>
                            <div className="backpack-qty-wrap">
                                <input
                                    className="backpack-item-qty-input"
                                    inputMode="numeric"
                                    value={row.quantity}
                                    onChange={event => updateItemRow(index, { quantity: toSafeNumber(event.target.value) })}
                                />
                            </div>
                            <button className="icon-btn" type="button" onClick={() => removeItemRow(index)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        className="save-btn"
                        type="button"
                        onClick={() => onChange({ ItemID: [...entry.ItemID, 0], randomNum: [...entry.randomNum, 1] })}
                    >
                        <Plus size={14} /> 新增物品
                    </button>
                </div>
            </div>
            <div className="bool-field-row">
                <span>是否出售</span>
                <input
                    type="checkbox"
                    checked={entry.CanSell === 1}
                    onChange={event => onChange({ CanSell: event.target.checked ? 1 : 0 })}
                />
            </div>
            <label className="config-field">
                <span>出售价格系数</span>
                <input
                    inputMode="numeric"
                    value={entry.SellPercent}
                    onChange={event => onChange({ SellPercent: toSafeNumber(event.target.value) })}
                />
            </label>
            <div className="bool-field-row">
                <span>是否可掉落</span>
                <input
                    type="checkbox"
                    checked={entry.CanDrop === 1}
                    onChange={event => onChange({ CanDrop: event.target.checked ? 1 : 0 })}
                />
            </div>

            {pickerState ? (
                <div className="modal-mask drawer-mask" onClick={closePicker}>
                    <div className="create-modal drawer-modal" onClick={event => event.stopPropagation()}>
                        <div className="create-modal-head">
                            <strong>{pickerState.title}</strong>
                            <button className="modal-close" onClick={closePicker} type="button">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="search-input-wrap">
                            <input
                                className="modal-search-input"
                                value={searchText}
                                placeholder="搜索 id/name"
                                onChange={event => setSearchText(event.target.value)}
                            />
                        </div>
                        <div className="drawer-list">
                            {filteredOptions.length === 0 ? <div className="todo-box">当前没有可选数据</div> : null}
                            {filteredOptions.map(option => (
                                <button key={option.id} className="drawer-row" type="button" onClick={() => applyOption(option.id)}>
                                    <span className="drawer-row-main">
                                        {option.id}. {option.name || '-'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
