import { open } from '@tauri-apps/plugin-dialog'
import type { FormEvent } from 'react'

import { normalizeAffixMap } from '../../components/affix/affix-domain'
import { mergeStaticSkillSeidFiles, normalizeStaticSkillMap } from '../../components/staticskill/staticskill-domain'
import { mergeTalentSeidFiles, normalizeTalentMap } from '../../components/tianfu/talent-domain'
import type { ModuleKey, ViewMode } from '../../modules'
import { createModFolder, createProject, loadProjectEntries, readFilePayload, saveFilePayload } from '../../services/project-api'
import type { AffixEntry, BuffEntry, CreateAvatarEntry, ItemEntry, SkillEntry, StaticSkillEntry } from '../../types'
import { findModRoot, inferModRootPath, isModRootPath, joinWinPath, pickLeafName } from '../../utils/path'
import { STATUS_MESSAGES, statusError } from '../app-core/status-messages'
import { parseJsonUnknown, readJsonUnknownWithFallback } from '../json-import/json-import-core'
import { adaptBuffImportWithMerge, adaptItemImportWithMerge, adaptSkillImportWithMerge } from '../json-import/module-adapters'

export type RootModuleSnapshot = {
    affixMap: Record<string, AffixEntry>
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    affixDirty: boolean
    talentDirty: boolean
    buffDirty: boolean
    itemDirty: boolean
    skillDirty: boolean
    staticSkillDirty: boolean
}

type Setter = (value: any) => void

type LifecycleSetters = {
    [key: string]: Setter
}

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
    setters: LifecycleSetters
}

function createEmptySnapshot(): RootModuleSnapshot {
    return {
        affixMap: {},
        talentMap: {},
        buffMap: {},
        itemMap: {},
        skillMap: {},
        staticSkillMap: {},
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
    setters.setAddBuffOpen(false)
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
    setters.setItemSeidMetaMap({})
    setters.setSkillAttackTypeOptions([])
    setters.setSkillConsultTypeOptions([])
    setters.setSkillPhaseOptions([])
    setters.setSkillQualityOptions([])
    setters.setSkillSeidMetaMap({})
    setters.setStaticSkillSeidMetaMap({})
    setters.setDrawerOptionsMap({})
    setters.setBuffDrawerFallbackOptions([])
    setters.setSelectedTalentKey('')
    setters.setSelectedTalentKeys([])
    setters.setTalentSelectionAnchor('')
    setters.setTalentClipboard([])
    setters.setBuffSeidMetaMap({})
    setters.setExpandedRootPaths(siblingFolders.map(item => item.path))
    setters.setRootSnapshotCache({})
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
        setters,
    } = params

    async function readRootModuleSnapshot(targetModRoot: string): Promise<RootModuleSnapshot> {
        const snapshot = createEmptySnapshot()
        if (!targetModRoot) return snapshot

        const targetAffixPath = joinWinPath(targetModRoot, 'Data', 'TuJianChunWenBen.json')
        const targetTalentPath = joinWinPath(targetModRoot, 'Data', 'CreateAvatarJsonData.json')
        const targetStaticSkillPath = joinWinPath(targetModRoot, 'Data', 'StaticSkillJsonData.json')

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
            // ignore and continue
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
            // ignore and continue
        }

        try {
            snapshot.buffMap = (
                await adaptBuffImportWithMerge({
                    modRootPath: targetModRoot,
                    loadProjectEntries,
                    readFilePayload,
                })
            ).data
        } catch {
            // ignore and continue
        }

        try {
            snapshot.itemMap = (
                await adaptItemImportWithMerge({
                    modRootPath: targetModRoot,
                    loadProjectEntries,
                    readFilePayload,
                })
            ).data
        } catch {
            // ignore and continue
        }

        try {
            snapshot.skillMap = (
                await adaptSkillImportWithMerge({
                    modRootPath: targetModRoot,
                    loadProjectEntries,
                    readFilePayload,
                })
            ).data
        } catch {
            // ignore and continue
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
            // ignore and continue
        }

        return snapshot
    }

    function applyRootModuleSnapshot(targetModRoot: string, snapshot: RootModuleSnapshot) {
        const targetAffixPath = joinWinPath(targetModRoot, 'Data', 'TuJianChunWenBen.json')
        const targetTalentPath = joinWinPath(targetModRoot, 'Data', 'CreateAvatarJsonData.json')
        const targetBuffDirPath = joinWinPath(targetModRoot, 'Data', 'BuffJsonData')
        const targetItemDirPath = joinWinPath(targetModRoot, 'Data', 'ItemJsonData')
        const targetSkillDirPath = joinWinPath(targetModRoot, 'Data', 'skillJsonData')
        const targetStaticSkillPath = joinWinPath(targetModRoot, 'Data', 'StaticSkillJsonData.json')

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
        const loaded = await loadProjectEntries(rootPath)
        const modRoot = findModRoot(loaded)
        const nextModRoot = isModRootPath(rootPath) ? rootPath : (modRoot?.path ?? inferModRootPath(rootPath))
        const siblingFolders = await collectSiblingModFolders(nextModRoot)

        setters.setProjectPath(rootPath)
        setters.setModRootPath(nextModRoot)
        setters.setModRootFolders(siblingFolders)
        resetForProjectReload(setters, siblingFolders)

        await preloadMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadBuffSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadItemSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSkillSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadStaticSkillSeidMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadBuffEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadAffixEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadItemEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSkillEnumMeta([rootPath, nextModRoot, workspaceRoot], true)
        await loadSpecialDrawerOptions([rootPath, nextModRoot, workspaceRoot], nextModRoot, true)

        const preloadPairs = await Promise.all(
            siblingFolders.map(async item => [normalizePath(item.path), await readRootModuleSnapshot(item.path)] as const)
        )
        const nextCache = Object.fromEntries(preloadPairs)
        setters.setRootSnapshotCache(nextCache)
        const activeSnapshot = nextCache[normalizePath(nextModRoot)]
        if (activeSnapshot) {
            applyRootModuleSnapshot(nextModRoot, activeSnapshot)
        }
        setters.setStatus(modRoot ? STATUS_MESSAGES.openProjectLoaded(rootPath) : STATUS_MESSAGES.openProjectLoadedFallback(nextModRoot))
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

    return {
        handleOpenProject,
        handleCreateProject,
        handleSelectModRoot,
    }
}
