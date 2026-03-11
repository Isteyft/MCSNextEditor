import type { NpcTypeEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyNpcType(id: number): NpcTypeEntry {
    return {
        id,
        Type: 0,
        LiuPai: 0,
        MengPai: 0,
        Level: 0,
        skills: [],
        staticSkills: [],
        yuanying: 0,
        HuaShenLingYu: 0,
        LingGen: [0, 0, 0, 0, 0],
        wudaoType: 0,
        NPCTag: [],
        canjiaPaiMai: 0,
        paimaifenzu: [],
        AvatarType: 0,
        XinQuType: 0,
        equipWeapon: [],
        equipClothing: [],
        equipRing: [],
        JinDanType: [],
        FirstName: '',
        ShiLi: [0, 0],
        AttackType: 0,
        DefenseType: 0,
    }
}

export function normalizeNpcTypeMap(parsed: unknown): Record<string, NpcTypeEntry> {
    const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    const next: Record<string, NpcTypeEntry> = {}

    for (const [key, raw] of Object.entries(source)) {
        if (!raw || typeof raw !== 'object') continue
        const row = raw as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue

        next[String(id)] = {
            id,
            Type: Number(row.Type ?? 0),
            LiuPai: Number(row.LiuPai ?? 0),
            MengPai: Number(row.MengPai ?? row.MenPai ?? 0),
            Level: Number(row.Level ?? 0),
            skills: normalizeNumberArray(row.skills),
            staticSkills: normalizeNumberArray(row.staticSkills),
            yuanying: Number(row.yuanying ?? 0),
            HuaShenLingYu: Number(row.HuaShenLingYu ?? 0),
            LingGen: normalizeFixedNumberArray(row.LingGen, 5),
            wudaoType: Number(row.wudaoType ?? 0),
            NPCTag: normalizeNumberArray(row.NPCTag),
            canjiaPaiMai: Number(row.canjiaPaiMai ?? 0),
            paimaifenzu: normalizeNumberArray(row.paimaifenzu),
            AvatarType: Number(row.AvatarType ?? 0),
            XinQuType: Number(row.XinQuType ?? 0),
            equipWeapon: normalizeNumberArray(row.equipWeapon),
            equipClothing: normalizeNumberArray(row.equipClothing),
            equipRing: normalizeNumberArray(row.equipRing),
            JinDanType: normalizeNumberArray(row.JinDanType),
            FirstName: String(row.FirstName ?? ''),
            ShiLi: normalizeFixedNumberArray(row.ShiLi, 2),
            AttackType: Number(row.AttackType ?? 0),
            DefenseType: Number(row.DefenseType ?? 0),
        }
    }

    return next
}

export function toNpcTypeRows(map: Record<string, NpcTypeEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.FirstName.trim() || `类型 ${value.Type}`,
            fenLei: `流派 ${value.LiuPai} / 门派 ${value.MengPai}`,
            desc: `境界 ${value.Level} / 种族 ${value.AvatarType}`,
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveNpcTypeFile(params: {
    npcTypeMap: Record<string, NpcTypeEntry>
    npcTypePath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { npcTypeMap, npcTypePath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(npcTypeMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                {
                    id: row.id,
                    Type: row.Type,
                    LiuPai: row.LiuPai,
                    MengPai: row.MengPai,
                    Level: row.Level,
                    skills: row.skills,
                    staticSkills: row.staticSkills,
                    yuanying: row.yuanying,
                    HuaShenLingYu: row.HuaShenLingYu,
                    LingGen: row.LingGen,
                    wudaoType: row.wudaoType,
                    NPCTag: row.NPCTag,
                    canjiaPaiMai: row.canjiaPaiMai,
                    paimaifenzu: row.paimaifenzu,
                    AvatarType: row.AvatarType,
                    XinQuType: row.XinQuType,
                    equipWeapon: row.equipWeapon,
                    equipClothing: row.equipClothing,
                    equipRing: row.equipRing,
                    JinDanType: row.JinDanType,
                    FirstName: row.FirstName,
                    ShiLi: row.ShiLi,
                    AttackType: row.AttackType,
                    DefenseType: row.DefenseType,
                },
            ])
    )
    await saveFilePayload(npcTypePath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(npcTypeMap).length
}

function normalizeNumberArray(value: unknown) {
    return Array.isArray(value) ? value.map(item => Number(item)).filter(item => Number.isFinite(item)) : []
}

function normalizeFixedNumberArray(value: unknown, expectedLength: number) {
    const list = normalizeNumberArray(value)
    return Array.from({ length: expectedLength }, (_, index) => list[index] ?? 0)
}
