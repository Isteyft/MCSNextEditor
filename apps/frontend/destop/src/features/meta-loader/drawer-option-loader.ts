import { normalizeAffixMap } from '../../components/affix/affix-domain'
import { loadBuffFiles } from '../../components/buff/buff-domain'
import { loadItemFiles } from '../../components/item/item-domain'
import { loadSkillFiles } from '../../components/skill/skill-domain'
import type { AffixEntry, BuffEntry, FsEntry, ItemEntry, SkillEntry, StaticSkillEntry, TalentTypeOption } from '../../types'
import { joinWinPath } from '../../utils/path'

type ReadFilePayload = (path: string) => Promise<{ content: string }>
type LoadProjectEntries = (path: string) => Promise<FsEntry[]>

type LoaderDeps = {
    modRootPath: string
    loadProjectEntries: LoadProjectEntries
    readFilePayload: ReadFilePayload
}

function normalizeFsPath(value: string) {
    return String(value || '')
        .replace(/\//g, '\\')
        .replace(/[\\]+$/, '')
        .toLowerCase()
}

function getParentDir(pathValue: string) {
    const cleaned = String(pathValue || '').replace(/[\\/]+$/, '')
    if (!cleaned) return ''
    const slashIndex = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'))
    if (slashIndex <= 0) return ''
    return cleaned.slice(0, slashIndex)
}

function mergeUniqueOptions(...groups: TalentTypeOption[][]) {
    const result = new Map<number, TalentTypeOption>()
    for (const group of groups) {
        for (const option of group) {
            if (!Number.isFinite(option.id)) continue
            const current = result.get(option.id)
            if (!current || (!current.name && option.name)) {
                result.set(option.id, option)
            }
        }
    }
    return [...result.values()].sort((left, right) => left.id - right.id)
}

async function collectSiblingModRoots(modRootPath: string, loadProjectEntries: LoadProjectEntries) {
    if (!modRootPath) return [] as string[]
    const parentDir = getParentDir(modRootPath)
    if (!parentDir) return [modRootPath]

    try {
        const entries = await loadProjectEntries(parentDir)
        const ordered = [modRootPath, ...entries.filter(entry => entry.is_dir).map(entry => entry.path)]
        const unique: string[] = []
        const seen = new Set<string>()
        for (const path of ordered) {
            const normalized = normalizeFsPath(path)
            if (!normalized || seen.has(normalized)) continue
            seen.add(normalized)
            unique.push(path)
        }
        return unique
    } catch {
        return [modRootPath]
    }
}

async function readIdNameOptionsFromDir(dirPath: string, loadProjectEntries: LoadProjectEntries, readFilePayload: ReadFilePayload) {
    const options: TalentTypeOption[] = []
    let entries: FsEntry[] = []
    try {
        entries = await loadProjectEntries(dirPath)
    } catch {
        return options
    }

    for (const entry of entries) {
        if (entry.is_dir || !/\.json$/i.test(entry.name)) continue
        try {
            const payload = await readFilePayload(entry.path)
            const parsed = JSON.parse(payload.content) as Record<string, unknown>
            const id = Number(
                parsed.id ??
                    parsed.ID ??
                    parsed.Id ??
                    parsed.buffid ??
                    parsed.skillid ??
                    parsed.Skill_ID ??
                    entry.name.replace(/\.json$/i, '')
            )
            if (!Number.isFinite(id)) continue
            const name = String(parsed.name ?? parsed.Name ?? parsed.Title ?? parsed.title ?? '')
            options.push({ id, name })
        } catch {
            // ignore invalid rows
        }
    }

    return options.sort((left, right) => left.id - right.id)
}

async function readIdNameOptionsFromMapFile(filePath: string, readFilePayload: ReadFilePayload) {
    const options: TalentTypeOption[] = []
    try {
        const payload = await readFilePayload(filePath)
        const parsed = JSON.parse(payload.content) as Record<string, unknown>
        if (!parsed || typeof parsed !== 'object') return options
        for (const [mapKey, rawValue] of Object.entries(parsed)) {
            if (!rawValue || typeof rawValue !== 'object') continue
            const row = rawValue as Record<string, unknown>
            const id = Number(row.id ?? row.ID ?? row.Id ?? row.skillid ?? row.Skill_ID ?? Number(mapKey))
            if (!Number.isFinite(id)) continue
            const name = String(row.name ?? row.Name ?? row.Title ?? row.title ?? '')
            options.push({ id, name })
        }
    } catch {
        return options
    }
    return options.sort((left, right) => left.id - right.id)
}

export async function loadCrossModDrawerOptions({ modRootPath, loadProjectEntries, readFilePayload }: LoaderDeps) {
    if (!modRootPath) return {} as Record<string, TalentTypeOption[]>

    const modRoots = await collectSiblingModRoots(modRootPath, loadProjectEntries)
    const affixGroups: TalentTypeOption[][] = []
    const buffGroups: TalentTypeOption[][] = []
    const itemGroups: TalentTypeOption[][] = []
    const skillGroups: TalentTypeOption[][] = []
    const skillPkGroups: TalentTypeOption[][] = []
    const staticSkillGroups: TalentTypeOption[][] = []

    for (const root of modRoots) {
        try {
            const payload = await readFilePayload(joinWinPath(root, 'Data', 'TuJianChunWenBen.json'))
            const affixMap = normalizeAffixMap(JSON.parse(payload.content))
            affixGroups.push(
                Object.values(affixMap)
                    .map(row => ({ id: row.id, name: row.name2 || row.name1 || '' }))
                    .sort((left, right) => left.id - right.id)
            )
        } catch {
            // ignore invalid mod directories
        }

        try {
            const buffMap = await loadBuffFiles({ modRootPath: root, joinWinPath, loadProjectEntries, readFilePayload })
            buffGroups.push(
                Object.values(buffMap)
                    .map(row => ({ id: row.buffid, name: row.name || '' }))
                    .sort((left, right) => left.id - right.id)
            )
        } catch {
            // ignore invalid mod directories
        }

        try {
            const itemMap = await loadItemFiles({ modRootPath: root, joinWinPath, loadProjectEntries, readFilePayload })
            itemGroups.push(
                Object.values(itemMap)
                    .map(row => ({ id: row.id, name: row.name || '' }))
                    .sort((left, right) => left.id - right.id)
            )
        } catch {
            // ignore invalid mod directories
        }

        try {
            const skillMap = await loadSkillFiles({ modRootPath: root, joinWinPath, loadProjectEntries, readFilePayload })
            skillGroups.push(
                Object.values(skillMap)
                    .map(row => ({ id: row.id, name: row.name || '' }))
                    .sort((left, right) => left.id - right.id)
            )
        } catch {
            // ignore invalid mod directories
        }

        skillPkGroups.push(
            await readIdNameOptionsFromDir(joinWinPath(root, 'Data', 'SkillPkJsonData'), loadProjectEntries, readFilePayload)
        )
        staticSkillGroups.push(await readIdNameOptionsFromMapFile(joinWinPath(root, 'Data', 'StaticSkillJsonData.json'), readFilePayload))
    }

    const affixOptions = mergeUniqueOptions(...affixGroups)
    const buffOptions = mergeUniqueOptions(...buffGroups)
    const itemOptions = mergeUniqueOptions(...itemGroups)
    const skillOptions = mergeUniqueOptions(...skillGroups)
    const skillPkOptions = mergeUniqueOptions(...skillPkGroups)
    const staticSkillOptions = mergeUniqueOptions(...staticSkillGroups)
    const finalSkillPkOptions = skillPkOptions.length > 0 ? skillPkOptions : skillOptions

    return {
        AffixDrawer: affixOptions,
        AffixArrayDrawer: affixOptions,
        BuffDrawer: buffOptions,
        BuffArrayDrawer: buffOptions,
        ItemDrawer: itemOptions,
        ItemArrayDrawer: itemOptions,
        SkillDrawer: skillOptions,
        SkillArrayDrawer: skillOptions,
        SkillPkDrawer: finalSkillPkOptions,
        SkillPkArrayDrawer: finalSkillPkOptions,
        SkillPKDrawer: finalSkillPkOptions,
        SkillPKArrayDrawer: finalSkillPkOptions,
        StaticSkillDrawer: staticSkillOptions,
        StaticSkillArrayDrawer: staticSkillOptions,
        StaticSkillPKDrawer: staticSkillOptions,
        StaticSkillPKArrayDrawer: staticSkillOptions,
    } satisfies Record<string, TalentTypeOption[]>
}

export function buildInMemoryDrawerOptions(params: {
    affixMap: Record<string, AffixEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
}) {
    const { affixMap, buffMap, itemMap, skillMap, staticSkillMap } = params

    const affixOptions = mergeUniqueOptions(
        Object.values(affixMap)
            .map(row => ({ id: Number(row.id), name: row.name2 || row.name1 || '' }))
            .filter(row => Number.isFinite(row.id))
    )
    const buffOptions = mergeUniqueOptions(
        Object.values(buffMap)
            .map(row => ({ id: Number(row.buffid), name: row.name || '' }))
            .filter(row => Number.isFinite(row.id))
    )
    const itemOptions = mergeUniqueOptions(
        Object.values(itemMap)
            .map(row => ({ id: Number(row.id), name: row.name || '' }))
            .filter(row => Number.isFinite(row.id))
    )
    const skillOptions = mergeUniqueOptions(
        Object.values(skillMap)
            .map(row => ({ id: Number(row.id), name: row.name || '' }))
            .filter(row => Number.isFinite(row.id))
    )
    const staticSkillOptions = mergeUniqueOptions(
        Object.values(staticSkillMap)
            .map(row => ({ id: Number(row.id), name: row.name || '' }))
            .filter(row => Number.isFinite(row.id))
    )

    return {
        AffixDrawer: affixOptions,
        AffixArrayDrawer: affixOptions,
        BuffDrawer: buffOptions,
        BuffArrayDrawer: buffOptions,
        ItemDrawer: itemOptions,
        ItemArrayDrawer: itemOptions,
        SkillDrawer: skillOptions,
        SkillArrayDrawer: skillOptions,
        SkillPkDrawer: skillOptions,
        SkillPkArrayDrawer: skillOptions,
        SkillPKDrawer: skillOptions,
        SkillPKArrayDrawer: skillOptions,
        StaticSkillDrawer: staticSkillOptions,
        StaticSkillArrayDrawer: staticSkillOptions,
        StaticSkillPKDrawer: staticSkillOptions,
        StaticSkillPKArrayDrawer: staticSkillOptions,
    } satisfies Record<string, TalentTypeOption[]>
}

export function buildSnapshotDrawerOptions(
    snapshots: Array<{
        affixMap: Record<string, AffixEntry>
        buffMap: Record<string, BuffEntry>
        itemMap: Record<string, ItemEntry>
        skillMap: Record<string, SkillEntry>
        staticSkillMap: Record<string, StaticSkillEntry>
    }>
) {
    return snapshots.reduce<Record<string, TalentTypeOption[]>>(
        (merged, snapshot) =>
            mergeDrawerOptionMaps(
                merged,
                buildInMemoryDrawerOptions({
                    affixMap: snapshot.affixMap,
                    buffMap: snapshot.buffMap,
                    itemMap: snapshot.itemMap,
                    skillMap: snapshot.skillMap,
                    staticSkillMap: snapshot.staticSkillMap,
                })
            ),
        {}
    )
}

export function mergeDrawerOptionMaps(baseMap: Record<string, TalentTypeOption[]>, overrideMap: Record<string, TalentTypeOption[]>) {
    const keys = new Set([...Object.keys(baseMap), ...Object.keys(overrideMap)])
    const next: Record<string, TalentTypeOption[]> = {}
    for (const key of keys) {
        next[key] = mergeUniqueOptions(baseMap[key] ?? [], overrideMap[key] ?? [])
    }
    return next
}
