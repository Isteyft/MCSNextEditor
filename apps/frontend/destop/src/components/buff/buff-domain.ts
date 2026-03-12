import type { BuffEntry, FsEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

const RESERVED_SEID_FIELDS = new Set(['id', 'skillid', 'buffid', 'Skill_ID'])

function shouldPersistSeidProp(propKey: string) {
    return !RESERVED_SEID_FIELDS.has(propKey)
}

export function createEmptyBuff(id: number): BuffEntry {
    return {
        buffid: id,
        BuffIcon: 0,
        skillEffect: '',
        name: '',
        Affix: [],
        bufftype: 0,
        seid: [],
        seidData: {},
        descr: '',
        trigger: 0,
        removeTrigger: 0,
        script: 'Buff',
        looptime: 1,
        totaltime: 1,
        BuffType: 0,
        isHide: 0,
        ShowOnlyOne: 0,
    }
}

export function toBuffRows(map: Record<string, BuffEntry>): CreateAvatarRow[] {
    return Object.entries(map)
        .map(([key, value]) => ({
            key,
            id: value.buffid,
            title: value.name,
            fenLei: String(value.bufftype),
            desc: value.descr,
        }))
        .sort((a, b) => a.id - b.id)
}

export function cloneBuffMap(source: Record<string, BuffEntry>) {
    const next: Record<string, BuffEntry> = {}
    for (const [key, row] of Object.entries(source)) {
        next[key] = {
            ...row,
            Affix: [...row.Affix],
            seid: [...row.seid],
            seidData: JSON.parse(JSON.stringify(row.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }
    return next
}

export async function loadBuffFiles(params: {
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}) {
    const { modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return {} as Record<string, BuffEntry>
    const dirPath = joinWinPath(modRootPath, 'Data', 'BuffJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(dirPath)
    } catch {
        return {} as Record<string, BuffEntry>
    }

    const next: Record<string, BuffEntry> = {}
    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    for (const file of files) {
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, unknown>
            const id = Number(parsed.buffid ?? file.name.replace(/\.json$/i, ''))
            if (!Number.isFinite(id) || id <= 0) continue
            const seidNormalized = normalizeSeidPayload(parsed.seid, parsed.seidData)
            next[String(id)] = {
                buffid: id,
                BuffIcon: Number(parsed.BuffIcon ?? 0),
                skillEffect: String(parsed.skillEffect ?? ''),
                name: String(parsed.name ?? ''),
                Affix: Array.isArray(parsed.Affix) ? parsed.Affix.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
                bufftype: Number(parsed.bufftype ?? 0),
                seid: seidNormalized.ids,
                seidData: seidNormalized.data,
                descr: String(parsed.descr ?? ''),
                trigger: Number(parsed.trigger ?? 0),
                removeTrigger: Number(parsed.removeTrigger ?? 0),
                script: String(parsed.script ?? 'Buff'),
                looptime: Number(parsed.looptime ?? 1),
                totaltime: Number(parsed.totaltime ?? 1),
                BuffType: Number(parsed.BuffType ?? 0),
                isHide: Number(parsed.isHide ?? 0),
                ShowOnlyOne: Number(parsed.ShowOnlyOne ?? 0),
            }
        } catch {
            // skip broken file
        }
    }

    return next
}

export async function mergeBuffSeidFiles(params: {
    source: Record<string, BuffEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}): Promise<Record<string, BuffEntry>> {
    const { source, modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return source
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'BuffSeidJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(seidDirPath)
    } catch {
        return source
    }

    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    if (files.length === 0) return source

    const next = cloneBuffMap(source)
    for (const file of files) {
        const seidId = Number(file.name.replace(/\.json$/i, ''))
        if (!Number.isFinite(seidId) || seidId <= 0) continue
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, Record<string, unknown>>
            for (const [buffKey, rawValue] of Object.entries(parsed)) {
                if (!rawValue || typeof rawValue !== 'object') continue
                const row = rawValue as Record<string, unknown>
                const buffId = Number(row.id ?? row.buffid ?? Number(buffKey))
                if (!Number.isFinite(buffId) || buffId <= 0) continue
                const target = next[String(buffId)]
                if (!target) continue

                if (!target.seid.includes(seidId)) target.seid.push(seidId)
                const seidDataKey = String(seidId)
                const dataRow = { ...(target.seidData[seidDataKey] ?? {}) }
                for (const [propKey, propValue] of Object.entries(row)) {
                    if (!shouldPersistSeidProp(propKey)) continue
                    if (Array.isArray(propValue)) {
                        const numbers = propValue.map(item => Number(item))
                        dataRow[propKey] = numbers.every(item => Number.isFinite(item)) ? numbers : String(propValue.join(','))
                    } else if (typeof propValue === 'number') {
                        dataRow[propKey] = propValue
                    } else {
                        dataRow[propKey] = String(propValue ?? '')
                    }
                }
                target.seidData[seidDataKey] = dataRow
            }
        } catch {
            // skip broken file
        }
    }

    return next
}

export async function saveBuffFiles(params: {
    buffMap: Record<string, BuffEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    deleteFilePayload: (filePath: string) => Promise<unknown>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { buffMap, modRootPath, joinWinPath, loadProjectEntries, deleteFilePayload, saveFilePayload } = params
    const dirPath = joinWinPath(modRootPath, 'Data', 'BuffJsonData')
    const expectedNames = new Set(Object.values(buffMap).map(row => `${row.buffid}.json`))
    try {
        const entries = await loadProjectEntries(dirPath)
        for (const entry of entries) {
            if (entry.is_dir || !/\.json$/i.test(entry.name)) continue
            if (expectedNames.has(entry.name)) continue
            await deleteFilePayload(entry.path)
        }
    } catch {
        // ignore cleanup failures
    }
    for (const row of Object.values(buffMap)) {
        const filePath = joinWinPath(dirPath, `${row.buffid}.json`)
        const payload = {
            buffid: row.buffid,
            BuffIcon: row.BuffIcon,
            skillEffect: row.skillEffect,
            name: row.name,
            Affix: row.Affix,
            bufftype: row.bufftype,
            seid: row.seid,
            descr: row.descr,
            trigger: row.trigger,
            removeTrigger: row.removeTrigger,
            script: row.script,
            looptime: row.looptime,
            totaltime: row.totaltime,
            BuffType: row.BuffType,
            isHide: row.isHide,
            ShowOnlyOne: row.ShowOnlyOne,
        }
        await saveFilePayload(filePath, `${JSON.stringify(payload, null, 2)}\n`)
    }
    return Object.keys(buffMap).length
}

export async function saveBuffSeidFiles(params: {
    buffMap: Record<string, BuffEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    deleteFilePayload: (filePath: string) => Promise<unknown>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
    skipSeidIds?: number[]
}) {
    const { buffMap, modRootPath, joinWinPath, loadProjectEntries, deleteFilePayload, saveFilePayload, skipSeidIds } = params
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'BuffSeidJsonData')
    const seidFilePayload: Record<string, Record<string, Record<string, unknown>>> = {}
    const skipSeidIdSet = new Set((skipSeidIds ?? []).filter(seidId => Number.isFinite(seidId) && seidId > 0))

    for (const row of Object.values(buffMap)) {
        for (const seidId of row.seid) {
            if (!Number.isFinite(seidId) || seidId <= 0) continue
            if (skipSeidIdSet.has(seidId)) continue
            const seidKey = String(seidId)
            const fileRows = (seidFilePayload[seidKey] ??= {})
            const rowPayload: Record<string, unknown> = { id: row.buffid }
            const cached = row.seidData[seidKey] ?? {}
            for (const [propKey, propValue] of Object.entries(cached)) {
                if (!shouldPersistSeidProp(propKey)) continue
                rowPayload[propKey] = propValue
            }
            fileRows[String(row.buffid)] = rowPayload
        }
    }

    const expectedNames = new Set(Object.keys(seidFilePayload).map(seidKey => `${seidKey}.json`))
    try {
        const entries = await loadProjectEntries(seidDirPath)
        for (const entry of entries) {
            if (entry.is_dir || !/\.json$/i.test(entry.name)) continue
            if (expectedNames.has(entry.name)) continue
            await deleteFilePayload(entry.path)
        }
    } catch {
        // ignore cleanup failures
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
            if (typeof item === 'number' || typeof item === 'string') {
                addId(Number(item))
            }
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
