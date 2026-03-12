import type { FsEntry, SkillEntry } from '../../types'
import type { CreateAvatarRow } from '../workspace/InfoPanel'

const RESERVED_SEID_FIELDS = new Set(['id', 'skillid', 'buffid', 'Skill_ID'])

function shouldPersistSeidProp(propKey: string) {
    return !RESERVED_SEID_FIELDS.has(propKey)
}

export function createEmptySkill(id: number): SkillEntry {
    return {
        id,
        Skill_ID: id,
        Skill_Lv: 0,
        skillEffect: '',
        Skill_Type: 0,
        name: '',
        qingjiaotype: 0,
        seid: [],
        seidData: {},
        Affix: [],
        Affix2: [],
        descr: '',
        TuJiandescr: '',
        Skill_LV: 1,
        AttackType: [],
        typePinJie: 1,
        script: 'SkillAttack',
        HP: 10000,
        speed: 0,
        icon: 0,
        Skill_DisplayType: 0,
        skill_SameCastNum: [],
        skill_CastType: [],
        skill_Cast: [],
        DF: 0,
        TuJianType: 0,
        Skill_Open: 1,
        Skill_castTime: 1,
        canUseDistMax: 30,
        CD: 10000,
    }
}

export function toSkillRows(map: Record<string, SkillEntry>): CreateAvatarRow[] {
    return Object.entries(map)
        .map(([key, value]) => ({
            key,
            id: value.id,
            title: value.name,
            fenLei: String(value.Skill_Type),
            desc: value.descr,
        }))
        .sort((a, b) => a.id - b.id)
}

function cloneSkillMap(source: Record<string, SkillEntry>) {
    const next: Record<string, SkillEntry> = {}
    for (const [key, row] of Object.entries(source)) {
        next[key] = {
            ...row,
            seid: [...row.seid],
            Affix: [...row.Affix],
            Affix2: [...row.Affix2],
            AttackType: [...row.AttackType],
            skill_SameCastNum: [...row.skill_SameCastNum],
            skill_CastType: [...row.skill_CastType],
            skill_Cast: [...row.skill_Cast],
            seidData: JSON.parse(JSON.stringify(row.seidData ?? {})) as Record<string, Record<string, string | number | number[]>>,
        }
    }
    return next
}

export async function loadSkillFiles(params: {
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}) {
    const { modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return {} as Record<string, SkillEntry>
    const dirPath = joinWinPath(modRootPath, 'Data', 'skillJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(dirPath)
    } catch {
        return {} as Record<string, SkillEntry>
    }

    const next: Record<string, SkillEntry> = {}
    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    for (const file of files) {
        try {
            const payload = await readFilePayload(file.path)
            const parsed = JSON.parse(payload.content) as Record<string, unknown>
            const id = Number(parsed.id ?? file.name.replace(/\.json$/i, ''))
            const uniqueId = Number(parsed.Skill_ID ?? parsed.id ?? file.name.replace(/\.json$/i, ''))
            if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(uniqueId) || uniqueId <= 0) continue
            const seidNormalized = normalizeSeidPayload(parsed.seid, parsed.seidData)
            next[String(id)] = {
                id,
                Skill_ID: uniqueId,
                Skill_Lv: Number(parsed.Skill_Lv ?? 1),
                skillEffect: String(parsed.skillEffect ?? ''),
                Skill_Type: Number(parsed.Skill_Type ?? 0),
                name: String(parsed.name ?? ''),
                qingjiaotype: Number(parsed.qingjiaotype ?? 0),
                seid: seidNormalized.ids,
                seidData: seidNormalized.data,
                Affix: Array.isArray(parsed.Affix) ? parsed.Affix.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
                Affix2: Array.isArray(parsed.Affix2) ? parsed.Affix2.map(item => Number(item)).filter(item => Number.isFinite(item)) : [],
                descr: String(parsed.descr ?? ''),
                TuJiandescr: String(parsed.TuJiandescr ?? ''),
                Skill_LV: Number(parsed.Skill_LV ?? 1),
                AttackType: Array.isArray(parsed.AttackType)
                    ? parsed.AttackType.map(item => Number(item)).filter(item => Number.isFinite(item))
                    : [],
                typePinJie: Number(parsed.typePinJie ?? 1),
                script: String(parsed.script ?? 'SkillAttack') === 'SkillSelf' ? 'SkillSelf' : 'SkillAttack',
                HP: Number(parsed.HP ?? 10000),
                speed: Number(parsed.speed ?? 0),
                icon: Number(parsed.icon ?? 0),
                Skill_DisplayType: Number(parsed.Skill_DisplayType ?? 0),
                skill_SameCastNum: Array.isArray(parsed.skill_SameCastNum)
                    ? parsed.skill_SameCastNum.map(item => Number(item)).filter(item => Number.isFinite(item))
                    : [],
                skill_CastType: Array.isArray(parsed.skill_CastType)
                    ? parsed.skill_CastType.map(item => Number(item)).filter(item => Number.isFinite(item))
                    : [],
                skill_Cast: Array.isArray(parsed.skill_Cast)
                    ? parsed.skill_Cast.map(item => Number(item)).filter(item => Number.isFinite(item))
                    : [],
                DF: Number(parsed.DF ?? 0),
                TuJianType: Number(parsed.TuJianType ?? 0),
                Skill_Open: Number(parsed.Skill_Open ?? 1),
                Skill_castTime: Number(parsed.Skill_castTime ?? 1),
                canUseDistMax: Number(parsed.canUseDistMax ?? 30),
                CD: Number(parsed.CD ?? 10000),
            }
        } catch {
            // skip invalid
        }
    }
    return next
}

export async function mergeSkillSeidFiles(params: {
    source: Record<string, SkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    readFilePayload: (filePath: string) => Promise<{ content: string }>
}): Promise<Record<string, SkillEntry>> {
    const { source, modRootPath, joinWinPath, loadProjectEntries, readFilePayload } = params
    if (!modRootPath) return source
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'SkillSeidJsonData')
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(seidDirPath)
    } catch {
        return source
    }
    const files = entries.filter(entry => !entry.is_dir && /\.json$/i.test(entry.name))
    if (files.length === 0) return source

    const next = cloneSkillMap(source)
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

export async function saveSkillFiles(params: {
    skillMap: Record<string, SkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    deleteFilePayload: (filePath: string) => Promise<unknown>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { skillMap, modRootPath, joinWinPath, loadProjectEntries, deleteFilePayload, saveFilePayload } = params
    const dirPath = joinWinPath(modRootPath, 'Data', 'skillJsonData')
    const expectedNames = new Set(Object.values(skillMap).map(row => `${row.id}.json`))
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
    for (const row of Object.values(skillMap)) {
        const filePath = joinWinPath(dirPath, `${row.id}.json`)
        const payload = {
            id: row.id,
            Skill_ID: row.Skill_ID,
            Skill_Lv: row.Skill_Lv,
            skillEffect: row.skillEffect,
            Skill_Type: row.Skill_Type,
            name: row.name,
            qingjiaotype: row.qingjiaotype,
            seid: row.seid,
            Affix: row.Affix,
            Affix2: row.Affix2,
            descr: row.descr,
            TuJiandescr: row.TuJiandescr,
            Skill_LV: row.Skill_LV,
            AttackType: row.AttackType,
            typePinJie: row.typePinJie,
            script: row.script,
            HP: row.HP,
            speed: row.speed,
            icon: row.icon,
            Skill_DisplayType: row.Skill_DisplayType,
            skill_SameCastNum: row.skill_SameCastNum,
            skill_CastType: row.skill_CastType,
            skill_Cast: row.skill_Cast,
            DF: row.DF,
            TuJianType: row.TuJianType,
            Skill_Open: row.Skill_Open,
            Skill_castTime: row.Skill_castTime,
            canUseDistMax: row.canUseDistMax,
            CD: row.CD,
        }
        await saveFilePayload(filePath, `${JSON.stringify(payload, null, 2)}\n`)
    }
    return Object.keys(skillMap).length
}

export async function saveSkillSeidFiles(params: {
    skillMap: Record<string, SkillEntry>
    modRootPath: string
    joinWinPath: (base: string, ...parts: string[]) => string
    loadProjectEntries: (rootPath: string) => Promise<FsEntry[]>
    deleteFilePayload: (filePath: string) => Promise<unknown>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
    skipSeidIds?: number[]
}) {
    const { skillMap, modRootPath, joinWinPath, loadProjectEntries, deleteFilePayload, saveFilePayload, skipSeidIds } = params
    const seidDirPath = joinWinPath(modRootPath, 'Data', 'SkillSeidJsonData')
    const seidFilePayload: Record<string, Record<string, Record<string, unknown>>> = {}
    const skipSeidIdSet = new Set((skipSeidIds ?? []).filter(seidId => Number.isFinite(seidId) && seidId > 0))

    for (const row of Object.values(skillMap)) {
        for (const seidId of row.seid) {
            if (!Number.isFinite(seidId) || seidId <= 0) continue
            if (skipSeidIdSet.has(seidId)) continue
            const seidKey = String(seidId)
            const fileRows = (seidFilePayload[seidKey] ??= {})
            const rowPayload: Record<string, unknown> = { skillid: row.id }
            const cached = row.seidData[seidKey] ?? {}
            for (const [propKey, propValue] of Object.entries(cached)) {
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
