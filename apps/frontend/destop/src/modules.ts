export type ModuleKey =
    | 'project-config'
    | 'settings'
    | 'npc'
    | 'npcimportant'
    | 'npctype'
    | 'npcwudao'
    | 'backpack'
    | 'wudao'
    | 'wudaoskill'
    | 'affix'
    | 'talent'
    | 'buff'
    | 'item'
    | 'skill'
    | 'staticskill'
export type ViewMode = 'config-form' | 'todo' | 'table'

export const MODULES: { key: ModuleKey; label: string }[] = [
    { key: 'project-config', label: '项目配置' },
    { key: 'settings', label: '设置' },
    { key: 'npc', label: '非实例NPC' },
    { key: 'npcimportant', label: '重要NPC' },
    { key: 'npctype', label: 'NPC类型' },
    { key: 'npcwudao', label: 'NPC悟道' },
    { key: 'backpack', label: '背包' },
    { key: 'wudao', label: '悟道' },
    { key: 'wudaoskill', label: '悟道技能' },
    { key: 'affix', label: '词缀' },
    { key: 'talent', label: '天赋' },
    { key: 'buff', label: 'Buff' },
    { key: 'item', label: '物品' },
    { key: 'skill', label: '神通' },
    { key: 'staticskill', label: '功法' },
]
