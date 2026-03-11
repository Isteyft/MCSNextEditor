import { open } from '@tauri-apps/plugin-dialog'
import type { FormEvent } from 'react'

import { normalizeAffixMap } from '../../components/affix/affix-domain'
import { normalizeBackpackMap } from '../../components/backpack/backpack-domain'
import { normalizeNpcMap } from '../../components/npc/npc-domain'
import { normalizeNpcImportantMap } from '../../components/npcimportant/npcimportant-domain'
import { normalizeNpcTypeMap } from '../../components/npctype/npctype-domain'
import { normalizeNpcWuDaoMap } from '../../components/npcwudao/npcwudao-domain'
import { mergeStaticSkillSeidFiles, normalizeStaticSkillMap } from '../../components/staticskill/staticskill-domain'
import { mergeTalentSeidFiles, normalizeTalentMap } from '../../components/tianfu/talent-domain'
import { normalizeWuDaoMap } from '../../components/wudao/wudao-domain'
import { mergeWuDaoSkillSeidFiles, normalizeWuDaoSkillMap } from '../../components/wudaoskill/wudaoskill-domain'
import type { ModuleKey, ViewMode } from '../../modules'
import { createModFolder, createProject, loadProjectEntries, readFilePayload, saveFilePayload } from '../../services/project-api'
import type {
    AffixEntry,
    BackpackEntry,
    BuffEntry,
    CreateAvatarEntry,
    ItemEntry,
    NpcEntry,
    NpcImportantEntry,
    NpcTypeEntry,
    NpcWuDaoEntry,
    SkillEntry,
    StaticSkillEntry,
    WuDaoEntry,
    WuDaoSkillEntry,
} from '../../types'
import { findModRoot, inferModRootPath, isModRootPath, joinWinPath, pickLeafName } from '../../utils/path'
import { STATUS_MESSAGES, statusError } from '../app-core/status-messages'
import { parseJsonUnknown, readJsonUnknownWithFallback } from '../json-import/json-import-core'
import { adaptBuffImportWithMerge, adaptItemImportWithMerge, adaptSkillImportWithMerge } from '../json-import/module-adapters'

export type RootModuleSnapshot = {
    npcMap: Record<string, NpcEntry>
    npcImportantMap: Record<string, NpcImportantEntry>
    npcTypeMap: Record<string, NpcTypeEntry>
    npcTypeSourcePath: string
    npcWuDaoMap: Record<string, NpcWuDaoEntry>
    backpackMap: Record<string, BackpackEntry>
    wudaoMap: Record<string, WuDaoEntry>
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    affixMap: Record<string, AffixEntry>
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    npcDirty: boolean
    npcImportantDirty: boolean
    npcTypeDirty: boolean
    npcWuDaoDirty: boolean
    backpackDirty: boolean
    wudaoDirty: boolean
    wudaoSkillDirty: boolean
    affixDirty: boolean
    talentDirty: boolean
    buffDirty: boolean
    itemDirty: boolean
    skillDirty: boolean
    staticSkillDirty: boolean
}

type Setter = (value: any) => void
type LifecycleSetters = { [key: string]: Setter }

type LifecycleParams = {
    projectPath: string
    modRootPath: string
    workspaceRoot: string
    rootSnapshotCache: Record<string, RootModuleSnapshot>
    newProjectName: string
    newModName: string
    createMode: 'full' | 'quick'
    stripProjectPrefix: (value: string) => string
    dirname: (value: string) => string
    normalizePath: (value: string) => string
    collectSiblingModFolders: (anchorModRoot: string) => Promise<Array<{ path: string; name: string }>>
    preloadMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadBuffSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadItemSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadSkillSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadStaticSkillSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadBuffEnumMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadAffixEnumMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadItemEnumMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadSkillEnumMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadSpecialDrawerOptions: (roots: string[], modRoot: string, silent?: boolean) => Promise<any>
    onProjectLoadingChange?: (payload: { open: boolean; progress: number; message: string }) => void
    setters: LifecycleSetters
}

function createEmptySnapshot(): RootModuleSnapshot {
    return {
        npcMap: {},
        npcImportantMap: {},
        npcTypeMap: {},
        npcTypeSourcePath: '',
        npcWuDaoMap: {},
        backpackMap: {},
        wudaoMap: {},
        wudaoSkillMap: {},
        affixMap: {},
        talentMap: {},
        buffMap: {},
        itemMap: {},
        skillMap: {},
        staticSkillMap: {},
        npcDirty: false,
        npcImportantDirty: false,
        npcTypeDirty: false,
        npcWuDaoDirty: false,
        backpackDirty: false,
        wudaoDirty: false,
        wudaoSkillDirty: false,
        affixDirty: false,
        talentDirty: false,
        buffDirty: false,
        itemDirty: false,
        skillDirty: false,
        staticSkillDirty: false,
    }
}

function resetForRootSwitch(setters: LifecycleSetters) {
    setters.setRenameTargetPath('')
    setters.setActiveModule('' satisfies ModuleKey | '')
    setters.setViewMode('todo' satisfies ViewMode)
    setters.setActivePath('')
    setters.setTableSearchText('')
    setters.setConfigCachePath('')
    setters.setConfigDirty(false)
    setters.setNpcMap({})
    setters.setNpcImportantMap({})
    setters.setNpcTypeMap({})
    setters.setNpcWuDaoMap({})
    setters.setBackpackMap({})
    setters.setNpcCachePath('')
    setters.setNpcImportantCachePath('')
    setters.setNpcTypeCachePath('')
    setters.setNpcWuDaoCachePath('')
    setters.setBackpackCachePath('')
    setters.setNpcDirty(false)
    setters.setNpcImportantDirty(false)
    setters.setNpcTypeDirty(false)
    setters.setNpcWuDaoDirty(false)
    setters.setBackpackDirty(false)
    setters.setSelectedNpcKey('')
    setters.setSelectedNpcImportantKey('')
    setters.setSelectedNpcTypeKey('')
    setters.setSelectedNpcWuDaoKey('')
    setters.setSelectedBackpackKey('')
    setters.setSelectedNpcKeys([])
    setters.setSelectedNpcImportantKeys([])
    setters.setSelectedNpcTypeKeys([])
    setters.setSelectedNpcWuDaoKeys([])
    setters.setSelectedBackpackKeys([])
    setters.setNpcSelectionAnchor('')
    setters.setNpcImportantSelectionAnchor('')
    setters.setNpcTypeSelectionAnchor('')
    setters.setNpcWuDaoSelectionAnchor('')
    setters.setBackpackSelectionAnchor('')
    setters.setNpcClipboard([])
    setters.setNpcImportantClipboard([])
    setters.setNpcTypeClipboard([])
    setters.setNpcWuDaoClipboard([])
    setters.setBackpackClipboard([])
    setters.setWuDaoMap({})
    setters.setWuDaoCachePath('')
    setters.setWuDaoDirty(false)
    setters.setWuDaoSkillMap({})
    setters.setWuDaoSkillCachePath('')
    setters.setWuDaoSkillDirty(false)
    setters.setSelectedWuDaoSkillKey('')
    setters.setSelectedWuDaoSkillKeys([])
    setters.setWuDaoSkillSelectionAnchor('')
    setters.setWuDaoSkillClipboard([])
    setters.setSelectedWuDaoKey('')
    setters.setSelectedWuDaoKeys([])
    setters.setWuDaoSelectionAnchor('')
    setters.setWuDaoClipboard([])
    setters.setAffixMap({})
    setters.setAffixCachePath('')
    setters.setAffixDirty(false)
    setters.setSelectedAffixKey('')
    setters.setSelectedAffixKeys([])
    setters.setAffixSelectionAnchor('')
    setters.setAffixClipboard([])
    setters.setTalentMap({})
    setters.setTalentPath('')
    setters.setTalentCachePath('')
    setters.setTalentDirty(false)
    setters.setBuffMap({})
    setters.setBuffCachePath('')
    setters.setBuffDirty(false)
    setters.setItemMap({})
    setters.setItemCachePath('')
    setters.setItemDirty(false)
    setters.setSelectedItemKey('')
    setters.setSelectedItemKeys([])
    setters.setItemSelectionAnchor('')
    setters.setItemClipboard([])
    setters.setSelectedBuffKey('')
    setters.setSelectedBuffKeys([])
    setters.setBuffSelectionAnchor('')
    setters.setBuffClipboard([])
    setters.setSkillMap({})
    setters.setSkillCachePath('')
    setters.setSkillDirty(false)
    setters.setSelectedSkillKey('')
    setters.setSelectedSkillKeys([])
    setters.setSkillSelectionAnchor('')
    setters.setSkillClipboard([])
    setters.setStaticSkillMap({})
    setters.setStaticSkillCachePath('')
    setters.setStaticSkillDirty(false)
    setters.setSelectedStaticSkillKey('')
    setters.setSelectedStaticSkillKeys([])
    setters.setStaticSkillSelectionAnchor('')
    setters.setStaticSkillClipboard([])
    setters.setSeidEditorOpen(false)
    setters.setSeidPickerOpen(false)
    setters.setActiveSeidId(null)
    setters.setAddNpcImportantOpen(false)
    setters.setAddNpcWuDaoOpen(false)
    setters.setAddBackpackOpen(false)
    setters.setAddBuffOpen(false)
    setters.setAddWuDaoSkillOpen(false)
    setters.setAddAffixOpen(false)
    setters.setAddItemOpen(false)
    setters.setAddSkillOpen(false)
    setters.setAddStaticSkillOpen(false)
}

function resetForProjectReload(setters: LifecycleSetters, siblingFolders: Array<{ path: string; name: string }>) {
    resetForRootSwitch(setters)
    setters.setConfigForm({ name: '', author: '', version: '0.0.1', description: '' })
    setters.setRawConfigObject({})
    setters.setPreservedSettings([])
    setters.setBuffTypeOptions([])
    setters.setBuffTriggerOptions([])
    setters.setBuffRemoveTriggerOptions([])
    setters.setBuffOverlayTypeOptions([])
    setters.setAffixTypeOptions([])
    setters.setAffixProjectTypeOptions([])
    setters.setItemGuideTypeOptions([])
    setters.setItemShopTypeOptions([])
    setters.setItemUseTypeOptions([])
    setters.setItemTypeOptions([])
    setters.setItemQualityOptions([])
    setters.setItemPhaseOptions([])
    setters.setItemEquipSeidMetaMap({})
    setters.setItemUseSeidMetaMap({})
    setters.setSkillAttackTypeOptions([])
    setters.setSkillConsultTypeOptions([])
    setters.setSkillPhaseOptions([])
    setters.setSkillQualityOptions([])
    setters.setSkillSeidMetaMap({})
    setters.setStaticSkillSeidMetaMap({})
    setters.setDrawerOptionsMap({})
    setters.setBuffDrawerFallbackOptions([])
    setters.setSelectedNpcKey('')
    setters.setSelectedNpcKeys([])
    setters.setNpcSelectionAnchor('')
    setters.setSelectedNpcImportantKey('')
    setters.setSelectedNpcImportantKeys([])
    setters.setNpcImportantSelectionAnchor('')
    setters.setSelectedNpcTypeKey('')
    setters.setSelectedNpcTypeKeys([])
    setters.setNpcTypeSelectionAnchor('')
    setters.setSelectedNpcWuDaoKey('')
    setters.setSelectedNpcWuDaoKeys([])
    setters.setNpcWuDaoSelectionAnchor('')
    setters.setSelectedTalentKey('')
    setters.setSelectedTalentKeys([])
    setters.setTalentSelectionAnchor('')
    setters.setTalentClipboard([])
    setters.setBuffSeidMetaMap({})
    setters.setExpandedRootPaths(siblingFolders.map(item => item.path))
    setters.setRootSnapshotCache({})
}

async function readJsonFromCandidatePaths(params: {
    filePaths: string[]
    defaultContent: string
    readFilePayload: (filePath: string) => Promise<{ content: string }>
    saveFilePayload: (filePath: string, content: string) => Promise<unknown>
}) {
    const { filePaths, defaultContent, readFilePayload, saveFilePayload } = params
    for (const filePath of filePaths) {
        try {
            const payload = await readFilePayload(filePath)
            return {
                content: String(payload.content ?? ''),
                created: false,
                filePath,
            }
        } catch {
            // try next candidate path
        }
    }

    const fallbackPath = filePaths[0]
    await saveFilePayload(fallbackPath, defaultContent)
    const payload = await readFilePayload(fallbackPath)
    return {
        content: String(payload.content ?? ''),
        created: true,
        filePath: fallbackPath,
    }
}

export function useProjectLifecycle(params: LifecycleParams) {
    const {
        projectPath,
        modRootPath,
        workspaceRoot,
        rootSnapshotCache,
        newProjectName,
        newModName,
        createMode,
        stripProjectPrefix,
        dirname,
        normalizePath,
        collectSiblingModFolders,
        preloadMeta,
        loadBuffSeidMeta,
        loadItemSeidMeta,
        loadSkillSeidMeta,
        loadStaticSkillSeidMeta,
        loadBuffEnumMeta,
        loadAffixEnumMeta,
        loadItemEnumMeta,
        loadSkillEnumMeta,
        loadSpecialDrawerOptions,
        onProjectLoadingChange,
        setters,
    } = params

    async function readRootModuleSnapshot(targetModRoot: string): Promise<RootModuleSnapshot> {
        const snapshot = createEmptySnapshot()
        if (!targetModRoot) return snapshot

        const targetNpcPath = joinWinPath(targetModRoot, 'Data', 'AvatarJsonData.json')
        const targetNpcImportantPath = joinWinPath(targetModRoot, 'Data', 'NPCImportantDate.json')
        const targetNpcTypePath = snapshot.npcTypeSourcePath || joinWinPath(targetModRoot, 'Data', 'NPCLeiXingDate.json')
        const targetNpcTypeFallbackPath = joinWinPath(targetModRoot, 'NPCLeiXingDate.json')
        const targetNpcWuDaoPath = joinWinPath(targetModRoot, 'Data', 'NPCWuDaoJson.json')
        const targetBackpackPath = joinWinPath(targetModRoot, 'Data', 'BackpackJsonData.json')
        const targetWuDaoPath = joinWinPath(targetModRoot, 'Data', 'WuDaoAllTypeJson.json')
        const targetWuDaoSkillPath = joinWinPath(targetModRoot, 'Data', 'WuDaoJson.json')
        const targetAffixPath = joinWinPath(targetModRoot, 'Data', 'TuJianChunWenBen.json')
        const targetTalentPath = joinWinPath(targetModRoot, 'Data', 'CreateAvatarJsonData.json')
        const targetStaticSkillPath = joinWinPath(targetModRoot, 'Data', 'StaticSkillJsonData.json')

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetNpcPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetNpcPath)
            snapshot.npcMap = normalizeNpcMap(parsedResult.ok ? parsedResult.data : {})
        } catch {
            // ignore missing or invalid npc data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetNpcImportantPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetNpcImportantPath)
            snapshot.npcImportantMap = normalizeNpcImportantMap(parsedResult.ok ? parsedResult.data : {})
        } catch {
            // ignore missing or invalid npc important data for this root
        }

        try {
            const payload = await readJsonFromCandidatePaths({
                filePaths: [targetNpcTypePath, targetNpcTypeFallbackPath],
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, payload.filePath)
            snapshot.npcTypeMap = normalizeNpcTypeMap(parsedResult.ok ? parsedResult.data : {})
            snapshot.npcTypeSourcePath = payload.filePath
        } catch {
            // ignore missing or invalid npc type data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetNpcWuDaoPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetNpcWuDaoPath)
            snapshot.npcWuDaoMap = normalizeNpcWuDaoMap(parsedResult.ok ? parsedResult.data : {})
        } catch {
            // ignore missing or invalid npc wudao data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetBackpackPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetBackpackPath)
            snapshot.backpackMap = normalizeBackpackMap(parsedResult.ok ? parsedResult.data : {})
        } catch {
            // ignore missing or invalid backpack data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetWuDaoPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetWuDaoPath)
            snapshot.wudaoMap = normalizeWuDaoMap(parsedResult.ok ? parsedResult.data : {})
        } catch {
            // ignore missing or invalid wudao data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetWuDaoSkillPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetWuDaoSkillPath)
            const normalized = normalizeWuDaoSkillMap(parsedResult.ok ? parsedResult.data : {})
            snapshot.wudaoSkillMap = await mergeWuDaoSkillSeidFiles({
                source: normalized,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
        } catch {
            // ignore missing or invalid wudao skill data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetAffixPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetAffixPath)
            snapshot.affixMap = normalizeAffixMap(parsedResult.ok ? parsedResult.data : {})
        } catch {
            // ignore missing or invalid affix data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetTalentPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetTalentPath)
            const normalized = normalizeTalentMap(parsedResult.ok ? parsedResult.data : {})
            snapshot.talentMap = await mergeTalentSeidFiles({
                source: normalized,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
        } catch {
            // ignore missing or invalid talent data for this root
        }

        try {
            snapshot.buffMap = (await adaptBuffImportWithMerge({ modRootPath: targetModRoot, loadProjectEntries, readFilePayload })).data
        } catch {
            // ignore missing or invalid buff data for this root
        }

        try {
            snapshot.itemMap = (await adaptItemImportWithMerge({ modRootPath: targetModRoot, loadProjectEntries, readFilePayload })).data
        } catch {
            // ignore missing or invalid item data for this root
        }

        try {
            snapshot.skillMap = (await adaptSkillImportWithMerge({ modRootPath: targetModRoot, loadProjectEntries, readFilePayload })).data
        } catch {
            // ignore missing or invalid skill data for this root
        }

        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: targetStaticSkillPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, targetStaticSkillPath)
            const normalized = normalizeStaticSkillMap(parsedResult.ok ? parsedResult.data : {})
            snapshot.staticSkillMap = await mergeStaticSkillSeidFiles({
                source: normalized,
                modRootPath: targetModRoot,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
        } catch {
            // ignore missing or invalid static skill data for this root
        }

        return snapshot
    }

    function applyRootModuleSnapshot(targetModRoot: string, snapshot: RootModuleSnapshot) {
        const targetNpcPath = joinWinPath(targetModRoot, 'Data', 'AvatarJsonData.json')
        const targetNpcImportantPath = joinWinPath(targetModRoot, 'Data', 'NPCImportantDate.json')
        const targetNpcTypePath = joinWinPath(targetModRoot, 'Data', 'NPCLeiXingDate.json')
        const targetNpcWuDaoPath = joinWinPath(targetModRoot, 'Data', 'NPCWuDaoJson.json')
        const targetBackpackPath = joinWinPath(targetModRoot, 'Data', 'BackpackJsonData.json')
        const targetWuDaoPath = joinWinPath(targetModRoot, 'Data', 'WuDaoAllTypeJson.json')
        const targetWuDaoSkillPath = joinWinPath(targetModRoot, 'Data', 'WuDaoJson.json')
        const targetAffixPath = joinWinPath(targetModRoot, 'Data', 'TuJianChunWenBen.json')
        const targetTalentPath = joinWinPath(targetModRoot, 'Data', 'CreateAvatarJsonData.json')
        const targetBuffDirPath = joinWinPath(targetModRoot, 'Data', 'BuffJsonData')
        const targetItemDirPath = joinWinPath(targetModRoot, 'Data', 'ItemJsonData')
        const targetSkillDirPath = joinWinPath(targetModRoot, 'Data', 'skillJsonData')
        const targetStaticSkillPath = joinWinPath(targetModRoot, 'Data', 'StaticSkillJsonData.json')

        setters.setNpcMap(snapshot.npcMap)
        setters.setNpcCachePath(targetNpcPath)
        setters.setNpcDirty(snapshot.npcDirty)
        const firstNpc = Object.keys(snapshot.npcMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedNpcKey(firstNpc)
        setters.setSelectedNpcKeys(firstNpc ? [firstNpc] : [])
        setters.setNpcSelectionAnchor(firstNpc)

        setters.setNpcImportantMap(snapshot.npcImportantMap)
        setters.setNpcImportantCachePath(targetNpcImportantPath)
        setters.setNpcImportantDirty(snapshot.npcImportantDirty)
        const firstNpcImportant = Object.keys(snapshot.npcImportantMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedNpcImportantKey(firstNpcImportant)
        setters.setSelectedNpcImportantKeys(firstNpcImportant ? [firstNpcImportant] : [])
        setters.setNpcImportantSelectionAnchor(firstNpcImportant)

        setters.setNpcTypeMap(snapshot.npcTypeMap)
        setters.setNpcTypeCachePath(targetNpcTypePath)
        setters.setNpcTypeDirty(snapshot.npcTypeDirty)
        const firstNpcType = Object.keys(snapshot.npcTypeMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedNpcTypeKey(firstNpcType)
        setters.setSelectedNpcTypeKeys(firstNpcType ? [firstNpcType] : [])
        setters.setNpcTypeSelectionAnchor(firstNpcType)

        setters.setNpcWuDaoMap(snapshot.npcWuDaoMap)
        setters.setNpcWuDaoCachePath(targetNpcWuDaoPath)
        setters.setNpcWuDaoDirty(snapshot.npcWuDaoDirty)
        const firstNpcWuDao = Object.keys(snapshot.npcWuDaoMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedNpcWuDaoKey(firstNpcWuDao)
        setters.setSelectedNpcWuDaoKeys(firstNpcWuDao ? [firstNpcWuDao] : [])
        setters.setNpcWuDaoSelectionAnchor(firstNpcWuDao)

        setters.setBackpackMap(snapshot.backpackMap)
        setters.setBackpackCachePath(targetBackpackPath)
        setters.setBackpackDirty(snapshot.backpackDirty)
        const firstBackpack = Object.keys(snapshot.backpackMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedBackpackKey(firstBackpack)
        setters.setSelectedBackpackKeys(firstBackpack ? [firstBackpack] : [])
        setters.setBackpackSelectionAnchor(firstBackpack)

        setters.setWuDaoMap(snapshot.wudaoMap)
        setters.setWuDaoCachePath(targetWuDaoPath)
        setters.setWuDaoDirty(snapshot.wudaoDirty)
        const firstWuDao = Object.keys(snapshot.wudaoMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedWuDaoKey(firstWuDao)
        setters.setSelectedWuDaoKeys(firstWuDao ? [firstWuDao] : [])
        setters.setWuDaoSelectionAnchor(firstWuDao)

        setters.setWuDaoSkillMap(snapshot.wudaoSkillMap)
        setters.setWuDaoSkillCachePath(targetWuDaoSkillPath)
        setters.setWuDaoSkillDirty(snapshot.wudaoSkillDirty)
        const firstWuDaoSkill = Object.keys(snapshot.wudaoSkillMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedWuDaoSkillKey(firstWuDaoSkill)
        setters.setSelectedWuDaoSkillKeys(firstWuDaoSkill ? [firstWuDaoSkill] : [])
        setters.setWuDaoSkillSelectionAnchor(firstWuDaoSkill)

        setters.setAffixMap(snapshot.affixMap)
        setters.setAffixCachePath(targetAffixPath)
        setters.setAffixDirty(snapshot.affixDirty)
        const firstAffix = Object.keys(snapshot.affixMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedAffixKey(firstAffix)
        setters.setSelectedAffixKeys(firstAffix ? [firstAffix] : [])
        setters.setAffixSelectionAnchor(firstAffix)

        setters.setTalentMap(snapshot.talentMap)
        setters.setTalentPath(targetTalentPath)
        setters.setTalentCachePath(targetTalentPath)
        setters.setTalentDirty(snapshot.talentDirty)
        const firstTalent = Object.keys(snapshot.talentMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedTalentKey(firstTalent)
        setters.setSelectedTalentKeys(firstTalent ? [firstTalent] : [])
        setters.setTalentSelectionAnchor(firstTalent)

        setters.setBuffMap(snapshot.buffMap)
        setters.setBuffCachePath(targetBuffDirPath)
        setters.setBuffDirty(snapshot.buffDirty)
        const firstBuff = Object.keys(snapshot.buffMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedBuffKey(firstBuff)
        setters.setSelectedBuffKeys(firstBuff ? [firstBuff] : [])
        setters.setBuffSelectionAnchor(firstBuff)

        setters.setItemMap(snapshot.itemMap)
        setters.setItemCachePath(targetItemDirPath)
        setters.setItemDirty(snapshot.itemDirty)
        const firstItem = Object.keys(snapshot.itemMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedItemKey(firstItem)
        setters.setSelectedItemKeys(firstItem ? [firstItem] : [])
        setters.setItemSelectionAnchor(firstItem)

        setters.setSkillMap(snapshot.skillMap)
        setters.setSkillCachePath(targetSkillDirPath)
        setters.setSkillDirty(snapshot.skillDirty)
        const firstSkill = Object.keys(snapshot.skillMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedSkillKey(firstSkill)
        setters.setSelectedSkillKeys(firstSkill ? [firstSkill] : [])
        setters.setSkillSelectionAnchor(firstSkill)

        setters.setStaticSkillMap(snapshot.staticSkillMap)
        setters.setStaticSkillCachePath(targetStaticSkillPath)
        setters.setStaticSkillDirty(snapshot.staticSkillDirty)
        const firstStaticSkill = Object.keys(snapshot.staticSkillMap).sort((a, b) => Number(a) - Number(b))[0] ?? ''
        setters.setSelectedStaticSkillKey(firstStaticSkill)
        setters.setSelectedStaticSkillKeys(firstStaticSkill ? [firstStaticSkill] : [])
        setters.setStaticSkillSelectionAnchor(firstStaticSkill)
    }

    async function reloadProject(rootPath: string) {
        onProjectLoadingChange?.({ open: true, progress: 0, message: '正在扫描项目目录...' })
        try {
            const loaded = await loadProjectEntries(rootPath)
            const modRoot = findModRoot(loaded)
            const nextModRoot = isModRootPath(rootPath) ? rootPath : (modRoot?.path ?? inferModRootPath(rootPath))
            const siblingFolders = await collectSiblingModFolders(nextModRoot)

            const totalSteps = 12 + Math.max(1, siblingFolders.length)
            let doneSteps = 0
            const reportStep = (message: string) => {
                doneSteps += 1
                const progress = Math.min(99, Math.round((doneSteps / totalSteps) * 100))
                onProjectLoadingChange?.({ open: true, progress, message })
            }

            setters.setProjectPath(rootPath)
            setters.setModRootPath(nextModRoot)
            setters.setModRootFolders(siblingFolders)
            resetForProjectReload(setters, siblingFolders)
            reportStep('正在初始化项目状态...')

            await preloadMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载基础元数据...')
            await loadBuffSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载 Buff Seid 元数据...')
            await loadItemSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载 Item Seid 元数据...')
            await loadSkillSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载神通 Seid 元数据...')
            await loadStaticSkillSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载功法 Seid 元数据...')
            await loadBuffEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载 Buff 枚举...')
            await loadAffixEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载词缀枚举...')
            await loadItemEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载物品枚举...')
            await loadSkillEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
            reportStep('正在加载技能枚举...')
            await loadSpecialDrawerOptions([rootPath, nextModRoot, workspaceRoot], nextModRoot, true)
            reportStep('正在加载编辑器选项...')

            const nextCache: Record<string, RootModuleSnapshot> = {}
            const foldersToLoad = siblingFolders.length > 0 ? siblingFolders : [{ path: nextModRoot, name: pickLeafName(nextModRoot) }]
            for (let index = 0; index < foldersToLoad.length; index += 1) {
                const item = foldersToLoad[index]
                nextCache[normalizePath(item.path)] = await readRootModuleSnapshot(item.path)
                reportStep(`正在预加载目录数据 (${index + 1}/${foldersToLoad.length})...`)
            }
            setters.setRootSnapshotCache(nextCache)
            const activeSnapshot = nextCache[normalizePath(nextModRoot)]
            if (activeSnapshot) applyRootModuleSnapshot(nextModRoot, activeSnapshot)
            setters.setStatus(
                modRoot ? STATUS_MESSAGES.openProjectLoaded(rootPath) : STATUS_MESSAGES.openProjectLoadedFallback(nextModRoot)
            )
            onProjectLoadingChange?.({ open: true, progress: 100, message: '项目加载完成。' })
        } finally {
            onProjectLoadingChange?.({ open: false, progress: 100, message: '项目加载完成。' })
        }
    }

    async function handleSelectModRoot(nextModRoot: string) {
        if (!nextModRoot || nextModRoot === modRootPath) return
        const cachedSnapshot = rootSnapshotCache[normalizePath(nextModRoot)]
        if (cachedSnapshot) {
            setters.setModRootPath(nextModRoot)
            setters.setRenameTargetPath('')
            setters.setActiveModule('' satisfies ModuleKey | '')
            setters.setViewMode('todo' satisfies ViewMode)
            setters.setActivePath('')
            setters.setTableSearchText('')
            setters.setSeidEditorOpen(false)
            setters.setSeidPickerOpen(false)
            setters.setActiveSeidId(null)
            applyRootModuleSnapshot(nextModRoot, cachedSnapshot)
            setters.setStatus(STATUS_MESSAGES.switchedRootCached(pickLeafName(nextModRoot)))
            return
        }

        setters.setModRootPath(nextModRoot)
        resetForRootSwitch(setters)

        const siblingFolders = await collectSiblingModFolders(nextModRoot)
        setters.setModRootFolders(siblingFolders)
        await preloadMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadBuffSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadItemSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadSkillSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadStaticSkillSeidMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadBuffEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadAffixEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadItemEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadSkillEnumMeta([projectPath, nextModRoot, workspaceRoot], true)
        await loadSpecialDrawerOptions([projectPath, nextModRoot, workspaceRoot], nextModRoot, true)
        const snapshot = await readRootModuleSnapshot(nextModRoot)
        setters.setRootSnapshotCache((prev: Record<string, RootModuleSnapshot>) => ({ ...prev, [normalizePath(nextModRoot)]: snapshot }))
        applyRootModuleSnapshot(nextModRoot, snapshot)
        setters.setStatus(STATUS_MESSAGES.switchedRootLoaded(pickLeafName(nextModRoot)))
    }

    async function handleOpenProject() {
        const selected = await open({ directory: true, multiple: false, title: '选择项目目录' })
        if (!selected || Array.isArray(selected)) return
        try {
            await reloadProject(selected)
        } catch (error) {
            setters.setStatus(statusError('打开', error))
        }
    }

    async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const projectNameInput = stripProjectPrefix(newProjectName)
        const modName = (newModName.trim() || projectNameInput).trim()
        const projectName = (createMode === 'quick' ? modName : projectNameInput).trim()
        if (!modName || (!projectName && createMode !== 'quick')) {
            setters.setStatus(createMode === 'quick' ? STATUS_MESSAGES.requireModName : STATUS_MESSAGES.requireProjectAndModName)
            return
        }
        try {
            let createdMessage = ''
            if (createMode === 'quick') {
                if (!modRootPath) {
                    setters.setStatus(STATUS_MESSAGES.requireOpenProjectFirst)
                    return
                }
                const nextBasePath = dirname(modRootPath)
                if (!nextBasePath) {
                    setters.setStatus(STATUS_MESSAGES.cannotLocateNextDir)
                    return
                }
                const createdModPath = await createModFolder(nextBasePath, modName)
                const siblingFolders = await collectSiblingModFolders(createdModPath)
                setters.setModRootFolders(siblingFolders)
                await handleSelectModRoot(createdModPath)
                createdMessage = STATUS_MESSAGES.createdMod(createdModPath)
            } else {
                const createdPath = await createProject(projectName, modName)
                await reloadProject(createdPath)
                createdMessage = STATUS_MESSAGES.createdProject(createdPath)
            }
            setters.setCreateOpen(false)
            setters.setCreateMode('full')
            setters.setNewProjectName('')
            setters.setNewModName('')
            setters.setStatus(createdMessage)
        } catch (error) {
            setters.setStatus(statusError('新建', error))
        }
    }

    return { handleOpenProject, handleCreateProject, handleSelectModRoot }
}
