import type { WuDaoEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyWuDao(id: number): WuDaoEntry {
    return {
        id,
        name: '',
        name1: '',
    }
}

export function normalizeWuDaoMap(parsed: unknown): Record<string, WuDaoEntry> {
    let source: Record<string, unknown> = {}
    if (Array.isArray(parsed)) {
        source = Object.fromEntries(parsed.map((item, index) => [String(index), item]))
    } else if (parsed && typeof parsed === 'object') {
        const rawObject = parsed as Record<string, unknown>
        const firstArray = Object.values(rawObject).find(value => Array.isArray(value))
        if (Array.isArray(firstArray)) {
            source = Object.fromEntries(firstArray.map((item, index) => [String(index), item]))
        } else {
            source = rawObject
        }
    }
    const next: Record<string, WuDaoEntry> = {}
    for (const [key, raw] of Object.entries(source)) {
        if (!raw || typeof raw !== 'object') continue
        const row = raw as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue
        next[String(id)] = {
            id,
            name: String(row.name ?? row.Title ?? row.title ?? ''),
            name1: String(row.name1 ?? row.fenLei ?? row.typeName ?? ''),
        }
    }
    return next
}

export function toWuDaoRows(map: Record<string, WuDaoEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.name,
            fenLei: value.name1,
            desc: value.name1,
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveWuDaoFile(params: {
    wudaoMap: Record<string, WuDaoEntry>
    wudaoPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { wudaoMap, wudaoPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(wudaoMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                {
                    id: row.id,
                    name: row.name,
                    name1: row.name1,
                },
            ])
    )
    await saveFilePayload(wudaoPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(wudaoMap).length
}
