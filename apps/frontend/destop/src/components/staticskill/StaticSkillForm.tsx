import { convertFileSrc } from '@tauri-apps/api/core'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { StaticSkillEntry } from '../../types'

type Option = { id: number; name: string }

type StaticSkillFormProps = {
    values: StaticSkillEntry | null
    skillIconDir: string
    attackTypeOptions: Option[]
    skillConsultTypeOptions: Option[]
    skillPhaseOptions: Option[]
    skillQualityOptions: Option[]
    onChange: (patch: Partial<StaticSkillEntry>) => void
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
    affixOptions: Option[]
}

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function withCurrent(options: Option[], current: number) {
    return options.some(item => item.id === current) ? options : [{ id: current, name: '未定义' }, ...options]
}

export function StaticSkillForm({
    values,
    skillIconDir,
    attackTypeOptions,
    skillConsultTypeOptions,
    skillPhaseOptions,
    skillQualityOptions,
    onChange,
    onOpenSeidEditor,
    seidDisplayRows,
    affixOptions,
}: StaticSkillFormProps) {
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        setImgError(false)
    }, [values?.Skill_ID, values?.icon, skillIconDir])

    const iconFileName = useMemo(() => {
        if (!values) return ''
        return values.icon === 0 ? `${values.Skill_ID}.png` : `${values.icon}.png`
    }, [values])

    const iconSrc = useMemo(() => {
        if (!values || !skillIconDir || !iconFileName) return ''
        const normalized = skillIconDir.replace(/\\/g, '/')
        return convertFileSrc(`${normalized}/${iconFileName}`)
    }, [values, skillIconDir, iconFileName])

    if (!values) return <div className="todo-box">请选择一条功法数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" onChange={event => onChange({ id: toSafeNumber(event.target.value) })} value={values.id} />
            </label>
            <label className="config-field">
                <span>Skill_ID (唯一ID)</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ Skill_ID: toSafeNumber(event.target.value) })}
                    value={values.Skill_ID}
                />
            </label>
            <label className="config-field">
                <span>图标</span>
                <input
                    inputMode="numeric"
                    onChange={event => {
                        setImgError(false)
                        onChange({ icon: toSafeNumber(event.target.value) })
                    }}
                    value={values.icon}
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
                <span>功法等级</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ Skill_Lv: toSafeNumber(event.target.value) })}
                    value={values.Skill_Lv}
                />
            </label>
            <label className="config-field">
                <span>功法名称</span>
                <input onChange={event => onChange({ name: event.target.value })} value={values.name} />
            </label>
            <label className="config-field">
                <span>请教类型</span>
                <select onChange={event => onChange({ qingjiaotype: toSafeNumber(event.target.value) })} value={values.qingjiaotype}>
                    {withCurrent(skillConsultTypeOptions, values.qingjiaotype).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>图鉴显示</span>
                <textarea
                    className="config-desc-input"
                    onChange={event => onChange({ TuJiandescr: event.target.value })}
                    value={values.TuJiandescr}
                />
            </label>
            <label className="config-field">
                <span>介绍</span>
                <textarea className="config-desc-input" onChange={event => onChange({ descr: event.target.value })} value={values.descr} />
            </label>
            <label className="config-field">
                <span>攻击属性</span>
                <select onChange={event => onChange({ AttackType: toSafeNumber(event.target.value) })} value={values.AttackType}>
                    {withCurrent(attackTypeOptions, values.AttackType).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>功法等阶</span>
                <select onChange={event => onChange({ Skill_LV: toSafeNumber(event.target.value) })} value={values.Skill_LV}>
                    {withCurrent(skillQualityOptions, values.Skill_LV).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>功法品级</span>
                <select onChange={event => onChange({ typePinJie: toSafeNumber(event.target.value) })} value={values.typePinJie}>
                    {withCurrent(skillPhaseOptions, values.typePinJie).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>参悟时间</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ Skill_castTime: toSafeNumber(event.target.value) })}
                    value={values.Skill_castTime}
                />
            </label>
            <label className="config-field">
                <span>修炼速度</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ Skill_Speed: toSafeNumber(event.target.value) })}
                    value={values.Skill_Speed}
                />
            </label>
            <div className="bool-field-row">
                <span>斗法是否显示</span>
                <input checked={values.DF === 1} onChange={event => onChange({ DF: event.target.checked ? 1 : 0 })} type="checkbox" />
            </div>
            <label className="config-field">
                <span>图鉴类型</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ TuJianType: toSafeNumber(event.target.value) })}
                    value={values.TuJianType}
                />
            </label>

            <label className="config-field">
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
                            <select
                                onChange={event => {
                                    const next = [...values.Affix]
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ Affix: next })
                                }}
                                value={affix}
                            >
                                <option value={affix}>{affix > 0 ? `当前: ${affix}` : '选择词缀'}</option>
                                {affixOptions.map(option => (
                                    <option key={option.id} value={option.id}>
                                        {option.id}.{option.name}
                                    </option>
                                ))}
                            </select>
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
                    <button className="save-btn" onClick={() => onChange({ Affix: [...values.Affix, 0] })} type="button">
                        <Plus size={14} /> 新增词缀
                    </button>
                </div>
            </label>

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
