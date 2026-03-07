import { normalizeAffixMap } from '../../components/affix/affix-domain'
import { loadBuffFiles, mergeBuffSeidFiles } from '../../components/buff/buff-domain'
import { loadItemFiles, mergeItemSeidFiles } from '../../components/item/item-domain'
import { loadSkillFiles, mergeSkillSeidFiles } from '../../components/skill/skill-domain'
import { normalizeStaticSkillMap } from '../../components/staticskill/staticskill-domain'
import { normalizeTalentMap } from '../../components/tianfu/talent-domain'
import type { AffixEntry, BuffEntry, CreateAvatarEntry, FsEntry, ItemEntry, SkillEntry, StaticSkillEntry } from '../../types'
import { joinWinPath } from '../../utils/path'

export type ModuleImportReport = {
    module: 'talent' | 'affix' | 'staticskill' | 'buff' | 'item' | 'skill'
    total: number
}

type AdapterDeps = {
    modRootPath: string
    loadProjectEntries: (path: string) => Promise<FsEntry[]>
    readFilePayload: (path: string) => Promise<{ content: string }>
}

export function adaptTalentImport(raw: unknown): { data: Record<string, CreateAvatarEntry>; report: ModuleImportReport } {
    const data = normalizeTalentMap(raw)
    return {
        data,
        report: {
            module: 'talent',
            total: Object.keys(data).length,
        },
    }
}

export function adaptAffixImport(raw: unknown): { data: Record<string, AffixEntry>; report: ModuleImportReport } {
    const data = normalizeAffixMap(raw)
    return {
        data,
        report: {
            module: 'affix',
            total: Object.keys(data).length,
        },
    }
}

export function adaptStaticSkillImport(raw: unknown): { data: Record<string, StaticSkillEntry>; report: ModuleImportReport } {
    const data = normalizeStaticSkillMap(raw)
    return {
        data,
        report: {
            module: 'staticskill',
            total: Object.keys(data).length,
        },
    }
}

export async function adaptBuffImportWithMerge({
    modRootPath,
    loadProjectEntries,
    readFilePayload,
}: AdapterDeps): Promise<{ data: Record<string, BuffEntry>; report: ModuleImportReport }> {
    const loaded = await loadBuffFiles({ modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    const data = await mergeBuffSeidFiles({ source: loaded, modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    return {
        data,
        report: {
            module: 'buff',
            total: Object.keys(data).length,
        },
    }
}

export async function adaptItemImportWithMerge({
    modRootPath,
    loadProjectEntries,
    readFilePayload,
}: AdapterDeps): Promise<{ data: Record<string, ItemEntry>; report: ModuleImportReport }> {
    const loaded = await loadItemFiles({ modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    const data = await mergeItemSeidFiles({ source: loaded, modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    return {
        data,
        report: {
            module: 'item',
            total: Object.keys(data).length,
        },
    }
}

export async function adaptSkillImportWithMerge({
    modRootPath,
    loadProjectEntries,
    readFilePayload,
}: AdapterDeps): Promise<{ data: Record<string, SkillEntry>; report: ModuleImportReport }> {
    const loaded = await loadSkillFiles({ modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    const data = await mergeSkillSeidFiles({ source: loaded, modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    return {
        data,
        report: {
            module: 'skill',
            total: Object.keys(data).length,
        },
    }
}
