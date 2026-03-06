import type { FsEntry, ItemEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

export function createEmptyItem(id: number): ItemEntry {
    return {
        id,
        ItemIcon: 0,
        maxNum: 1,
        name: '',
        FaBaoType: '',
        Affix: [],
        TuJianType: 0,
        ShopType: 0,
        ItemFlag: [],
        WuWeiType: 0,
        ShuXingType: 0,
        type: 0,
        quality: 0,
        typePinJie: 0,
        StuTime: 0,
        seid: [],
        seidData: {},
        vagueType: 0,
        price: 0,
        desc: '',
        desc2: '',
        CanSale: 1,
        DanDu: 0,
        CanUse: 0,
        NPCCanUse: 0,
        yaoZhi1: 0,
        yaoZhi2: 0,
        yaoZhi3: 0,
        wuDao: [],
    }
}

export function toItemRows(map: Record<string, ItemEntry>): CreateAvatarRow[] {
    return Object.entries(map)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.name,
            fenLei: String(value.type),
            desc: value.desc,
        }))
        .sort((a, b) => a.id - b.id)
}

function cloneItemMap(source: Record<string, ItemEntry>) {
    const next: Record<string, ItemEntry> = {}
    for (const [key, row] of Object.entries(source)) {
        next[key] = {
            ...row,
            Affix: [...row.Affix],
            ItemFlag: [...row.ItemFlag],
            wuDao: [...row.wuDao],
            seid: [...row.seid],
            seidData: JSON.parse(JSON.stringify(row.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }
    return next
}

export async function loadItemFiles(params: {
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}) {
    const { modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return {} as Record<string, ItemEntry>
    const dirPath = joinWinPath(modRootPath, 'Data', 'ItemJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(dirPath)
    } catch {
        return {} as Record<string, ItemEntry>
    }

    const next: Record<string, ItemEntry> = {}
    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    for (const file of files) {
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, unknown>
            const id = Number(parsed.id ?? file.name.replace(/\.json$/i, ''))
            if (!Number.isFinite(id) || id <= 0) continue
            const seidNormalized = normalizeSeidPayload(parsed.seid, parsed.seidData)
            next[String(id)] = {
                id,
                ItemIcon: Number(parsed.ItemIcon ?? 0),
                maxNum: Number(parsed.maxNum ?? 1),
                name: String(parsed.name ?? ''),
                FaBaoType: String(parsed.FaBaoType ?? ''),
                Affix: Array.isArray(parsed.Affix) ? parsed.Affix.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
                TuJianType: Number(parsed.TuJianType ?? 0),
                ShopType: Number(parsed.ShopType ?? 0),
                ItemFlag: Array.isArray(parsed.ItemFlag)
                    ? parsed.ItemFlag.map(item => Number(item)).filter(item => Number.isFinite(item))
                    : [],
                WuWeiType: Number(parsed.WuWeiType ?? 0),
                ShuXingType: Number(parsed.ShuXingType ?? 0),
                type: Number(parsed.type ?? 0),
                quality: Number(parsed.quality ?? 0),
                typePinJie: Number(parsed.typePinJie ?? 0),
                StuTime: Number(parsed.StuTime ?? 0),
                seid: seidNormalized.ids,
                seidData: seidNormalized.data,
                vagueType: Number(parsed.vagueType ?? 0),
                price: Number(parsed.price ?? 0),
                desc: String(parsed.desc ?? ''),
                desc2: String(parsed.desc2 ?? ''),
                CanSale: Number(parsed.CanSale ?? 1),
                DanDu: Number(parsed.DanDu ?? 0),
                CanUse: Number(parsed.CanUse ?? 0),
                NPCCanUse: Number(parsed.NPCCanUse ?? 0),
                yaoZhi1: Number(parsed.yaoZhi1 ?? 0),
                yaoZhi2: Number(parsed.yaoZhi2 ?? 0),
                yaoZhi3: Number(parsed.yaoZhi3 ?? 0),
                wuDao: Array.isArray(parsed.wuDao) ? parsed.wuDao.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
            }
        } catch {
            // skip invalid
        }
    }
    return next
}

export async function mergeItemSeidFiles(params: {
    source: Record<string, ItemEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}): Promise<Record<string, ItemEntry>> {
    const { source, modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return source
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'ItemsSeidJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(seidDirPath)
    } catch {
        return source
    }
    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    if (files.length === 0) return source
    const next = cloneItemMap(source)
    for (const file of files) {
        const seidId = Number(file.name.replace(/\.json$/i, ''))
        if (!Number.isFinite(seidId) || seidId <= 0) continue
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, Record<string, unknown>>
            for (const [itemKey, rawValue] of Object.entries(parsed)) {
                if (!rawValue || typeof rawValue !== 'object') continue
                const row = rawValue as Record<string, unknown>
                const itemId = Number(row.id ?? Number(itemKey))
                if (!Number.isFinite(itemId) || itemId <= 0) continue
                const target = next[String(itemId)]
                if (!target) continue
                if (!target.seid.includes(seidId)) target.seid.push(seidId)
                const dataKey = String(seidId)
                const dataRow = { ...(target.seidData[dataKey] ?? {}) }
                for (const [propKey, propValue] of Object.entries(row)) {
                    if (propKey === 'id') continue
                    if (Array.isArray(propValue)) {
                        const numbers = propValue.map(item => Number(item))
                        dataRow[propKey] = numbers.every(item => Number.isFinite(item)) ? numbers : String(propValue.join(','))
                    } else if (typeof propValue === 'number') {
                        dataRow[propKey] = propValue
                    } else {
                        dataRow[propKey] = String(propValue ?? '')
                    }
                }
                target.seidData[dataKey] = dataRow
            }
        } catch {
            // skip invalid
        }
    }
    return next
}

export async function saveItemFiles(params: {
    itemMap: Record<string, ItemEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { itemMap, modRootPath, joinWinPath, saveFilePayload } = params
    const dirPath = joinWinPath(modRootPath, 'Data', 'ItemJsonData')
    for (const row of Object.values(itemMap)) {
        const filePath = joinWinPath(dirPath, `${row.id}.json`)
        const payload = {
            id: row.id,
            ItemIcon: row.ItemIcon,
            maxNum: row.maxNum,
            name: row.name,
            FaBaoType: row.FaBaoType,
            Affix: row.Affix,
            TuJianType: row.TuJianType,
            ShopType: row.ShopType,
            ItemFlag: row.ItemFlag,
            WuWeiType: row.WuWeiType,
            ShuXingType: row.ShuXingType,
            type: row.type,
            quality: row.quality,
            typePinJie: row.typePinJie,
            StuTime: row.StuTime,
            seid: row.seid,
            vagueType: row.vagueType,
            price: row.price,
            desc: row.desc,
            desc2: row.desc2,
            CanSale: row.CanSale,
            DanDu: row.DanDu,
            CanUse: row.CanUse,
            NPCCanUse: row.NPCCanUse,
            yaoZhi1: row.yaoZhi1,
            yaoZhi2: row.yaoZhi2,
            yaoZhi3: row.yaoZhi3,
            wuDao: row.wuDao,
        }
        await saveFilePayload(filePath, `${JSON.stringify(payload, null, 2)}\n`)
    }
    return Object.keys(itemMap).length
}

export async function saveItemSeidFiles(params: {
    itemMap: Record<string, ItemEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { itemMap, modRootPath, joinWinPath, saveFilePayload } = params
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'ItemsSeidJsonData')
    const seidFilePayload: Record<string, Record<string, Record<string, unknown>>> = {}
    for (const row of Object.values(itemMap)) {
        for (const seidId of row.seid) {
            if (!Number.isFinite(seidId) || seidId <= 0) continue
            const seidKey = String(seidId)
            const fileRows = (seidFilePayload[seidKey] ??= {})
            const rowPayload: Record<string, unknown> = { id: row.id }
            const cached = row.seidData[seidKey] ?? {}
            for (const [propKey, propValue] of Object.entries(cached)) {
                rowPayload[propKey] = propValue
            }
            fileRows[String(row.id)] = rowPayload
        }
    }
    for (const [seidKey, fileRows] of Object.entries(seidFilePayload)) {
        const filePath = joinWinPath(seidDirPath, `${seidKey}.json`)
        await saveFilePayload(filePath, `${JSON.stringify(fileRows, null, 2)}\n`)
    }
    return Object.keys(seidFilePayload).length
}

function normalizeSeidPayload(
    rawSeid: unknown,
    rawSeidData: unknown
): { ids: number[]; data: Record<string, Record<string, string | number | number[]>> } {
    const ids: number[] = []
    const data: Record<string, Record<string, string | number | number[]>> = {}
    const idSet = new Set<number>()
    const addId = (id: number) => {
        if (!Number.isFinite(id) || id <= 0 || idSet.has(id)) return
        idSet.add(id)
        ids.push(id)
    }

    if (Array.isArray(rawSeid)) {
        for (const item of rawSeid) {
            if (typeof item === 'number' || typeof item === 'string') addId(Number(item))
        }
    }
    if (rawSeidData && typeof rawSeidData === 'object') {
        for (const [rawId, rawValue] of Object.entries(rawSeidData as Record<string, unknown>)) {
            const id = Number(rawId)
            if (!Number.isFinite(id) || id <= 0 || !rawValue || typeof rawValue !== 'object') continue
            addId(id)
            const key = String(id)
            const current = { ...(data[key] ?? {}) }
            for (const [k, v] of Object.entries(rawValue as Record<string, unknown>)) {
                if (Array.isArray(v)) {
                    const nums = v.map(n => Number(n))
                    current[k] = nums.every(n => Number.isFinite(n)) ? nums : String(v.join(','))
                } else if (typeof v === 'number') {
                    current[k] = v
                } else {
                    current[k] = String(v ?? '')
                }
            }
            data[key] = current
        }
    }
    return { ids, data }
}
