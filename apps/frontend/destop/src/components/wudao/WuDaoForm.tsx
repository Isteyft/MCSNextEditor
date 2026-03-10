import type { WuDaoEntry } from '../../types'

type WuDaoFormProps = {
    values: WuDaoEntry | null
    onChange: (patch: Partial<WuDaoEntry>) => void
}

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

export function WuDaoForm({ values, onChange }: WuDaoFormProps) {
    if (!values) return <div className="todo-box">请选择一条悟道数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" onChange={event => onChange({ id: toSafeNumber(event.target.value) })} value={values.id} />
            </label>
            <label className="config-field">
                <span>名称</span>
                <input onChange={event => onChange({ name: event.target.value })} value={values.name} />
            </label>
            <label className="config-field">
                <span>显示名称</span>
                <input onChange={event => onChange({ name1: event.target.value })} value={values.name1} />
            </label>
        </div>
    )
}
