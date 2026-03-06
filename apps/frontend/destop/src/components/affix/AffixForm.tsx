import type { AffixEntry } from '../../types'

type Option = { id: number; name: string }

type AffixFormProps = {
    values: AffixEntry | null
    affixTypeOptions: Option[]
    affixProjectTypeOptions: Option[]
    onChange: (patch: Partial<AffixEntry>) => void
}

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function withCurrent(options: Option[], current: number) {
    return options.some(item => item.id === current) ? options : [{ id: current, name: '未定义' }, ...options]
}

export function AffixForm({ values, affixTypeOptions, affixProjectTypeOptions, onChange }: AffixFormProps) {
    if (!values) return <div className="todo-box">请选择一条词缀数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" onChange={event => onChange({ id: toSafeNumber(event.target.value) })} value={values.id} />
            </label>
            <label className="config-field">
                <span>文本</span>
                <input onChange={event => onChange({ name1: event.target.value })} value={values.name1} />
            </label>
            <label className="config-field">
                <span>类型</span>
                <select
                    onChange={event => {
                        const type = toSafeNumber(event.target.value)
                        const option = affixTypeOptions.find(item => item.id === type)
                        onChange({
                            type,
                            name1: option?.name || values.name1,
                        })
                    }}
                    value={values.type}
                >
                    {withCurrent(affixTypeOptions, values.type).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>分类</span>
                <select onChange={event => onChange({ typenum: toSafeNumber(event.target.value) })} value={values.typenum}>
                    {withCurrent(affixProjectTypeOptions, values.typenum).map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}.{option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>名称</span>
                <input onChange={event => onChange({ name2: event.target.value })} value={values.name2} />
            </label>
            <label className="config-field">
                <span>介绍</span>
                <textarea className="config-desc-input" onChange={event => onChange({ descr: event.target.value })} value={values.descr} />
            </label>
        </div>
    )
}
