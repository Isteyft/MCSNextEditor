import { PenLine, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { NpcTypeEntry } from '../../types'

type Option = { id: number; name: string }

type NpcTypeFormProps = {
    values: NpcTypeEntry | null
    onChange: (patch: Partial<NpcTypeEntry>) => void
    skillOptions: Option[]
    staticSkillOptions: Option[]
}

type PickerState =
    | { kind: 'skills'; index: number; title: string }
    | { kind: 'staticSkills'; index: number; title: string }
    | { kind: 'yuanying'; title: string }

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function parseNumberList(text: string) {
    return text
        .split(/[\s,，]+/)
        .map(item => Number(item.trim()))
        .filter(item => Number.isFinite(item))
}

function findOptionLabel(options: Option[], id: number) {
    if (!id) return ''
    const match = options.find(option => option.id === id)
    if (!match) return ''
    return `${match.id}. ${match.name || '-'}`
}

export function NpcTypeForm({ values, onChange, skillOptions, staticSkillOptions }: NpcTypeFormProps) {
    const [pickerState, setPickerState] = useState<PickerState | null>(null)
    const [pickerSearchDraft, setPickerSearchDraft] = useState('')
    const [pickerSearchText, setPickerSearchText] = useState('')

    if (!values) return <div className="todo-box">请选择一条 NPC类型 数据</div>

    const lingGenLabels = ['金', '木', '水', '火', '土', '魔']
    const skills = values.skills.slice(0, 10)
    const staticSkills = values.staticSkills.slice(0, 5)
    const activePickerOptions = pickerState?.kind === 'skills' ? skillOptions : staticSkillOptions
    const pickerKeyword = pickerSearchText.trim().toLowerCase()
    const filteredPickerOptions = useMemo(() => {
        if (!pickerKeyword) return activePickerOptions
        return activePickerOptions.filter(option => `${option.id} ${option.name}`.toLowerCase().includes(pickerKeyword))
    }, [activePickerOptions, pickerKeyword])

    function closePicker() {
        setPickerState(null)
        setPickerSearchDraft('')
        setPickerSearchText('')
    }

    function applyPickerValue(optionId: number) {
        if (!pickerState) return
        if (pickerState.kind === 'skills') {
            const next = [...skills]
            next[pickerState.index] = optionId
            onChange({ skills: next.filter((_, idx) => idx < 10) })
        } else if (pickerState.kind === 'staticSkills') {
            const next = [...staticSkills]
            next[pickerState.index] = optionId
            onChange({ staticSkills: next.filter((_, idx) => idx < 5) })
        } else {
            onChange({ yuanying: optionId })
        }
        closePicker()
    }

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" value={values.id} onChange={event => onChange({ id: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>NPC类型</span>
                <input inputMode="numeric" value={values.Type} onChange={event => onChange({ Type: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>流派ID</span>
                <input
                    inputMode="numeric"
                    value={values.LiuPai}
                    onChange={event => onChange({ LiuPai: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>门派ID</span>
                <input
                    inputMode="numeric"
                    value={values.MengPai}
                    onChange={event => onChange({ MengPai: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>境界</span>
                <input inputMode="numeric" value={values.Level} onChange={event => onChange({ Level: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>姓氏</span>
                <input value={values.FirstName} onChange={event => onChange({ FirstName: event.target.value })} />
            </label>
            <label className="config-field">
                <span>种族</span>
                <input
                    inputMode="numeric"
                    value={values.AvatarType}
                    onChange={event => onChange({ AvatarType: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>兴趣大类</span>
                <input
                    inputMode="numeric"
                    value={values.XinQuType}
                    onChange={event => onChange({ XinQuType: toSafeNumber(event.target.value) })}
                />
            </label>

            <div className="config-field">
                <span>灵根</span>
                <div className="affix-list">
                    {lingGenLabels.map((label, index) => (
                        <div className="affix-row" key={label}>
                            <span style={{ minWidth: 40 }}>{label}</span>
                            <input
                                inputMode="numeric"
                                value={values.LingGen[index] ?? 0}
                                onChange={event => {
                                    const next = Array.from({ length: 6 }, (_, idx) => values.LingGen[idx] ?? 0)
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ LingGen: next })
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <label className="config-field">
                <span>神通</span>
                <div className="affix-list">
                    {skills.map((skillId, index) => (
                        <div className="affix-row" key={`${skillId}-${index}`}>
                            <input
                                inputMode="numeric"
                                value={skillId}
                                onChange={event => {
                                    const next = [...skills]
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ skills: next.filter((_, idx) => idx < 10) })
                                }}
                            />
                            <button
                                className="icon-btn"
                                type="button"
                                title="选择神通"
                                onClick={() => {
                                    setPickerState({ kind: 'skills', index, title: '选择神通' })
                                    setPickerSearchDraft('')
                                    setPickerSearchText('')
                                }}
                            >
                                <PenLine size={14} />
                            </button>
                            <span className="drawer-inline-label">{findOptionLabel(skillOptions, skillId)}</span>
                            <button
                                className="icon-btn"
                                type="button"
                                onClick={() => onChange({ skills: skills.filter((_, idx) => idx !== index) })}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {skills.length < 10 ? (
                        <button className="save-btn" type="button" onClick={() => onChange({ skills: [...skills, 0] })}>
                            <Plus size={14} /> 新增神通
                        </button>
                    ) : null}
                </div>
            </label>

            <label className="config-field">
                <span>功法</span>
                <div className="affix-list">
                    {staticSkills.map((skillId, index) => (
                        <div className="affix-row" key={`${skillId}-${index}`}>
                            <input
                                inputMode="numeric"
                                value={skillId}
                                onChange={event => {
                                    const next = [...staticSkills]
                                    next[index] = toSafeNumber(event.target.value)
                                    onChange({ staticSkills: next.filter((_, idx) => idx < 5) })
                                }}
                            />
                            <button
                                className="icon-btn"
                                type="button"
                                title="选择功法"
                                onClick={() => {
                                    setPickerState({ kind: 'staticSkills', index, title: '选择功法' })
                                    setPickerSearchDraft('')
                                    setPickerSearchText('')
                                }}
                            >
                                <PenLine size={14} />
                            </button>
                            <span className="drawer-inline-label">{findOptionLabel(staticSkillOptions, skillId)}</span>
                            <button
                                className="icon-btn"
                                type="button"
                                onClick={() => onChange({ staticSkills: staticSkills.filter((_, idx) => idx !== index) })}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {staticSkills.length < 5 ? (
                        <button className="save-btn" type="button" onClick={() => onChange({ staticSkills: [...staticSkills, 0] })}>
                            <Plus size={14} /> 新增功法
                        </button>
                    ) : null}
                </div>
            </label>

            <label className="config-field">
                <span>元婴功法</span>
                <div className="affix-row">
                    <input
                        inputMode="numeric"
                        value={values.yuanying}
                        onChange={event => onChange({ yuanying: toSafeNumber(event.target.value) })}
                    />
                    <button
                        className="icon-btn"
                        type="button"
                        title="选择元婴功法"
                        onClick={() => {
                            setPickerState({ kind: 'yuanying', title: '选择元婴功法' })
                            setPickerSearchDraft('')
                            setPickerSearchText('')
                        }}
                    >
                        <PenLine size={14} />
                    </button>
                    <span className="drawer-inline-label">{findOptionLabel(staticSkillOptions, values.yuanying)}</span>
                </div>
            </label>

            <label className="config-field">
                <span>化神领域</span>
                <input
                    inputMode="numeric"
                    value={values.HuaShenLingYu}
                    onChange={event => onChange({ HuaShenLingYu: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>悟道类型</span>
                <input
                    inputMode="numeric"
                    value={values.wudaoType}
                    onChange={event => onChange({ wudaoType: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>NPC标签</span>
                <input value={values.NPCTag.join(',')} onChange={event => onChange({ NPCTag: parseNumberList(event.target.value) })} />
            </label>
            <div className="bool-field-row">
                <span>参加拍卖会</span>
                <input
                    type="checkbox"
                    checked={values.canjiaPaiMai === 1}
                    onChange={event => onChange({ canjiaPaiMai: event.target.checked ? 1 : 0 })}
                />
            </div>
            <label className="config-field">
                <span>拍卖分组</span>
                <input
                    value={values.paimaifenzu.join(',')}
                    onChange={event => onChange({ paimaifenzu: parseNumberList(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>武器类型</span>
                <input
                    value={values.equipWeapon.join(',')}
                    onChange={event => onChange({ equipWeapon: parseNumberList(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>衣服类型</span>
                <input
                    value={values.equipClothing.join(',')}
                    onChange={event => onChange({ equipClothing: parseNumberList(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>饰品类型</span>
                <input
                    value={values.equipRing.join(',')}
                    onChange={event => onChange({ equipRing: parseNumberList(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>金丹类型</span>
                <input
                    value={values.JinDanType.join(',')}
                    onChange={event => onChange({ JinDanType: parseNumberList(event.target.value) })}
                />
            </label>
            <div className="config-field">
                <span>实力</span>
                <div className="affix-list">
                    <label className="affix-row">
                        <span>最小</span>
                        <input
                            inputMode="numeric"
                            value={values.ShiLi[0] ?? 0}
                            onChange={event => {
                                const next = [values.ShiLi[0] ?? 0, values.ShiLi[1] ?? 0]
                                next[0] = toSafeNumber(event.target.value)
                                onChange({ ShiLi: next })
                            }}
                        />
                    </label>
                    <label className="affix-row">
                        <span>最大</span>
                        <input
                            inputMode="numeric"
                            value={values.ShiLi[1] ?? 0}
                            onChange={event => {
                                const next = [values.ShiLi[0] ?? 0, values.ShiLi[1] ?? 0]
                                next[1] = toSafeNumber(event.target.value)
                                onChange({ ShiLi: next })
                            }}
                        />
                    </label>
                </div>
            </div>
            <label className="config-field">
                <span>攻击类型</span>
                <input
                    inputMode="numeric"
                    value={values.AttackType}
                    onChange={event => onChange({ AttackType: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>防御类型</span>
                <input
                    inputMode="numeric"
                    value={values.DefenseType}
                    onChange={event => onChange({ DefenseType: toSafeNumber(event.target.value) })}
                />
            </label>

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
                                value={pickerSearchDraft}
                                placeholder="搜索 id/name"
                                onChange={event => setPickerSearchDraft(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') setPickerSearchText(pickerSearchDraft)
                                }}
                            />
                            <button className="search-action-btn" type="button" onClick={() => setPickerSearchText(pickerSearchDraft)}>
                                <Search size={14} />
                            </button>
                        </div>
                        <div className="drawer-list">
                            {filteredPickerOptions.length === 0 ? <div className="todo-box">当前没有可选数据</div> : null}
                            {filteredPickerOptions.map(option => (
                                <button key={option.id} className="drawer-row" type="button" onClick={() => applyPickerValue(option.id)}>
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
