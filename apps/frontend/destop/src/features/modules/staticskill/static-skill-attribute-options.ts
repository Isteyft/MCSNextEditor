export type StaticSkillAttributeOption = {
    id: number
    name: string
    builtin: boolean
}

export const BUILTIN_STATIC_SKILL_ATTRIBUTE_OPTIONS: StaticSkillAttributeOption[] = [
    { id: 0, name: '金', builtin: true },
    { id: 1, name: '木', builtin: true },
    { id: 2, name: '水', builtin: true },
    { id: 3, name: '火', builtin: true },
    { id: 4, name: '土', builtin: true },
    { id: 5, name: '气', builtin: true },
    { id: 6, name: '遁术', builtin: true },
    { id: 7, name: '神', builtin: true },
    { id: 8, name: '剑', builtin: true },
    { id: 9, name: '体', builtin: true },
]

export function mergeStaticSkillAttributeOptions(customOptions: Array<{ id: number; name: string }> = []): StaticSkillAttributeOption[] {
    const merged = [...BUILTIN_STATIC_SKILL_ATTRIBUTE_OPTIONS]
    for (const item of customOptions) {
        const id = Number(item.id)
        const name = String(item.name ?? '').trim()
        if (!Number.isFinite(id) || id < 0 || !name) continue
        if (merged.some(option => option.id === id)) continue
        merged.push({ id, name, builtin: false })
    }
    return merged.sort((a, b) => a.id - b.id)
}

export function getStaticSkillAttributeLabel(attributeId: number, customOptions: Array<{ id: number; name: string }> = []) {
    const match = mergeStaticSkillAttributeOptions(customOptions).find(option => option.id === attributeId)
    return match ? match.name : `未定义(${attributeId})`
}
