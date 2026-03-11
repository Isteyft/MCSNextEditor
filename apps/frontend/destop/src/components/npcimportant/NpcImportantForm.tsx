import type { NpcImportantEntry } from '../../types'

type NpcImportantFormProps = {
    values: NpcImportantEntry | null
    onChange: (patch: Partial<NpcImportantEntry>) => void
}

const SEX_OPTIONS = [
    { id: 0, name: '未设置' },
    { id: 1, name: '男' },
    { id: 2, name: '女' },
    { id: 3, name: '不男不女' },
]

function toSafeNumber(input: string) {
    const value = Number(input)
    return Number.isFinite(value) ? value : 0
}

function splitDateParts(value: string) {
    const match = /^(\d{0,4})-(\d{0,2})-(\d{0,2})$/.exec(value.trim())
    if (!match) return { year: '', month: '', day: '' }
    return {
        year: match[1] ?? '',
        month: match[2] ?? '',
        day: match[3] ?? '',
    }
}

function buildDateString(year: string, month: string, day: string) {
    const hasAny = year.trim() || month.trim() || day.trim()
    if (!hasAny) return ''
    const normalizedYear = year.trim().padStart(4, '0')
    const normalizedMonth = month.trim().padStart(2, '0')
    const normalizedDay = day.trim().padStart(2, '0')
    return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (next: string) => void }) {
    const parts = splitDateParts(value)
    return (
        <div className="config-field">
            <span>{label}</span>
            <div className="affix-row">
                <input
                    inputMode="numeric"
                    placeholder="年"
                    value={parts.year}
                    onChange={event => onChange(buildDateString(event.target.value, parts.month, parts.day))}
                />
                <input
                    inputMode="numeric"
                    placeholder="月"
                    value={parts.month}
                    onChange={event => onChange(buildDateString(parts.year, event.target.value, parts.day))}
                />
                <input
                    inputMode="numeric"
                    placeholder="日"
                    value={parts.day}
                    onChange={event => onChange(buildDateString(parts.year, parts.month, event.target.value))}
                />
            </div>
        </div>
    )
}

export function NpcImportantForm({ values, onChange }: NpcImportantFormProps) {
    if (!values) return <div className="todo-box">请选择一条重要NPC数据</div>

    return (
        <div className="config-form-wrap">
            <label className="config-field">
                <span>ID</span>
                <input inputMode="numeric" value={values.id} onChange={event => onChange({ id: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>流派</span>
                <input
                    inputMode="numeric"
                    value={values.LiuPai}
                    onChange={event => onChange({ LiuPai: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>初始境界</span>
                <input inputMode="numeric" value={values.level} onChange={event => onChange({ level: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>性别</span>
                <select value={values.sex} onChange={event => onChange({ sex: toSafeNumber(event.target.value) })}>
                    {SEX_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.id}. {option.name}
                        </option>
                    ))}
                </select>
            </label>
            <label className="config-field">
                <span>资质</span>
                <input inputMode="numeric" value={values.zizhi} onChange={event => onChange({ zizhi: toSafeNumber(event.target.value) })} />
            </label>
            <label className="config-field">
                <span>悟性</span>
                <input
                    inputMode="numeric"
                    value={values.wuxing}
                    onChange={event => onChange({ wuxing: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>年龄</span>
                <input
                    inputMode="numeric"
                    value={values.nianling}
                    onChange={event => onChange({ nianling: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>性格</span>
                <input
                    inputMode="numeric"
                    value={values.XingGe}
                    onChange={event => onChange({ XingGe: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>称号</span>
                <input
                    inputMode="numeric"
                    value={values.ChengHao}
                    onChange={event => onChange({ ChengHao: toSafeNumber(event.target.value) })}
                />
            </label>
            <label className="config-field">
                <span>NPC标签</span>
                <input
                    inputMode="numeric"
                    value={values.NPCTag}
                    onChange={event => onChange({ NPCTag: toSafeNumber(event.target.value) })}
                />
            </label>
            <DateField label="筑基时间" value={values.ZhuJiTime} onChange={next => onChange({ ZhuJiTime: next })} />
            <DateField label="金丹时间" value={values.JinDanTime} onChange={next => onChange({ JinDanTime: next })} />
            <DateField label="元婴时间" value={values.YuanYingTime} onChange={next => onChange({ YuanYingTime: next })} />
            <DateField label="化神时间" value={values.HuaShengTime} onChange={next => onChange({ HuaShengTime: next })} />
        </div>
    )
}
