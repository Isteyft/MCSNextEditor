import type { NpcEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyNpc(id: number): NpcEntry {
    return {
        id,
        Title: '',
        FirstName: '',
        Name: '',
        face: 0,
        fightFace: 0,
        SexType: 0,
        AvatarType: 0,
        Level: 0,
        HP: 0,
        dunSu: 0,
        ziZhi: 0,
        wuXin: 0,
        shengShi: 0,
        shaQi: 0,
        shouYuan: 0,
        age: 0,
        menPai: '',
        equipWeapon: 0,
        equipClothing: 0,
        equipRing: 0,
        LingGen: [0, 0, 0, 0, 0, 0],
        skills: [],
        staticSkills: [],
        yuanying: 0,
        HuaShenLingYu: 0,
        MoneyType: 0,
        IsRefresh: 1,
        dropType: 0,
        canjiaPaiMai: 0,
        paimaifenzu: [],
        wudaoType: 0,
        XinQuType: 0,
        gudingjiage: 0,
        sellPercent: 0,
    }
}

export function normalizeNpcMap(parsed: unknown): Record<string, NpcEntry> {
    const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    const next: Record<string, NpcEntry> = {}

    for (const [key, raw] of Object.entries(source)) {
        if (!raw || typeof raw !== 'object') continue
        const row = raw as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue

        next[String(id)] = {
            id,
            Title: String(row.Title ?? ''),
            FirstName: String(row.FirstName ?? ''),
            Name: String(row.Name ?? ''),
            face: Number(row.face ?? 0),
            fightFace: Number(row.fightFace ?? 0),
            SexType: Number(row.SexType ?? 0),
            AvatarType: Number(row.AvatarType ?? 0),
            Level: Number(row.Level ?? 0),
            HP: Number(row.HP ?? 0),
            dunSu: Number(row.dunSu ?? 0),
            ziZhi: Number(row.ziZhi ?? 0),
            wuXin: Number(row.wuXin ?? 0),
            shengShi: Number(row.shengShi ?? 0),
            shaQi: Number(row.shaQi ?? 0),
            shouYuan: Number(row.shouYuan ?? 0),
            age: Number(row.age ?? 0),
            menPai: String(row.menPai ?? ''),
            equipWeapon: Number(row.equipWeapon ?? 0),
            equipClothing: Number(row.equipClothing ?? 0),
            equipRing: Number(row.equipRing ?? 0),
            LingGen: normalizeNumberArray(row.LingGen, 6),
            skills: normalizeNumberArray(row.skills),
            staticSkills: normalizeNumberArray(row.staticSkills),
            yuanying: Number(row.yuanying ?? 0),
            HuaShenLingYu: Number(row.HuaShenLingYu ?? 0),
            MoneyType: Number(row.MoneyType ?? 0),
            IsRefresh: Number(row.IsRefresh ?? 1),
            dropType: Number(row.dropType ?? 0),
            canjiaPaiMai: Number(row.canjiaPaiMai ?? 0),
            paimaifenzu: normalizeNumberArray(row.paimaifenzu),
            wudaoType: Number(row.wudaoType ?? 0),
            XinQuType: Number(row.XinQuType ?? 0),
            gudingjiage: Number(row.gudingjiage ?? 0),
            sellPercent: Number(row.sellPercent ?? 0),
        }
    }

    return next
}

export function toNpcRows(map: Record<string, NpcEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.Name.trim() || String(value.id),
            fenLei: value.Title,
            desc: `境界 ${value.Level} / 种族 ${value.AvatarType}`,
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveNpcFile(params: {
    npcMap: Record<string, NpcEntry>
    npcPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { npcMap, npcPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(npcMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                {
                    id: row.id,
                    Title: row.Title,
                    FirstName: row.FirstName,
                    Name: row.Name,
                    face: row.face,
                    fightFace: row.fightFace,
                    SexType: row.SexType,
                    AvatarType: row.AvatarType,
                    Level: row.Level,
                    HP: row.HP,
                    dunSu: row.dunSu,
                    ziZhi: row.ziZhi,
                    wuXin: row.wuXin,
                    shengShi: row.shengShi,
                    shaQi: row.shaQi,
                    shouYuan: row.shouYuan,
                    age: row.age,
                    menPai: row.menPai,
                    equipWeapon: row.equipWeapon,
                    equipClothing: row.equipClothing,
                    equipRing: row.equipRing,
                    LingGen: row.LingGen,
                    skills: row.skills,
                    staticSkills: row.staticSkills,
                    yuanying: row.yuanying,
                    HuaShenLingYu: row.HuaShenLingYu,
                    MoneyType: row.MoneyType,
                    IsRefresh: row.IsRefresh,
                    dropType: row.dropType,
                    canjiaPaiMai: row.canjiaPaiMai,
                    paimaifenzu: row.paimaifenzu,
                    wudaoType: row.wudaoType,
                    XinQuType: row.XinQuType,
                    gudingjiage: row.gudingjiage,
                    sellPercent: row.sellPercent,
                },
            ])
    )
    await saveFilePayload(npcPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(npcMap).length
}

function normalizeNumberArray(value: unknown, expectedLength?: number) {
    const list = Array.isArray(value) ? value.map(item => Number(item)).filter(item => Number.isFinite(item)) : []
    if (!expectedLength) return list
    return Array.from({ length: expectedLength }, (_, index) => list[index] ?? 0)
}
