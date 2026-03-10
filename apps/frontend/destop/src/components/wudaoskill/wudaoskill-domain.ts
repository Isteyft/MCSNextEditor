import type { FsEntry, WuDaoSkillEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

const RESERVED_SEID_FIELDS = new Set(['id', 'skillid', 'buffid', 'Skill_ID'])

function shouldPersistSeidProp(propKey: string) {
    return !RESERVED_SEID_FIELDS.has(propKey)
}

export function createEmptyWuDaoSkill(id: number): WuDaoSkillEntry {
    return {
        id,
        icon: String(id),
        name: '',
        Cast: 0,
        Type: [],
        Lv: 1,
        seid: [],
        seidData: {},
        desc: '',
        xiaoguo: '',
        CanForget: 0,
    }
}

export function normalizeWuDaoSkillMap(raw: unknown): Record<string, WuDaoSkillEntry> {
    const next: Record<string, WuDaoSkillEntry> = {}
    if (!raw || typeof raw !== 'object') return next

    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue
        const row = value as Record<string, unknown>
        const id = Number(row.id ?? Number(key))
        if (!Number.isFinite(id) || id <= 0) continue
        const seidNormalized = normalizeSeidPayload(row.seid, row.seidData)
        next[String(id)] = {
            id,
            icon: String(row.icon ?? String(id)),
            name: String(row.name ?? ''),
            Cast: Number(row.Cast ?? 0),
            Type: Array.isArray(row.Type) ? row.Type.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
            Lv: Number(row.Lv ?? 1),
            seid: seidNormalized.ids,
            seidData: seidNormalized.data,
            desc: String(row.desc ?? ''),
            xiaoguo: String(row.xiaoguo ?? ''),
            CanForget: Number(row.CanForget ?? 0),
        }
    }

    return next
}

export function toWuDaoSkillRows(map: Record<string, WuDaoSkillEntry> | null | undefined): CreateAvatarRow[] {
    const source = map && typeof map === 'object' ? map : {}
    return Object.entries(source)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.name,
            fenLei: value.Type.join(','),
            desc: value.desc || value.xiaoguo,
        }))
        .sort((a, b) => a.id - b.id)
}

function cloneWuDaoSkillMap(source: Record<string, WuDaoSkillEntry>) {
    const next: Record<string, WuDaoSkillEntry> = {}
    for (const [key, row] of Object.entries(source)) {
        next[key] = {
            ...row,
            Type: [...row.Type],
            seid: [...row.seid],
            seidData: JSON.parse(JSON.stringify(row.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }
    return next
}

export async function mergeWuDaoSkillSeidFiles(params: {
    source: Record<string, WuDaoSkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}): Promise<Record<string, WuDaoSkillEntry>> {
    const { source, modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return source
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'WuDaoSeidJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(seidDirPath)
    } catch {
        return source
    }

    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    if (files.length === 0) return source

    const next = cloneWuDaoSkillMap(source)
    for (const file of files) {
        const seidId = Number(file.name.replace(/\.json$/i, ''))
        if (!Number.isFinite(seidId) || seidId <= 0) continue
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, Record<string, unknown>>
            for (const [skillKey, rawValue] of Object.entries(parsed)) {
                if (!rawValue || typeof rawValue !== 'object') continue
                const row = rawValue as Record<string, unknown>
                const skillId = Number(row.skillid ?? row.id ?? Number(skillKey))
                if (!Number.isFinite(skillId) || skillId <= 0) continue
                const target = next[String(skillId)]
                if (!target) continue
                if (!target.seid.includes(seidId)) target.seid.push(seidId)
                const dataKey = String(seidId)
                const dataRow = { ...(target.seidData[dataKey] ?? {}) }
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
                target.seidData[dataKey] = dataRow
            }
        } catch {
            // skip invalid
        }
    }
    return next
}

export async function saveWuDaoSkillFile(params: {
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    wudaoSkillPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { wudaoSkillMap, wudaoSkillPath, saveFilePayload } = params
    const payload = Object.fromEntries(
        Object.values(wudaoSkillMap)
            .sort((a, b) => a.id - b.id)
            .map(row => [
                String(row.id),
                {
                    id: row.id,
                    icon: row.icon,
                    name: row.name,
                    Cast: row.Cast,
                    Type: row.Type,
                    Lv: row.Lv,
                    seid: row.seid,
                    desc: row.desc,
                    xiaoguo: row.xiaoguo,
                    CanForget: row.CanForget,
                },
            ])
    )
    await saveFilePayload(wudaoSkillPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(wudaoSkillMap).length
}

export async function saveWuDaoSkillSeidFiles(params: {
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    deleteFilePayload: (filePath: string) => Promise<unknown>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { wudaoSkillMap, modRootPath, joinWinPath, loadProjectEntries, deleteFilePayload, saveFilePayload } = params
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'WuDaoSeidJsonData')
    const seidFilePayload: Record<string, Record<string, Record<string, unknown>>> = {}
    for (const row of Object.values(wudaoSkillMap)) {
        for (const seidId of row.seid) {
            if (!Number.isFinite(seidId) || seidId <= 0) continue
            const seidKey = String(seidId)
            const fileRows = (seidFilePayload[seidKey] ??= {})
            const rowPayload: Record<string, unknown> = { skillid: row.id }
            const cachedProps = row.seidData[seidKey] ?? {}
            for (const [propKey, propValue] of Object.entries(cachedProps)) {
                if (!shouldPersistSeidProp(propKey)) continue
                rowPayload[propKey] = propValue
            }
            fileRows[String(row.id)] = rowPayload
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
