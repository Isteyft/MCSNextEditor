import type { NpcWuDaoEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

const VALUE_KEYS = [
    'value1',
    'value2',
    'value3',
    'value4',
    'value5',
    'value6',
    'value7',
    'value8',
    'value9',
    'value10',
    'value11',
    'value12',
] as const satisfies Array<keyof NpcWuDaoEntry>

const FIXED_VALUE_INDEXES = new Set(VALUE_KEYS.map(key => Number(String(key).replace('value', ''))))

export type NpcWuDaoRuntimeEntry = NpcWuDaoEntry & {
    __extraValues?: Record<string, number>
}

export function createEmptyNpcWuDao(id: number): NpcWuDaoEntry {
    return {
        id,
        Type: 0,
        lv: 1,
        wudaoID: [],
        value1: 0,
        value2: 0,
        value3: 0,
        value4: 0,
        value5: 0,
        value6: 0,
        value7: 0,
        value8: 0,
        value9: 0,
        value10: 0,
        value11: 0,
        value12: 0,
    }
}

export function normalizeNpcWuDaoMap(raw: unknown): Record<string, NpcWuDaoEntry> {
    const next: Record<string, NpcWuDaoEntry> = {}
    if (!raw || typeof raw !== 'object') return next

    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue
        const row = value as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue
        const entry = createEmptyNpcWuDao(id)
        entry.Type = Number(row.Type ?? 0)
        entry.lv = Number(row.lv ?? 1)
        entry.wudaoID = Array.isArray(row.wudaoID)
            ? row.wudaoID.map(item => Number(item)).filter(item => Number.isFinite(item) && item > 0)
            : []
        VALUE_KEYS.forEach(valueKey => {
            entry[valueKey] = Number(row[valueKey] ?? 0)
        })
        const extraValues = extractNpcWuDaoExtraValues(row)
        next[String(id)] = Object.keys(extraValues).length > 0 ? ({ ...entry, __extraValues: extraValues } as NpcWuDaoRuntimeEntry) : entry
    }

    return next
}

export function extractNpcWuDaoExtraValues(raw: Record<string, unknown>): Record<string, number> {
    const next: Record<string, number> = {}
    for (const [key, value] of Object.entries(raw)) {
        const match = /^value(\d+)$/.exec(key)
        if (!match) continue
        const valueIndex = Number(match[1])
        if (!Number.isFinite(valueIndex) || valueIndex <= 0 || FIXED_VALUE_INDEXES.has(valueIndex)) continue
        next[String(valueIndex)] = Number(value ?? 0)
    }
    return next
}

export function getNpcWuDaoExtraValues(entry: NpcWuDaoEntry | null | undefined): Record<string, number> {
    const runtime = entry as NpcWuDaoRuntimeEntry | null | undefined
    return runtime?.__extraValues ? { ...runtime.__extraValues } : {}
}

export function toNpcWuDaoRows(map: Record<string, NpcWuDaoEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: `绫诲瀷 ${value.Type}`,
            fenLei: `澧冪晫 ${value.lv}`,
            desc: value.wudaoID.join(','),
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveNpcWuDaoFile(params: {
    npcWuDaoMap: Record<string, NpcWuDaoEntry>
    npcWuDaoPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { npcWuDaoMap, npcWuDaoPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(npcWuDaoMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                (() => {
                    const runtimeRow = row as NpcWuDaoRuntimeEntry
                    const payload: Record<string, number | number[]> = {
                        id: row.id,
                        Type: row.Type,
                        lv: row.lv,
                        wudaoID: row.wudaoID,
                        value1: row.value1,
                        value2: row.value2,
                        value3: row.value3,
                        value4: row.value4,
                        value5: row.value5,
                        value6: row.value6,
                        value7: row.value7,
                        value8: row.value8,
                        value9: row.value9,
                        value10: row.value10,
                        value11: row.value11,
                        value12: row.value12,
                    }
                    for (const [valueIndex, value] of Object.entries(runtimeRow.__extraValues ?? {})) {
                        payload[`value${valueIndex}`] = Number(value ?? 0)
                    }
                    return payload
                })(),
            ])
    )
    await saveFilePayload(npcWuDaoPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(npcWuDaoMap).length
}
