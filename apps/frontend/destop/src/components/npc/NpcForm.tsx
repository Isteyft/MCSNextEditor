import { PenLine, Plus, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { NpcEntry } from '../../types'

type Option = { id: number; name: string }

type NpcFormProps = {
    values: NpcEntry | null
    onChange: (patch: Partial<NpcEntry>) => void
    skillOptions: Option[]
    staticSkillOptions: Option[]
    itemTypeOptions: Option[]
}

type PickerState =
    | { kind: 'skills'; index: number; title: string }
    | { kind: 'staticSkills'; index: number; title: string }
    | { kind: 'yuanying'; title: string }

const SEX_OPTIONS: Option[] = [
    { id: 0, name: '未设置' },
    { id: 1, name: '男' },
    { id: 2, name: '女' },
    { id: 3, name: '不男不女' },
]

const AVATAR_TYPE_OPTIONS: Option[] = [
    { id: 0, name: '未设置' },
    { id: 1, name: '人' },
    { id: 2, name: '妖' },
    { id: 3, name: '魔' },
    { id: 4, name: '鬼' },
]

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
    if (!match) return ''
    return `${match.id}. ${match.name || '-'}`
}

export function NpcForm({ values, onChange, skillOptions, staticSkillOptions, itemTypeOptions }: NpcFormProps) {
    const [pickerState, setPickerState] = useState<PickerState | null>(null)
    const [pickerSearchDraft, setPickerSearchDraft] = useState('')
    const [pickerSearchText, setPickerSearchText] = useState('')

    if (!values) return <div className="todo-box">请选择一条非实例 NPC 数据</div>

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
                <span>称号</span>
                <input value={values.Title} onChange={event => onChange({ Title: event.target.value })} />
            </label>
            <label className="config-field">
                <span>姓</span>
                <input value={values.FirstName} onChange={event => onChange({ FirstName: event.target.value })} />
            </label>
            <label className="config-field">
                <span>名</span>
                <input value={values.Name} onChange={event => onChange({ Name: event.target.value })} />
            </label>
            <label className="config-field">
                <span>捏脸 ID</span>
                <input inputMode="numeric" value={values.face} onChange={event => onChange({ face: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>战斗捏脸</span>
                <input
                    inputMode="numeric"
                    value={values.fightFace}
                    onChange={event => onChange({ fightFace: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>性别</span>
                <select value={values.SexType} onChange={event => onChange({ SexType: toSafeNumber(event.target.value) })}>
                    {SEX_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>种族</span>
                <select value={values.AvatarType} onChange={event => onChange({ AvatarType: toSafeNumber(event.target.value) })}>
                    {AVATAR_TYPE_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>境界</span>
                <select value={values.Level} onChange={event => onChange({ Level: toSafeNumber(event.target.value) })}>
                    {LEVEL_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>血量</span>
                <input inputMode="numeric" value={values.HP} onChange={event => onChange({ HP: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>遁速</span>
                <input inputMode="numeric" value={values.dunSu} onChange={event => onChange({ dunSu: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>资质</span>
                <input inputMode="numeric" value={values.ziZhi} onChange={event => onChange({ ziZhi: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>悟性</span>
                <input inputMode="numeric" value={values.wuXin} onChange={event => onChange({ wuXin: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>神识</span>
                <input
                    inputMode="numeric"
                    value={values.shengShi}
                    onChange={event => onChange({ shengShi: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>煞气</span>
                <input inputMode="numeric" value={values.shaQi} onChange={event => onChange({ shaQi: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>寿元</span>
                <input
                    inputMode="numeric"
                    value={values.shouYuan}
                    onChange={event => onChange({ shouYuan: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>年龄</span>
                <input inputMode="numeric" value={values.age} onChange={event => onChange({ age: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>门派</span>
                <input value={values.menPai} onChange={event => onChange({ menPai: event.target.value })} />
            </label>
            <label className="config-field">
                <span>武器</span>
                <input
                    inputMode="numeric"
                    value={values.equipWeapon}
                    onChange={event => onChange({ equipWeapon: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>衣服</span>
                <input
                    inputMode="numeric"
                    value={values.equipClothing}
                    onChange={event => onChange({ equipClothing: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>饰品</span>
                <input
                    inputMode="numeric"
                    value={values.equipRing}
                    onChange={event => onChange({ equipRing: toSafeNumber(event.target.value) })}
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
                <span>富有度</span>
                <input
                    inputMode="numeric"
                    value={values.MoneyType}
                    onChange={event => onChange({ MoneyType: toSafeNumber(event.target.value) })}
                />
            </label>
            <div className="bool-field-row">
                <span>是否刷新</span>
                <input
                    type="checkbox"
                    checked={values.IsRefresh === 1}
                    onChange={event => onChange({ IsRefresh: event.target.checked ? 1 : 0 })}
                />
            </div>
            <label className="config-field">
                <span>战场掉落方式</span>
                <input
                    inputMode="numeric"
                    value={values.dropType}
                    onChange={event => onChange({ dropType: toSafeNumber(event.target.value) })}
                />
            </label>
            <div className="bool-field-row">
                <span>是否参加拍卖会</span>
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
                    onChange={event =>
                        onChange({
                            paimaifenzu: event.target.value
                                .split(',')
                                .map(item => Number(item.trim()))
                                .filter(item => Number.isFinite(item)),
                        })
                    }
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
                <span>感兴趣的物品大类型</span>
                <select value={values.XinQuType} onChange={event => onChange({ XinQuType: toSafeNumber(event.target.value) })}>
                    {withCurrent(itemTypeOptions, values.XinQuType).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
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
