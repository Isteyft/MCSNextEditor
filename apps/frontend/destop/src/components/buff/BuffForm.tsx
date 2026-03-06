import { convertFileSrc } from '@tauri-apps/api/core'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { BuffEntry } from '../../types'

type EnumOption = { id: number; name: string }

type BuffFormProps = {
    values: BuffEntry | null
    buffIconDir: string
    onChange: (patch: Partial<BuffEntry>) => void
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
    buffTypeOptions: EnumOption[]
    buffTriggerOptions: EnumOption[]
    buffRemoveTriggerOptions: EnumOption[]
    buffOverlayTypeOptions: EnumOption[]
}

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

export function BuffForm({
    values,
    buffIconDir,
    onChange,
    onOpenSeidEditor,
    seidDisplayRows,
    buffTypeOptions,
    buffTriggerOptions,
    buffRemoveTriggerOptions,
    buffOverlayTypeOptions,
}: BuffFormProps) {
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        setImgError(false)
    }, [values?.buffid, values?.BuffIcon, buffIconDir])

    const iconFileName = useMemo(() => {
        if (!values) return ''
        return values.BuffIcon === 0 ? `${values.buffid}.png` : `${values.BuffIcon}.png`
    }, [values])

    const iconSrc = useMemo(() => {
        if (!values || !buffIconDir || !iconFileName) return ''
        const normalized = buffIconDir.replace(/\\/g, '/')
        return convertFileSrc(`${normalized}/${iconFileName}`)
    }, [values, buffIconDir, iconFileName])

    const buffTypeSelectOptions = useMemo(() => {
        if (!values) return []
        const exists = buffTypeOptions.some(item => item.id === values.bufftype)
        return exists ? buffTypeOptions : [{ id: values.bufftype, name: '未定义' }, ...buffTypeOptions]
    }, [values, buffTypeOptions])

    const triggerSelectOptions = useMemo(() => {
        if (!values) return []
        const exists = buffTriggerOptions.some(item => item.id === values.trigger)
        return exists ? buffTriggerOptions : [{ id: values.trigger, name: '未定义' }, ...buffTriggerOptions]
    }, [values, buffTriggerOptions])

    const removeTriggerSelectOptions = useMemo(() => {
        if (!values) return []
        const exists = buffRemoveTriggerOptions.some(item => item.id === values.removeTrigger)
        return exists ? buffRemoveTriggerOptions : [{ id: values.removeTrigger, name: '未定义' }, ...buffRemoveTriggerOptions]
    }, [values, buffRemoveTriggerOptions])

    const overlayTypeSelectOptions = useMemo(() => {
        if (!values) return []
        const exists = buffOverlayTypeOptions.some(item => item.id === values.BuffType)
        return exists ? buffOverlayTypeOptions : [{ id: values.BuffType, name: '未定义' }, ...buffOverlayTypeOptions]
    }, [values, buffOverlayTypeOptions])

    if (!values) return <div className="todo-box">请选择一条 Buff 数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>Buff ID</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ buffid: toSafeNumber(event.target.value) })}
                    value={values.buffid}
                />
            </label>

            <label className="config-field">
                <span>Buff 图标</span>
                <input
                    inputMode="numeric"
                    onChange={event => {
                        setImgError(false)
                        onChange({ BuffIcon: toSafeNumber(event.target.value) })
                    }}
                    value={values.BuffIcon}
                />
            </label>

            <div className="buff-icon-preview">
                <div className="buff-icon-box">
                    {!imgError && iconSrc ? (
                        <img alt={iconFileName} src={iconSrc} onError={() => setImgError(true)} />
                    ) : (
                        <img alt="default icon" src="/0.png" />
                    )}
                </div>
            </div>

            <label className="config-field">
                <span>名称</span>
                <input onChange={event => onChange({ name: event.target.value })} value={values.name} />
            </label>
            <label className="config-field">
                <span>描述</span>
                <textarea className="config-desc-input" onChange={event => onChange({ descr: event.target.value })} value={values.descr} />
            </label>
            <label className="config-field">
                <span>Buff 特效</span>
                <input onChange={event => onChange({ skillEffect: event.target.value })} value={values.skillEffect} />
            </label>
            <label className="config-field">
                <span>Buff 类型</span>
                <select onChange={event => onChange({ bufftype: toSafeNumber(event.target.value) })} value={values.bufftype}>
                    {buffTypeSelectOptions.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.id}.{item.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>触发类型</span>
                <select onChange={event => onChange({ trigger: toSafeNumber(event.target.value) })} value={values.trigger}>
                    {triggerSelectOptions.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.id}.{item.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>移除类型</span>
                <select onChange={event => onChange({ removeTrigger: toSafeNumber(event.target.value) })} value={values.removeTrigger}>
                    {removeTriggerSelectOptions.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.id}.{item.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>叠加类型</span>
                <select onChange={event => onChange({ BuffType: toSafeNumber(event.target.value) })} value={values.BuffType}>
                    {overlayTypeSelectOptions.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.id}.{item.name}
                        </option>
                    ))}
                </select>
            </label>

            <div className="bool-field-row">
                <span>是否隐藏</span>
                <input
                    checked={values.isHide === 1}
                    onChange={event => onChange({ isHide: event.target.checked ? 1 : 0 })}
                    type="checkbox"
                />
            </div>

            <div className="bool-field-row">
                <span>是否只显示1层</span>
                <input
                    checked={values.ShowOnlyOne === 1}
                    onChange={event => onChange({ ShowOnlyOne: event.target.checked ? 1 : 0 })}
                    type="checkbox"
                />
            </div>

            <div className="config-field">
                <span>词缀</span>
                <div className="affix-list">
                    {values.Affix.map((affix, index) => (
                        <div className="affix-row" key={`${affix}-${index}`}>
                            <input
                                inputMode="numeric"
                                onChange={event => {
                                    const next = [...values.Affix]
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ Affix: next })
                                }}
                                value={affix}
                            />
                            <button
                                className="icon-btn"
                                onClick={() => {
                                    const next = values.Affix.filter((_, idx) => idx !== index)
                                    onChange({ Affix: next })
                                }}
                                type="button"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button
                        className="save-btn"
                        onClick={() => {
                            onChange({ Affix: [...values.Affix, 0] })
                        }}
                        type="button"
                    >
                        <Plus size={14} /> 新增词缀
                    </button>
                </div>
            </div>

            <label className="config-field">
                <span>Seid</span>
                <div className="seid-preview-wrap">
                    <div className="seid-preview-table" role="table">
                        {seidDisplayRows.length > 0 ? (
                            seidDisplayRows.map(row => (
                                <div className="seid-preview-row" key={`${row.id}-${row.name}`} role="row">
                                    {row.id}. {row.name || ''}
                                </div>
                            ))
                        ) : (
                            <div className="seid-preview-empty">暂无 Seid</div>
                        )}
                    </div>
                    <div className="seid-preview-actions">
                        <button className="save-btn" onClick={onOpenSeidEditor} type="button">
                            编辑 Seid
                        </button>
                    </div>
                </div>
            </label>
        </div>
    )
}
