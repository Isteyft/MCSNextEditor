import type { NpcImportantEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyNpcImportant(id: number): NpcImportantEntry {
    return {
        id,
        LiuPai: 0,
        level: 0,
        sex: 0,
        zizhi: 0,
        wuxing: 0,
        nianling: 0,
        XingGe: 0,
        ChengHao: 0,
        NPCTag: 0,
        ZhuJiTime: '',
        JinDanTime: '',
        YuanYingTime: '',
        HuaShengTime: '',
        DaShiXiong: 0,
        ZhangMeng: 0,
        ZhangLao: 0,
        EventValue: [],
        fuhao: '',
    }
}

export function normalizeNpcImportantMap(parsed: unknown): Record<string, NpcImportantEntry> {
    const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    const next: Record<string, NpcImportantEntry> = {}

    for (const [key, raw] of Object.entries(source)) {
        if (!raw || typeof raw !== 'object') continue
        const row = raw as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue

        next[String(id)] = {
            id,
            LiuPai: Number(row.LiuPai ?? 0),
            level: Number(row.level ?? 0),
            sex: Number(row.sex ?? 0),
            zizhi: Number(row.zizhi ?? 0),
            wuxing: Number(row.wuxing ?? 0),
            nianling: Number(row.nianling ?? 0),
            XingGe: Number(row.XingGe ?? 0),
            ChengHao: Number(row.ChengHao ?? 0),
            NPCTag: Number(row.NPCTag ?? 0),
            ZhuJiTime: String(row.ZhuJiTime ?? ''),
            JinDanTime: String(row.JinDanTime ?? ''),
            YuanYingTime: String(row.YuanYingTime ?? ''),
            HuaShengTime: String(row.HuaShengTime ?? ''),
            DaShiXiong: Number(row.DaShiXiong ?? 0),
            ZhangMeng: Number(row.ZhangMeng ?? 0),
            ZhangLao: Number(row.ZhangLao ?? 0),
            EventValue: normalizeNumberArray(row.EventValue),
            fuhao: String(row.fuhao ?? ''),
        }
    }

    return next
}

export function toNpcImportantRows(map: Record<string, NpcImportantEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: `流派 ${value.LiuPai}`,
            fenLei: `境界 ${value.level} / 性别 ${value.sex}`,
            desc: `资质 ${value.zizhi} / 悟性 ${value.wuxing} / 年龄 ${value.nianling}`,
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveNpcImportantFile(params: {
    npcImportantMap: Record<string, NpcImportantEntry>
    npcImportantPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { npcImportantMap, npcImportantPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(npcImportantMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                {
                    id: row.id,
                    LiuPai: row.LiuPai,
                    level: row.level,
                    sex: row.sex,
                    zizhi: row.zizhi,
                    wuxing: row.wuxing,
                    nianling: row.nianling,
                    XingGe: row.XingGe,
                    ChengHao: row.ChengHao,
                    NPCTag: row.NPCTag,
                    ZhuJiTime: row.ZhuJiTime,
                    JinDanTime: row.JinDanTime,
                    YuanYingTime: row.YuanYingTime,
                    HuaShengTime: row.HuaShengTime,
                    DaShiXiong: row.DaShiXiong,
                    ZhangMeng: row.ZhangMeng,
                    ZhangLao: row.ZhangLao,
                    EventValue: row.EventValue,
                    fuhao: row.fuhao,
                },
            ])
    )
    await saveFilePayload(npcImportantPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(npcImportantMap).length
}

function normalizeNumberArray(value: unknown) {
    return Array.isArray(value) ? value.map(item => Number(item)).filter(item => Number.isFinite(item)) : []
}
