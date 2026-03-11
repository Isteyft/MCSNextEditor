import type {
    AffixEntry,
    BackpackEntry,
    BuffEntry,
    CreateAvatarEntry,
    ItemEntry,
    NpcImportantEntry,
    NpcTypeEntry,
    NpcWuDaoEntry,
    SkillEntry,
    StaticSkillEntry,
} from '../../types'

type SeidDataValue = Record<string, Record<string, string | number | number[]>>

function cloneSeidData(source: SeidDataValue | undefined): SeidDataValue {
    return JSON.parse(JSON.stringify(source ?? {})) as SeidDataValue
}

export function cloneTalentEntry(entry: CreateAvatarEntry): CreateAvatarEntry {
    return {
        ...entry,
        seid: [...entry.seid],
        seidData: cloneSeidData(entry.seidData),
    }
}

export function cloneBackpackEntry(entry: BackpackEntry): BackpackEntry {
    return {
        ...entry,
        ItemID: [...entry.ItemID],
        randomNum: [...entry.randomNum],
    }
}

export function cloneNpcImportantEntry(entry: NpcImportantEntry): NpcImportantEntry {
    return {
        ...entry,
        EventValue: [...entry.EventValue],
    }
}

export function cloneNpcTypeEntry(entry: NpcTypeEntry): NpcTypeEntry {
    return {
        ...entry,
        skills: [...entry.skills],
        staticSkills: [...entry.staticSkills],
        LingGen: [...entry.LingGen],
        NPCTag: [...entry.NPCTag],
        paimaifenzu: [...entry.paimaifenzu],
        equipWeapon: [...entry.equipWeapon],
        equipClothing: [...entry.equipClothing],
        equipRing: [...entry.equipRing],
        JinDanType: [...entry.JinDanType],
        ShiLi: [...entry.ShiLi],
    }
}

export function cloneNpcWuDaoEntry(entry: NpcWuDaoEntry): NpcWuDaoEntry {
    const runtimeEntry = entry as NpcWuDaoEntry & { __extraValues?: Record<string, number> }
    return {
        ...runtimeEntry,
        wudaoID: [...entry.wudaoID],
        ...(runtimeEntry.__extraValues ? { __extraValues: { ...runtimeEntry.__extraValues } } : {}),
    }
}

export function cloneAffixEntry(entry: AffixEntry): AffixEntry {
    return {
        ...entry,
    }
}

export function cloneBuffEntry(entry: BuffEntry): BuffEntry {
    return {
        ...entry,
        Affix: [...entry.Affix],
        seid: [...entry.seid],
        seidData: cloneSeidData(entry.seidData),
    }
}

export function cloneItemEntry(entry: ItemEntry): ItemEntry {
    return {
        ...entry,
        Affix: [...entry.Affix],
        ItemFlag: [...entry.ItemFlag],
        wuDao: [...entry.wuDao],
        seid: [...entry.seid],
        seidData: cloneSeidData(entry.seidData),
    }
}

export function cloneSkillEntry(entry: SkillEntry): SkillEntry {
    return {
        ...entry,
        seid: [...entry.seid],
        Affix: [...entry.Affix],
        Affix2: [...entry.Affix2],
        AttackType: [...entry.AttackType],
        skill_SameCastNum: [...entry.skill_SameCastNum],
        skill_CastType: [...entry.skill_CastType],
        skill_Cast: [...entry.skill_Cast],
        seidData: cloneSeidData(entry.seidData),
    }
}

export function cloneStaticSkillEntry(entry: StaticSkillEntry): StaticSkillEntry {
    return {
        ...entry,
        Affix: [...entry.Affix],
        seid: [...entry.seid],
        seidData: cloneSeidData(entry.seidData),
    }
}

export function isEditableElement(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    return Boolean(target.closest('[contenteditable="true"]'))
}

export function dirname(path: string): string {
    const normalized = path.replace(/[\\/]+$/, '')
    const index = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'))
    return index >= 0 ? normalized.slice(0, index) : ''
}

export function normalizePath(path: string): string {
    return path.replace(/\//g, '\\').toLowerCase()
}

export function stripProjectPrefix(value: string): string {
    return value.replace(/^mod[\\/]+/i, '').trim()
}
