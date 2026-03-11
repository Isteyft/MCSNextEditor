import { normalizeAffixMap } from '../../components/affix/affix-domain'
import { normalizeBackpackMap } from '../../components/backpack/backpack-domain'
import { loadBuffFiles, mergeBuffSeidFiles } from '../../components/buff/buff-domain'
import { loadItemFiles, mergeItemSeidFiles } from '../../components/item/item-domain'
import { normalizeNpcMap } from '../../components/npc/npc-domain'
import { normalizeNpcTypeMap } from '../../components/npctype/npctype-domain'
import { normalizeNpcWuDaoMap } from '../../components/npcwudao/npcwudao-domain'
import { loadSkillFiles, mergeSkillSeidFiles } from '../../components/skill/skill-domain'
import { normalizeStaticSkillMap } from '../../components/staticskill/staticskill-domain'
import { normalizeTalentMap } from '../../components/tianfu/talent-domain'
import { normalizeWuDaoMap } from '../../components/wudao/wudao-domain'
import { normalizeWuDaoSkillMap } from '../../components/wudaoskill/wudaoskill-domain'
import type {
    AffixEntry,
    BackpackEntry,
    BuffEntry,
    CreateAvatarEntry,
    FsEntry,
    ItemEntry,
    NpcEntry,
    NpcTypeEntry,
    NpcWuDaoEntry,
    SkillEntry,
    StaticSkillEntry,
    WuDaoEntry,
    WuDaoSkillEntry,
} from '../../types'
import { joinWinPath } from '../../utils/path'

export type ModuleImportReport = {
    module:
        | 'talent'
        | 'wudao'
        | 'wudaoskill'
        | 'affix'
        | 'staticskill'
        | 'buff'
        | 'item'
        | 'skill'
        | 'npc'
        | 'npctype'
        | 'npcwudao'
        | 'backpack'
    total: number
}

type AdapterDeps = {
    modRootPath: string
    loadProjectEntries: (path: string) => Promise<FsEntry[]>
    readFilePayload: (path: string) => Promise<{ content: string }>
}

export function adaptTalentImport(raw: unknown): { data: Record<string, CreateAvatarEntry>; report: ModuleImportReport } {
    const data = normalizeTalentMap(raw)
    return { data, report: { module: 'talent', total: Object.keys(data).length } }
}

export function adaptWuDaoImport(raw: unknown): { data: Record<string, WuDaoEntry>; report: ModuleImportReport } {
    const data = normalizeWuDaoMap(raw)
    return { data, report: { module: 'wudao', total: Object.keys(data).length } }
}

export function adaptNpcImport(raw: unknown): { data: Record<string, NpcEntry>; report: ModuleImportReport } {
    const data = normalizeNpcMap(raw)
    return { data, report: { module: 'npc', total: Object.keys(data).length } }
}

export function adaptNpcTypeImport(raw: unknown): { data: Record<string, NpcTypeEntry>; report: ModuleImportReport } {
    const data = normalizeNpcTypeMap(raw)
    return { data, report: { module: 'npctype', total: Object.keys(data).length } }
}

export function adaptNpcWuDaoImport(raw: unknown): { data: Record<string, NpcWuDaoEntry>; report: ModuleImportReport } {
    const data = normalizeNpcWuDaoMap(raw)
    return { data, report: { module: 'npcwudao', total: Object.keys(data).length } }
}

export function adaptBackpackImport(raw: unknown): { data: Record<string, BackpackEntry>; report: ModuleImportReport } {
    const data = normalizeBackpackMap(raw)
    return { data, report: { module: 'backpack', total: Object.keys(data).length } }
}

export function adaptWuDaoSkillImport(raw: unknown): { data: Record<string, WuDaoSkillEntry>; report: ModuleImportReport } {
    const data = normalizeWuDaoSkillMap(raw)
    return { data, report: { module: 'wudaoskill', total: Object.keys(data).length } }
}

export function adaptAffixImport(raw: unknown): { data: Record<string, AffixEntry>; report: ModuleImportReport } {
    const data = normalizeAffixMap(raw)
    return { data, report: { module: 'affix', total: Object.keys(data).length } }
}

export function adaptStaticSkillImport(raw: unknown): { data: Record<string, StaticSkillEntry>; report: ModuleImportReport } {
    const data = normalizeStaticSkillMap(raw)
    return { data, report: { module: 'staticskill', total: Object.keys(data).length } }
}

export async function adaptBuffImportWithMerge({
    modRootPath,
    loadProjectEntries,
    readFilePayload,
}: AdapterDeps): Promise<{ data: Record<string, BuffEntry>; report: ModuleImportReport }> {
    const loaded = await loadBuffFiles({ modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    const data = await mergeBuffSeidFiles({ source: loaded, modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    return { data, report: { module: 'buff', total: Object.keys(data).length } }
}

export async function adaptItemImportWithMerge({
    modRootPath,
    loadProjectEntries,
    readFilePayload,
}: AdapterDeps): Promise<{ data: Record<string, ItemEntry>; report: ModuleImportReport }> {
    const loaded = await loadItemFiles({ modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    const data = await mergeItemSeidFiles({ source: loaded, modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    return { data, report: { module: 'item', total: Object.keys(data).length } }
}

export async function adaptSkillImportWithMerge({
    modRootPath,
    loadProjectEntries,
    readFilePayload,
}: AdapterDeps): Promise<{ data: Record<string, SkillEntry>; report: ModuleImportReport }> {
    const loaded = await loadSkillFiles({ modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    const data = await mergeSkillSeidFiles({ source: loaded, modRootPath, joinWinPath, loadProjectEntries, readFilePayload })
    return { data, report: { module: 'skill', total: Object.keys(data).length } }
}
