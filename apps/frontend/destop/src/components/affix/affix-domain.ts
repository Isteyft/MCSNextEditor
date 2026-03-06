import type { AffixEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyAffix(id: number): AffixEntry {
    return {
        id,
        name1: '词缀',
        typenum: 0,
        type: 0,
        name2: '',
        descr: '',
    }
}

export function normalizeAffixMap(parsed: unknown): Record<string, AffixEntry> {
    const source = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    const next: Record<string, AffixEntry> = {}
    for (const [key, raw] of Object.entries(source)) {
        if (!raw || typeof raw !== 'object') continue
        const row = raw as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue
        next[String(id)] = {
            id,
            name1: String(row.name1 ?? ''),
            typenum: Number(row.typenum ?? 0),
            type: Number(row.type ?? 0),
            name2: String(row.name2 ?? ''),
            descr: String(row.descr ?? ''),
        }
    }
    return next
}

export function toAffixRows(map: Record<string, AffixEntry>): CreateAvatarRow[] {
    return Object.entries(map)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.name2,
            fenLei: String(value.typenum),
            desc: value.descr,
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveAffixFile(params: {
    affixMap: Record<string, AffixEntry>
    affixPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { affixMap, affixPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(affixMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                {
                    id: row.id,
                    name1: row.name1,
                    typenum: row.typenum,
                    type: row.type,
                    name2: row.name2,
                    descr: row.descr,
                },
            ])
    )
    await saveFilePayload(affixPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(affixMap).length
}
