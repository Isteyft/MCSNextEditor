import { convertFileSrc } from '@tauri-apps/api/core'
import { useEffect, useMemo, useState } from 'react'

import type { WuDaoSkillEntry } from '../../types'

type Option = { id: number; name: string }

type WuDaoSkillFormProps = {
    values: WuDaoSkillEntry | null
    skillIconDir: string
    wudaoTypeOptions: Option[]
    onChange: (patch: Partial<WuDaoSkillEntry>) => void
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
}

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

export function WuDaoSkillForm({
    values,
    skillIconDir,
    wudaoTypeOptions,
    onChange,
    onOpenSeidEditor,
    seidDisplayRows,
}: WuDaoSkillFormProps) {
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        setImgError(false)
    }, [values?.id, values?.icon, skillIconDir])

    const iconFileName = useMemo(() => {
        if (!values) return ''
        return `${values.icon || values.id}.png`
    }, [values])

    const iconSrc = useMemo(() => {
        if (!values || !skillIconDir || !iconFileName) return ''
        const normalized = skillIconDir.replace(/\\/g, '/')
        return convertFileSrc(`${normalized}/${iconFileName}`)
    }, [values, skillIconDir, iconFileName])

    if (!values) return <div className="todo-box">请选择一条悟道技能数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" onChange={event => onChange({ id: toSafeNumber(event.target.value) })} value={values.id} />
            </label>
            <label className="config-field">
                <span>图标</span>
                <input onChange={event => onChange({ icon: event.target.value })} value={values.icon} />
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
                <span>名字</span>
                <input onChange={event => onChange({ name: event.target.value })} value={values.name} />
            </label>
            <label className="config-field">
                <span>点数消耗</span>
                <input inputMode="numeric" onChange={event => onChange({ Cast: toSafeNumber(event.target.value) })} value={values.Cast} />
            </label>
            <div className="config-field">
                <span>悟道类型</span>
                <div className="multi-check-list">
                    {wudaoTypeOptions.map(option => {
                        const checked = values.Type.includes(option.id)
                        return (
                            <label className="multi-check-item" key={option.id}>
                                <input
                                    checked={checked}
                                    onChange={event => {
                                        const next = event.target.checked
                                            ? [...values.Type, option.id].filter((id, idx, arr) => arr.indexOf(id) === idx)
                                            : values.Type.filter(id => id !== option.id)
                                        onChange({ Type: next })
                                    }}
                                    type="checkbox"
                                />
                                <span>
                                    {option.id}.{option.name}
                                </span>
                            </label>
                        )
                    })}
                </div>
            </div>
            <label className="config-field">
                <span>等级</span>
                <input inputMode="numeric" onChange={event => onChange({ Lv: toSafeNumber(event.target.value) })} value={values.Lv} />
            </label>
            <label className="config-field">
                <span>介绍</span>
                <textarea className="config-desc-input" onChange={event => onChange({ desc: event.target.value })} value={values.desc} />
            </label>
            <label className="config-field">
                <span>效果</span>
                <textarea
                    className="config-desc-input"
                    onChange={event => onChange({ xiaoguo: event.target.value })}
                    value={values.xiaoguo}
                />
            </label>
            <div className="bool-field-row">
                <span>是否可遗忘</span>
                <input
                    checked={values.CanForget === 1}
                    onChange={event => onChange({ CanForget: event.target.checked ? 1 : 0 })}
                    type="checkbox"
                />
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
