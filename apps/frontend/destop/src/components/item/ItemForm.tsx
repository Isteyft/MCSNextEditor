import { convertFileSrc } from '@tauri-apps/api/core'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { ItemEntry } from '../../types'

type Option = { id: number; name: string }

type ItemFormProps = {
    values: ItemEntry | null
    itemIconDir: string
    onChange: (patch: Partial<ItemEntry>) => void
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
    guideTypeOptions: Option[]
    itemShopTypeOptions: Option[]
    itemUseTypeOptions: Option[]
    itemTypeOptions: Option[]
    itemQualityOptions: Option[]
    itemPhaseOptions: Option[]
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

export function ItemForm({
    values,
    itemIconDir,
    onChange,
    onOpenSeidEditor,
    seidDisplayRows,
    guideTypeOptions,
    itemShopTypeOptions,
    itemUseTypeOptions,
    itemTypeOptions,
    itemQualityOptions,
    itemPhaseOptions,
    affixOptions,
}: ItemFormProps) {
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        setImgError(false)
    }, [values?.id, values?.ItemIcon, itemIconDir])

    const iconFileName = useMemo(() => {
        if (!values) return ''
        return values.ItemIcon === 0 ? `${values.id}.png` : `${values.ItemIcon}.png`
    }, [values])

    const iconSrc = useMemo(() => {
        if (!values || !itemIconDir || !iconFileName) return ''
        const normalized = itemIconDir.replace(/\\/g, '/')
        return convertFileSrc(`${normalized}/${iconFileName}`)
    }, [values, itemIconDir, iconFileName])

    if (!values) return <div className="todo-box">请选择一条物品数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" onChange={event => onChange({ id: toSafeNumber(event.target.value) })} value={values.id} />
            </label>
            <label className="config-field">
                <span>物品图标</span>
                <input
                    inputMode="numeric"
                    onChange={event => {
                        setImgError(false)
                        onChange({ ItemIcon: toSafeNumber(event.target.value) })
                    }}
                    value={values.ItemIcon}
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
                <span>最大堆叠数量</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ maxNum: toSafeNumber(event.target.value) })}
                    value={values.maxNum}
                />
            </label>
            <label className="config-field">
                <span>物品名字</span>
                <input onChange={event => onChange({ name: event.target.value })} value={values.name} />
            </label>
            <label className="config-field">
                <span>法宝类型</span>
                <input onChange={event => onChange({ FaBaoType: event.target.value })} value={values.FaBaoType} />
            </label>
            <label className="config-field">
                <span>图鉴类型</span>
                <select onChange={event => onChange({ TuJianType: toSafeNumber(event.target.value) })} value={values.TuJianType}>
                    {withCurrent(guideTypeOptions, values.TuJianType).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>商品类型</span>
                <select onChange={event => onChange({ ShopType: toSafeNumber(event.target.value) })} value={values.ShopType}>
                    {withCurrent(itemShopTypeOptions, values.ShopType).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>物品标签</span>
                <input onChange={event => onChange({ ItemFlag: toNumberList(event.target.value) })} value={values.ItemFlag.join(',')} />
            </label>
            <label className="config-field">
                <span>炼器类型</span>
                <select onChange={event => onChange({ WuWeiType: toSafeNumber(event.target.value) })} value={values.WuWeiType}>
                    <option value={0}>0.无</option>
                    <option value={1}>1.皮、鳞片</option>
                    <option value={2}>2.金属</option>
                    <option value={3}>3.石</option>
                    <option value={4}>4.灵物</option>
                    <option value={5}>5.牙、骨</option>
                </select>
            </label>
            <label className="config-field">
                <span>属性类型</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ ShuXingType: toSafeNumber(event.target.value) })}
                    value={values.ShuXingType}
                />
            </label>
            <label className="config-field">
                <span>物品类型</span>
                <select onChange={event => onChange({ type: toSafeNumber(event.target.value) })} value={values.type}>
                    {withCurrent(itemTypeOptions, values.type).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>品阶</span>
                <select onChange={event => onChange({ quality: toSafeNumber(event.target.value) })} value={values.quality}>
                    {withCurrent(itemQualityOptions, values.quality).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>品级</span>
                <select onChange={event => onChange({ typePinJie: toSafeNumber(event.target.value) })} value={values.typePinJie}>
                    {withCurrent(itemPhaseOptions, values.typePinJie).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>学习时间</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ StuTime: toSafeNumber(event.target.value) })}
                    value={values.StuTime}
                />
            </label>
            <label className="config-field">
                <span>大类型</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ vagueType: toSafeNumber(event.target.value) })}
                    value={values.vagueType}
                />
            </label>
            <label className="config-field">
                <span>价格</span>
                <input inputMode="numeric" onChange={event => onChange({ price: toSafeNumber(event.target.value) })} value={values.price} />
            </label>
            <label className="config-field">
                <span>物品说明</span>
                <textarea className="config-desc-input" onChange={event => onChange({ desc: event.target.value })} value={values.desc} />
            </label>
            <label className="config-field">
                <span>介绍</span>
                <textarea className="config-desc-input" onChange={event => onChange({ desc2: event.target.value })} value={values.desc2} />
            </label>
            <div className="bool-field-row">
                <span>是否可出售</span>
                <input
                    checked={values.CanSale === 1}
                    onChange={event => onChange({ CanSale: event.target.checked ? 1 : 0 })}
                    type="checkbox"
                />
            </div>
            <label className="config-field">
                <span>丹毒</span>
                <input inputMode="numeric" onChange={event => onChange({ DanDu: toSafeNumber(event.target.value) })} value={values.DanDu} />
            </label>
            <label className="config-field">
                <span>是否可以使用</span>
                <select onChange={event => onChange({ CanUse: toSafeNumber(event.target.value) })} value={values.CanUse}>
                    {withCurrent(itemUseTypeOptions, values.CanUse).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <div className="bool-field-row">
                <span>NPC是否可以使用</span>
                <input
                    checked={values.NPCCanUse === 1}
                    onChange={event => onChange({ NPCCanUse: event.target.checked ? 1 : 0 })}
                    type="checkbox"
                />
            </div>
            <label className="config-field">
                <span>药引</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ yaoZhi1: toSafeNumber(event.target.value) })}
                    value={values.yaoZhi1}
                />
            </label>
            <label className="config-field">
                <span>主药</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ yaoZhi2: toSafeNumber(event.target.value) })}
                    value={values.yaoZhi2}
                />
            </label>
            <label className="config-field">
                <span>辅药</span>
                <input
                    inputMode="numeric"
                    onChange={event => onChange({ yaoZhi3: toSafeNumber(event.target.value) })}
                    value={values.yaoZhi3}
                />
            </label>
            <label className="config-field">
                <span>领悟前置条件</span>
                <input onChange={event => onChange({ wuDao: toNumberList(event.target.value) })} value={values.wuDao.join(',')} />
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
