import { mergeStaticSkillSeidFiles } from '../../components/staticskill/staticskill-domain'
import { mergeTalentSeidFiles } from '../../components/tianfu/talent-domain'
import type { ModuleKey } from '../../modules'
import { joinWinPath } from '../../utils/path'
import { parseJsonObject, parseJsonUnknown, readJsonUnknownWithFallback } from '../json-import/json-import-core'
import {
    adaptAffixImport,
    adaptBuffImportWithMerge,
    adaptItemImportWithMerge,
    adaptSkillImportWithMerge,
    adaptStaticSkillImport,
    adaptTalentImport,
} from '../json-import/module-adapters'

type Setter = (value: any) => void

type Params = {
    moduleConfigPath: string
    modRootPath: string
    projectPath: string
    workspaceRoot: string
    configCachePath: string
    createAvatarPath: string
    talentCachePath: string
    talentDirty: boolean
    affixPath: string
    affixCachePath: string
    affixDirty: boolean
    buffDirPath: string
    buffCachePath: string
    buffDirty: boolean
    itemDirPath: string
    itemCachePath: string
    itemDirty: boolean
    skillDirPath: string
    skillCachePath: string
    skillDirty: boolean
    staticSkillPath: string
    staticSkillCachePath: string
    staticSkillDirty: boolean
    setViewMode: Setter
    setActivePath: Setter
    setStatus: Setter
    setRawConfigObject: Setter
    setPreservedSettings: Setter
    setConfigForm: Setter
    setConfigCachePath: Setter
    setConfigDirty: Setter
    setTalentMap: Setter
    setTalentPath: Setter
    setTalentCachePath: Setter
    setTalentDirty: Setter
    setSelectedTalentKey: Setter
    setSelectedTalentKeys: Setter
    setTalentSelectionAnchor: Setter
    setAffixMap: Setter
    setAffixCachePath: Setter
    setAffixDirty: Setter
    setSelectedAffixKey: Setter
    setSelectedAffixKeys: Setter
    setAffixSelectionAnchor: Setter
    setBuffMap: Setter
    setBuffCachePath: Setter
    setBuffDirty: Setter
    setSelectedBuffKey: Setter
    setSelectedBuffKeys: Setter
    setBuffSelectionAnchor: Setter
    setItemMap: Setter
    setItemCachePath: Setter
    setItemDirty: Setter
    setSelectedItemKey: Setter
    setSelectedItemKeys: Setter
    setItemSelectionAnchor: Setter
    setSkillMap: Setter
    setSkillCachePath: Setter
    setSkillDirty: Setter
    setSelectedSkillKey: Setter
    setSelectedSkillKeys: Setter
    setSkillSelectionAnchor: Setter
    setStaticSkillMap: Setter
    setStaticSkillCachePath: Setter
    setStaticSkillDirty: Setter
    setSelectedStaticSkillKey: Setter
    setSelectedStaticSkillKeys: Setter
    setStaticSkillSelectionAnchor: Setter
    setActiveModule: Setter
    setTableSearchText: Setter
    readFilePayload: (path: string) => Promise<any>
    saveFilePayload: (path: string, content: string) => Promise<any>
    loadProjectEntries: (path: string) => Promise<any>
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
}

export function useModuleLoaders(params: Params) {
    const {
        moduleConfigPath,
        modRootPath,
        projectPath,
        workspaceRoot,
        configCachePath,
        createAvatarPath,
        talentCachePath,
        talentDirty,
        affixPath,
        affixCachePath,
        affixDirty,
        buffDirPath,
        buffCachePath,
        buffDirty,
        itemDirPath,
        itemCachePath,
        itemDirty,
        skillDirPath,
        skillCachePath,
        skillDirty,
        staticSkillPath,
        staticSkillCachePath,
        staticSkillDirty,
        setViewMode,
        setActivePath,
        setStatus,
        setRawConfigObject,
        setPreservedSettings,
        setConfigForm,
        setConfigCachePath,
        setConfigDirty,
        setTalentMap,
        setTalentPath,
        setTalentCachePath,
        setTalentDirty,
        setSelectedTalentKey,
        setSelectedTalentKeys,
        setTalentSelectionAnchor,
        setAffixMap,
        setAffixCachePath,
        setAffixDirty,
        setSelectedAffixKey,
        setSelectedAffixKeys,
        setAffixSelectionAnchor,
        setBuffMap,
        setBuffCachePath,
        setBuffDirty,
        setSelectedBuffKey,
        setSelectedBuffKeys,
        setBuffSelectionAnchor,
        setItemMap,
        setItemCachePath,
        setItemDirty,
        setSelectedItemKey,
        setSelectedItemKeys,
        setItemSelectionAnchor,
        setSkillMap,
        setSkillCachePath,
        setSkillDirty,
        setSelectedSkillKey,
        setSelectedSkillKeys,
        setSkillSelectionAnchor,
        setStaticSkillMap,
        setStaticSkillCachePath,
        setStaticSkillDirty,
        setSelectedStaticSkillKey,
        setSelectedStaticSkillKeys,
        setStaticSkillSelectionAnchor,
        setActiveModule,
        setTableSearchText,
        readFilePayload,
        saveFilePayload,
        loadProjectEntries,
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
    } = params

    async function loadConfigForm() {
        setViewMode('config-form')
        setActivePath(moduleConfigPath)
        if (!modRootPath || !moduleConfigPath) return
        if (configCachePath === moduleConfigPath) return
        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: moduleConfigPath,
                defaultContent: '{\n  "Name": "",\n  "Author": "",\n  "Version": "0.0.1",\n  "Description": "",\n  "Settings": []\n}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonObject(payload.content, {}, moduleConfigPath)
            const parsed = parsedResult.data
            setRawConfigObject(parsed)
            setPreservedSettings(Object.prototype.hasOwnProperty.call(parsed, 'Settings') ? parsed.Settings : [])
            setConfigForm({
                name: String(parsed.Name ?? ''),
                author: String(parsed.Author ?? ''),
                version: String(parsed.Version ?? '0.0.1'),
                description: String(parsed.Description ?? ''),
            })
            setConfigCachePath(moduleConfigPath)
            setConfigDirty(false)
        } catch (error) {
            setStatus(`读取配置失败: ${String(error)}`)
        }
    }

    async function loadTalentTable() {
        setViewMode('table')
        setActivePath(createAvatarPath)
        if (!modRootPath || !createAvatarPath) return
        if (talentCachePath === createAvatarPath) {
            setStatus(talentDirty ? '已加载天赋数据（缓存，未保存）。' : '已加载天赋数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: createAvatarPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, createAvatarPath)
            const parsed = parsedResult.ok ? parsedResult.data : {}
            const normalized = adaptTalentImport(parsed).data
            const finalData = await mergeTalentSeidFiles({
                source: normalized,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setTalentMap(finalData)
            setTalentPath(createAvatarPath)
            setTalentCachePath(createAvatarPath)
            setTalentDirty(false)
            setSelectedTalentKey(firstKey)
            setSelectedTalentKeys(firstKey ? [firstKey] : [])
            setTalentSelectionAnchor(firstKey)
            setStatus('已加载天赋数据（CreateAvatarJsonData）。')
        } catch (error) {
            setStatus(`读取天赋数据失败: ${String(error)}`)
        }
    }

    async function loadAffixTable() {
        setViewMode('table')
        setActivePath(affixPath)
        if (!modRootPath || !affixPath) return
        if (affixCachePath === affixPath) {
            setStatus(affixDirty ? '已加载词缀数据（缓存，未保存）。' : '已加载词缀数据（缓存）。')
            return
        }
        await loadAffixEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: affixPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, affixPath)
            const parsed = parsedResult.ok ? parsedResult.data : {}
            const normalized = adaptAffixImport(parsed).data
            const firstKey = Object.keys(normalized).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setAffixMap(normalized)
            setAffixCachePath(affixPath)
            setAffixDirty(false)
            setSelectedAffixKey(firstKey)
            setSelectedAffixKeys(firstKey ? [firstKey] : [])
            setAffixSelectionAnchor(firstKey)
            setStatus('已加载词缀数据（TuJianChunWenBen）。')
        } catch (error) {
            setStatus(`读取词缀数据失败: ${String(error)}`)
        }
    }

    async function loadBuffTable() {
        setViewMode('table')
        setActivePath(buffDirPath)
        if (!modRootPath || !buffDirPath) return
        if (buffCachePath === buffDirPath) {
            setStatus(buffDirty ? '已加载 Buff 数据（缓存，未保存）。' : '已加载 Buff 数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSpecialDrawerOptions([modRootPath, projectPath, workspaceRoot], modRootPath, true)
        try {
            const finalData = (
                await adaptBuffImportWithMerge({
                    modRootPath,
                    loadProjectEntries,
                    readFilePayload,
                })
            ).data
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setBuffMap(finalData)
            setBuffCachePath(buffDirPath)
            setBuffDirty(false)
            setSelectedBuffKey(firstKey)
            setSelectedBuffKeys(firstKey ? [firstKey] : [])
            setBuffSelectionAnchor(firstKey)
            setStatus('已加载 Buff 数据（BuffJsonData）。')
        } catch (error) {
            setStatus(`读取 Buff 数据失败: ${String(error)}`)
        }
    }

    async function loadItemTable() {
        setViewMode('table')
        setActivePath(itemDirPath)
        if (!modRootPath || !itemDirPath) return
        if (itemCachePath === itemDirPath) {
            setStatus(itemDirty ? '已加载 Item 数据（缓存，未保存）。' : '已加载 Item 数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadItemSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadItemEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const finalData = (
                await adaptItemImportWithMerge({
                    modRootPath,
                    loadProjectEntries,
                    readFilePayload,
                })
            ).data
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setItemMap(finalData)
            setItemCachePath(itemDirPath)
            setItemDirty(false)
            setSelectedItemKey(firstKey)
            setSelectedItemKeys(firstKey ? [firstKey] : [])
            setItemSelectionAnchor(firstKey)
            setStatus('已加载 Item 数据（ItemJsonData）。')
        } catch (error) {
            setStatus(`读取 Item 数据失败: ${String(error)}`)
        }
    }

    async function loadSkillTable() {
        setViewMode('table')
        setActivePath(skillDirPath)
        if (!modRootPath || !skillDirPath) return
        if (skillCachePath === skillDirPath) {
            setStatus(skillDirty ? '已加载 Skill 数据（缓存，未保存）。' : '已加载 Skill 数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const finalData = (
                await adaptSkillImportWithMerge({
                    modRootPath,
                    loadProjectEntries,
                    readFilePayload,
                })
            ).data
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setSkillMap(finalData)
            setSkillCachePath(skillDirPath)
            setSkillDirty(false)
            setSelectedSkillKey(firstKey)
            setSelectedSkillKeys(firstKey ? [firstKey] : [])
            setSkillSelectionAnchor(firstKey)
            setStatus('已加载 Skill 数据（skillJsonData）。')
        } catch (error) {
            setStatus(`读取 Skill 数据失败: ${String(error)}`)
        }
    }

    async function loadStaticSkillTable() {
        setViewMode('table')
        setActivePath(staticSkillPath)
        if (!modRootPath || !staticSkillPath) return
        if (staticSkillCachePath === staticSkillPath) {
            setStatus(staticSkillDirty ? '已加载功法数据（缓存，未保存）。' : '已加载功法数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadStaticSkillSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: staticSkillPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, staticSkillPath)
            const parsed = parsedResult.ok ? parsedResult.data : {}
            const normalized = adaptStaticSkillImport(parsed).data
            const finalData = await mergeStaticSkillSeidFiles({
                source: normalized,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setStaticSkillMap(finalData)
            setStaticSkillCachePath(staticSkillPath)
            setStaticSkillDirty(false)
            setSelectedStaticSkillKey(firstKey)
            setSelectedStaticSkillKeys(firstKey ? [firstKey] : [])
            setStaticSkillSelectionAnchor(firstKey)
            setStatus('已加载功法数据（StaticSkillJsonData）。')
        } catch (error) {
            setStatus(`读取功法数据失败: ${String(error)}`)
        }
    }

    async function handleSelectModule(key: ModuleKey) {
        setActiveModule(key)
        setTableSearchText('')
        if (key === 'project-config') return loadConfigForm()
        if (key === 'talent') return loadTalentTable()
        if (key === 'affix') return loadAffixTable()
        if (key === 'buff') return loadBuffTable()
        if (key === 'item') return loadItemTable()
        if (key === 'skill') return loadSkillTable()
        if (key === 'staticskill') return loadStaticSkillTable()
        setViewMode('todo')
        setActivePath('')
    }

    return {
        handleSelectModule,
        loadConfigForm,
        loadTalentTable,
        loadAffixTable,
        loadBuffTable,
        loadItemTable,
        loadSkillTable,
        loadStaticSkillTable,
    }
}
