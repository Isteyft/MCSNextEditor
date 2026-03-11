import type { BackpackEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyBackpack(id: number): BackpackEntry {
    return {
        id,
        AvatrID: 0,
        BackpackName: '',
        Type: 0,
        quality: 0,
        ItemID: [],
        randomNum: [],
        CanSell: 1,
        SellPercent: 100,
        CanDrop: 1,
    }
}

export function normalizeBackpackMap(parsed: unknown): Record<string, BackpackEntry> {
    const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    const next: Record<string, BackpackEntry> = {}

    for (const [key, raw] of Object.entries(source)) {
        if (!raw || typeof raw !== 'object') continue
        const row = raw as Record<string, unknown>
        const id = Number(row.id ?? key)
        if (!Number.isFinite(id) || id <= 0) continue

        const itemIds = normalizeNumberArray(row.ItemID)
        const quantities = normalizeNumberArray(row.randomNum)
        const size = Math.max(itemIds.length, quantities.length)

        next[String(id)] = {
            id,
            AvatrID: Number(row.AvatrID ?? row.AvatarID ?? 0),
            BackpackName: String(row.BackpackName ?? ''),
            Type: Number(row.Type ?? 0),
            quality: Number(row.quality ?? 0),
            ItemID: Array.from({ length: size }, (_, index) => itemIds[index] ?? 0),
            randomNum: Array.from({ length: size }, (_, index) => quantities[index] ?? 1),
            CanSell: Number(row.CanSell ?? 1),
            SellPercent: Number(row.SellPercent ?? 100),
            CanDrop: Number(row.CanDrop ?? 1),
        }
    }

    return next
}

export function toBackpackRows(map: Record<string, BackpackEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.BackpackName.trim() || String(value.id),
            fenLei: String(value.AvatrID || 0),
            desc: `物品 ${value.ItemID.length} 个 / 可售 ${value.CanSell === 1 ? '是' : '否'}`,
        }))
        .sort((a, b) => a.id - b.id)
}

export async function saveBackpackFile(params: {
    backpackMap: Record<string, BackpackEntry>
    backpackPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { backpackMap, backpackPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(backpackMap)
            .sort((a, b) => a.id - b.id)
            .map(row => {
                const size = Math.max(row.ItemID.length, row.randomNum.length)
                const itemIds = Array.from({ length: size }, (_, index) => Number(row.ItemID[index] ?? 0))
                const quantities = Array.from({ length: size }, (_, index) => Number(row.randomNum[index] ?? 1)).map(item =>
                    Number.isFinite(item) ? item : 1
                )
                return [
                    String(row.id),
                    {
                        id: row.id,
                        AvatrID: row.AvatrID,
                        BackpackName: row.BackpackName,
                        Type: row.Type,
                        quality: row.quality,
                        ItemID: itemIds,
                        randomNum: quantities,
                        CanSell: row.CanSell,
                        SellPercent: row.SellPercent,
                        CanDrop: row.CanDrop,
                    },
                ]
            })
    )
    await saveFilePayload(backpackPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(backpackMap).length
}

function normalizeNumberArray(value: unknown) {
    return Array.isArray(value) ? value.map(item => Number(item)).filter(item => Number.isFinite(item)) : []
}
