import { getStaticSkillAttributeLabel } from '../../features/modules/staticskill/static-skill-attribute-options'
import type { FsEntry, StaticSkillEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

const RESERVED_SEID_FIELDS = new Set(['id', 'skillid', 'buffid', 'Skill_ID'])

function shouldPersistSeidProp(propKey: string) {
    return !RESERVED_SEID_FIELDS.has(propKey)
}

export function createEmptyStaticSkill(id: number): StaticSkillEntry {
    return {
        id,
        Skill_ID: id,
        Skill_Lv: 1,
        name: '',
        Affix: [],
        qingjiaotype: 0,
        seid: [],
        seidData: {},
        TuJiandescr: '',
        descr: '',
        AttackType: 0,
        icon: 0,
        Skill_LV: 1,
        typePinJie: 1,
        Skill_castTime: 1,
        Skill_Speed: 0,
        DF: 0,
        TuJianType: 0,
    }
}

export function normalizeStaticSkillMap(raw: unknown): Record<string, StaticSkillEntry> {
    const next: Record<string, StaticSkillEntry> = {}
    if (!raw || typeof raw !== 'object') return next

    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue
        const row = value as Record<string, unknown>
        const id = Number(row.id ?? Number(key))
        const uniqueId = Number(row.Skill_ID ?? id)
        if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(uniqueId) || uniqueId <= 0) continue
        const seidNormalized = normalizeSeidPayload(row.seid, row.seidData)
        next[String(id)] = {
            id,
            Skill_ID: uniqueId,
            Skill_Lv: Number(row.Skill_Lv ?? 1),
            name: String(row.name ?? ''),
            Affix: Array.isArray(row.Affix) ? row.Affix.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
            qingjiaotype: Number(row.qingjiaotype ?? 0),
            seid: seidNormalized.ids,
            seidData: seidNormalized.data,
            TuJiandescr: String(row.TuJiandescr ?? ''),
            descr: String(row.descr ?? ''),
            AttackType: Number(row.AttackType ?? 0),
            icon: Number(row.icon ?? 0),
            Skill_LV: Number(row.Skill_LV ?? 1),
            typePinJie: Number(row.typePinJie ?? 1),
            Skill_castTime: Number(row.Skill_castTime ?? 1),
            Skill_Speed: Number(row.Skill_Speed ?? 0),
            DF: Number(row.DF ?? 0),
            TuJianType: Number(row.TuJianType ?? 0),
        }
    }
    return next
}

export function toStaticSkillRows(
    map: Record<string, StaticSkillEntry>,
    staticSkillAttributeOptions: Array<{ id: number; name: string }> = []
): CreateAvatarRow[] {
    return Object.entries(map)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.name,
            fenLei: getStaticSkillAttributeLabel(Number(value.AttackType ?? 0), staticSkillAttributeOptions),
            desc: value.descr,
        }))
        .sort((a, b) => a.id - b.id)
}

function cloneStaticSkillMap(source: Record<string, StaticSkillEntry>) {
    const next: Record<string, StaticSkillEntry> = {}
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

export async function mergeStaticSkillSeidFiles(params: {
    source: Record<string, StaticSkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}): Promise<Record<string, StaticSkillEntry>> {
    const { source, modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return source
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'StaticSkillSeidJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(seidDirPath)
    } catch {
        return source
    }

    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    if (files.length === 0) return source

    const next = cloneStaticSkillMap(source)
    for (const file of files) {
        const seidId = Number(file.name.replace(/\.json$/i, ''))
        if (!Number.isFinite(seidId) || seidId <= 0) continue
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, Record<string, unknown>>
            for (const [skillKey, rawValue] of Object.entries(parsed)) {
                if (!rawValue || typeof rawValue !== 'object') continue
                const row = rawValue as Record<string, unknown>
                const staticId = Number(row.skillid ?? row.id ?? Number(skillKey))
                if (!Number.isFinite(staticId) || staticId <= 0) continue
                const target = next[String(staticId)]
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

export async function saveStaticSkillFile(params: {
    staticSkillMap: Record<string, StaticSkillEntry>
    staticSkillPath: string
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { staticSkillMap, staticSkillPath, saveFilePayload } = params
    const payload = Object.fromEntries(Object.values(staticSkillMap).map(row => [String(row.id), row]))
    await saveFilePayload(staticSkillPath, `${JSON.stringify(payload, null, 2)}\n`)
    return Object.keys(staticSkillMap).length
}

export async function saveStaticSkillSeidFiles(params: {
    staticSkillMap: Record<string, StaticSkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    deleteFilePayload: (filePath: string) => Promise<unknown>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { staticSkillMap, modRootPath, joinWinPath, loadProjectEntries, deleteFilePayload, saveFilePayload } = params
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'StaticSkillSeidJsonData')
    const seidFilePayload: Record<string, Record<string, Record<string, unknown>>> = {}
    for (const row of Object.values(staticSkillMap)) {
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
