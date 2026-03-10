import { convertFileSrc } from '@tauri-apps/api/core'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { SkillEntry } from '../../types'

type Option = { id: number; name: string }

type SkillFormProps = {
    values: SkillEntry | null
    skillIconDir: string
    onChange: (patch: Partial<SkillEntry>) => void
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
    attackTypeOptions: Option[]
    skillConsultTypeOptions: Option[]
    skillPhaseOptions: Option[]
    skillQualityOptions: Option[]
    affixOptions: Option[]
}

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function toNumberList(input: string) {
    return input
        .split(',')
        .map(item => Number(item.trim()))
        .filter(item => Number.isFinite(item))
}

function withCurrent(options: Option[], current: number) {
    return options.some(item => item.id === current) ? options : [{ id: current, name: '未定义' }, ...options]
}

export function SkillForm({
    values,
    skillIconDir,
    onChange,
    onOpenSeidEditor,
    seidDisplayRows,
    attackTypeOptions,
    skillConsultTypeOptions,
    skillPhaseOptions,
    skillQualityOptions,
    affixOptions,
}: SkillFormProps) {
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

    if (!values) return <div className="todo-box">请选择一条神通数据</div>

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
                <span>神通图标</span>
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
                <span>神通名称</span>
                <input onChange={event => onChange({ name: event.target.value })} value={values.name} />
            </label>
            <label className="config-field">
                <span>神通等级</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ Skill_Lv: toSafeNumber(event.target.value) })}
                    value={values.Skill_Lv}
                />
            </label>
            <label className="config-field">
                <span>神通特效</span>
                <input onChange={event => onChange({ skillEffect: event.target.value })} value={values.skillEffect} />
            </label>
            <label className="config-field">
                <span>释放优先级</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ Skill_Type: toSafeNumber(event.target.value) })}
                    value={values.Skill_Type}
                />
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
                <span>技能描述</span>
                <textarea className="config-desc-input" onChange={event => onChange({ descr: event.target.value })} value={values.descr} />
            </label>
            <label className="config-field">
                <span>图鉴描述</span>
                <textarea
                    className="config-desc-input"
                    onChange={event => onChange({ TuJiandescr: event.target.value })}
                    value={values.TuJiandescr}
                />
            </label>
            <label className="config-field">
                <span>神通等阶</span>
                <select onChange={event => onChange({ Skill_LV: toSafeNumber(event.target.value) })} value={values.Skill_LV}>
                    {withCurrent(skillQualityOptions, values.Skill_LV).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>

            <div className="config-field">
                <span>攻击类型</span>
                <div className="multi-check-list">
                    {attackTypeOptions.map(option => {
                        const checked = values.AttackType.includes(option.id)
                        return (
                            <label className="multi-check-item" key={option.id}>
                                <input
                                    checked={checked}
                                    onChange={event => {
                                        const next = event.target.checked
                                            ? [...values.AttackType, option.id].filter((id, idx, arr) => arr.indexOf(id) === idx)
                                            : values.AttackType.filter(id => id !== option.id)
                                        onChange({ AttackType: next })
                                    }}
                                    type="checkbox"
                                />
                                <span>
                                    {option.id}.{option.name}
                                </span>
                            </label>
                        )
                    })}
                    {attackTypeOptions.length === 0 ? (
                        <input
                            onChange={event => onChange({ AttackType: toNumberList(event.target.value) })}
                            placeholder="未加载 AttackType.json，输入例如: 28,30"
                            value={values.AttackType.join(',')}
                        />
                    ) : null}
                </div>
            </div>

            <label className="config-field">
                <span>品级</span>
                <select onChange={event => onChange({ typePinJie: toSafeNumber(event.target.value) })} value={values.typePinJie}>
                    {withCurrent(skillPhaseOptions, values.typePinJie).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>攻击目标</span>
                <select
                    onChange={event => onChange({ script: event.target.value === 'SkillSelf' ? 'SkillSelf' : 'SkillAttack' })}
                    value={values.script}
                >
                    <option value="SkillAttack">对方</option>
                    <option value="SkillSelf">自身</option>
                </select>
            </label>
            <label className="config-field">
                <span>基础伤害</span>
                <input inputMode="numeric" onChange={event => onChange({ HP: toSafeNumber(event.target.value) })} value={values.HP} />
            </label>
            <label className="config-field">
                <span>同灵气消耗</span>
                <input
                    onChange={event => onChange({ skill_SameCastNum: toNumberList(event.target.value) })}
                    placeholder="例如: 1,2"
                    value={values.skill_SameCastNum.join(',')}
                />
            </label>
            <label className="config-field">
                <span>消耗类型</span>
                <input
                    onChange={event => onChange({ skill_CastType: toNumberList(event.target.value) })}
                    placeholder="例如: 1,2"
                    value={values.skill_CastType.join(',')}
                />
            </label>
            <label className="config-field">
                <span>消耗数量</span>
                <input
                    onChange={event => onChange({ skill_Cast: toNumberList(event.target.value) })}
                    placeholder="例如: 10,20"
                    value={values.skill_Cast.join(',')}
                />
            </label>

            <label className="config-field">
                <span>词缀</span>
                <div className="affix-list">
                    {values.Affix2.map((affix, index) => (
                        <div className="affix-row" key={`${affix}-${index}`}>
                            <input
                                inputMode="numeric"
                                onChange={event => {
                                    const next = [...values.Affix2]
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ Affix2: next })
                                }}
                                value={affix}
                            />
                            <select
                                onChange={event => {
                                    const next = [...values.Affix2]
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ Affix2: next })
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
                                    const next = values.Affix2.filter((_, idx) => idx !== index)
                                    onChange({ Affix2: next })
                                }}
                                type="button"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <button className="save-btn" onClick={() => onChange({ Affix2: [...values.Affix2, 0] })} type="button">
                        <Plus size={14} /> 新增词缀
                    </button>
                </div>
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
                <span>冷却</span>
                <input inputMode="numeric" onChange={event => onChange({ CD: toSafeNumber(event.target.value) })} value={values.CD} />
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
