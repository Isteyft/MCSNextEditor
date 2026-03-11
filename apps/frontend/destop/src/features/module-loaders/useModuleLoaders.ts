import { mergeStaticSkillSeidFiles } from '../../components/staticskill/staticskill-domain'
import { mergeTalentSeidFiles } from '../../components/tianfu/talent-domain'
import { mergeWuDaoSkillSeidFiles } from '../../components/wudaoskill/wudaoskill-domain'
import type { ModuleKey } from '../../modules'
import { joinWinPath } from '../../utils/path'
import { parseJsonObject, parseJsonUnknown, readJsonUnknownWithFallback } from '../json-import/json-import-core'
import {
    adaptAffixImport,
    adaptBackpackImport,
    adaptBuffImportWithMerge,
    adaptItemImportWithMerge,
    adaptNpcImport,
    adaptNpcWuDaoImport,
    adaptSkillImportWithMerge,
    adaptStaticSkillImport,
    adaptTalentImport,
    adaptWuDaoImport,
    adaptWuDaoSkillImport,
} from '../json-import/module-adapters'

type Setter = (value: any) => void

type Params = {
    moduleConfigPath: string
    modRootPath: string
    projectPath: string
    workspaceRoot: string
    configCachePath: string
    npcPath: string
    npcWuDaoPath: string
    backpackPath: string
    npcCachePath: string
    npcWuDaoCachePath: string
    backpackCachePath: string
    npcDirty: boolean
    npcWuDaoDirty: boolean
    backpackDirty: boolean
    wudaoPath: string
    wudaoCachePath: string
    wudaoDirty: boolean
    wudaoSkillPath: string
    wudaoSkillCachePath: string
    wudaoSkillDirty: boolean
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
    setNpcMap: Setter
    setNpcWuDaoMap: Setter
    setBackpackMap: Setter
    setNpcCachePath: Setter
    setNpcWuDaoCachePath: Setter
    setBackpackCachePath: Setter
    setNpcDirty: Setter
    setNpcWuDaoDirty: Setter
    setBackpackDirty: Setter
    setSelectedNpcKey: Setter
    setSelectedNpcWuDaoKey: Setter
    setSelectedBackpackKey: Setter
    setSelectedNpcKeys: Setter
    setSelectedNpcWuDaoKeys: Setter
    setSelectedBackpackKeys: Setter
    setNpcSelectionAnchor: Setter
    setNpcWuDaoSelectionAnchor: Setter
    setBackpackSelectionAnchor: Setter
    setWuDaoMap: Setter
    setWuDaoCachePath: Setter
    setWuDaoDirty: Setter
    setSelectedWuDaoKey: Setter
    setSelectedWuDaoKeys: Setter
    setWuDaoSelectionAnchor: Setter
    setWuDaoSkillMap: Setter
    setWuDaoSkillCachePath: Setter
    setWuDaoSkillDirty: Setter
    setSelectedWuDaoSkillKey: Setter
    setSelectedWuDaoSkillKeys: Setter
    setWuDaoSkillSelectionAnchor: Setter
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
        npcPath,
        npcWuDaoPath,
        backpackPath,
        npcCachePath,
        npcWuDaoCachePath,
        backpackCachePath,
        npcDirty,
        npcWuDaoDirty,
        backpackDirty,
        wudaoPath,
        wudaoCachePath,
        wudaoDirty,
        wudaoSkillPath,
        wudaoSkillCachePath,
        wudaoSkillDirty,
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
        setNpcMap,
        setNpcWuDaoMap,
        setBackpackMap,
        setNpcCachePath,
        setNpcWuDaoCachePath,
        setBackpackCachePath,
        setNpcDirty,
        setNpcWuDaoDirty,
        setBackpackDirty,
        setSelectedNpcKey,
        setSelectedNpcWuDaoKey,
        setSelectedBackpackKey,
        setSelectedNpcKeys,
        setSelectedNpcWuDaoKeys,
        setSelectedBackpackKeys,
        setNpcSelectionAnchor,
        setNpcWuDaoSelectionAnchor,
        setBackpackSelectionAnchor,
        setWuDaoMap,
        setWuDaoCachePath,
        setWuDaoDirty,
        setSelectedWuDaoKey,
        setSelectedWuDaoKeys,
        setWuDaoSelectionAnchor,
        setWuDaoSkillMap,
        setWuDaoSkillCachePath,
        setWuDaoSkillDirty,
        setSelectedWuDaoSkillKey,
        setSelectedWuDaoSkillKeys,
        setWuDaoSkillSelectionAnchor,
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

    async function loadJsonTable(
        filePath: string,
        cachePath: string,
        dirty: boolean,
        parse: (raw: unknown) => Record<string, any>,
        apply: (rows: Record<string, any>, firstKey: string) => void,
        label: string
    ) {
        setViewMode('table')
        setActivePath(filePath)
        if (!modRootPath || !filePath) return
        if (cachePath === filePath) {
            setStatus(dirty ? `已加载${label}（缓存，未保存）。` : `已加载${label}（缓存）。`)
            return
        }
        try {
            const payload = await readJsonUnknownWithFallback({ filePath, defaultContent: '{}\n', readFilePayload, saveFilePayload })
            const parsedResult = parseJsonUnknown(payload.content, filePath)
            const rows = parse(parsedResult.ok ? parsedResult.data : {})
            const firstKey = Object.keys(rows).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            apply(rows, firstKey)
            setStatus(`已加载${label}。`)
        } catch (error) {
            setStatus(`读取${label}失败: ${String(error)}`)
        }
    }

    async function loadNpcTable() {
        return loadJsonTable(
            npcPath,
            npcCachePath,
            npcDirty,
            raw => adaptNpcImport(raw).data,
            (rows, firstKey) => {
                setNpcMap(rows)
                setNpcCachePath(npcPath)
                setNpcDirty(false)
                setSelectedNpcKey(firstKey)
                setSelectedNpcKeys(firstKey ? [firstKey] : [])
                setNpcSelectionAnchor(firstKey)
            },
            '非实例NPC数据'
        )
    }

    async function loadNpcWuDaoTable() {
        return loadJsonTable(
            npcWuDaoPath,
            npcWuDaoCachePath,
            npcWuDaoDirty,
            raw => adaptNpcWuDaoImport(raw).data,
            (rows, firstKey) => {
                setNpcWuDaoMap(rows)
                setNpcWuDaoCachePath(npcWuDaoPath)
                setNpcWuDaoDirty(false)
                setSelectedNpcWuDaoKey(firstKey)
                setSelectedNpcWuDaoKeys(firstKey ? [firstKey] : [])
                setNpcWuDaoSelectionAnchor(firstKey)
            },
            'NPC悟道数据'
        )
    }

    async function loadBackpackTable() {
        return loadJsonTable(
            backpackPath,
            backpackCachePath,
            backpackDirty,
            raw => adaptBackpackImport(raw).data,
            (rows, firstKey) => {
                setBackpackMap(rows)
                setBackpackCachePath(backpackPath)
                setBackpackDirty(false)
                setSelectedBackpackKey(firstKey)
                setSelectedBackpackKeys(firstKey ? [firstKey] : [])
                setBackpackSelectionAnchor(firstKey)
            },
            '背包数据'
        )
    }

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

    async function loadWuDaoTable() {
        return loadJsonTable(
            wudaoPath,
            wudaoCachePath,
            wudaoDirty,
            raw => adaptWuDaoImport(raw).data,
            (rows, firstKey) => {
                setWuDaoMap(rows)
                setWuDaoCachePath(wudaoPath)
                setWuDaoDirty(false)
                setSelectedWuDaoKey(firstKey)
                setSelectedWuDaoKeys(firstKey ? [firstKey] : [])
                setWuDaoSelectionAnchor(firstKey)
            },
            '悟道数据'
        )
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
            const normalized = adaptTalentImport(parsedResult.ok ? parsedResult.data : {}).data
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
            setStatus('已加载天赋数据。')
        } catch (error) {
            setStatus(`读取天赋数据失败: ${String(error)}`)
        }
    }

    async function loadWuDaoSkillTable() {
        setViewMode('table')
        setActivePath(wudaoSkillPath)
        if (!modRootPath || !wudaoSkillPath) return
        if (wudaoSkillCachePath === wudaoSkillPath) {
            setStatus(wudaoSkillDirty ? '已加载悟道技能数据（缓存，未保存）。' : '已加载悟道技能数据（缓存）。')
            return
        }
        await loadStaticSkillSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const payload = await readJsonUnknownWithFallback({
                filePath: wudaoSkillPath,
                defaultContent: '{}\n',
                readFilePayload,
                saveFilePayload,
            })
            const parsedResult = parseJsonUnknown(payload.content, wudaoSkillPath)
            const normalized = adaptWuDaoSkillImport(parsedResult.ok ? parsedResult.data : {}).data
            const finalData = await mergeWuDaoSkillSeidFiles({
                source: normalized,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                readFilePayload,
            })
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setWuDaoSkillMap(finalData)
            setWuDaoSkillCachePath(wudaoSkillPath)
            setWuDaoSkillDirty(false)
            setSelectedWuDaoSkillKey(firstKey)
            setSelectedWuDaoSkillKeys(firstKey ? [firstKey] : [])
            setWuDaoSkillSelectionAnchor(firstKey)
            setStatus('已加载悟道技能数据。')
        } catch (error) {
            setStatus(`读取悟道技能数据失败: ${String(error)}`)
        }
    }

    async function loadAffixTable() {
        await loadAffixEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        return loadJsonTable(
            affixPath,
            affixCachePath,
            affixDirty,
            raw => adaptAffixImport(raw).data,
            (rows, firstKey) => {
                setAffixMap(rows)
                setAffixCachePath(affixPath)
                setAffixDirty(false)
                setSelectedAffixKey(firstKey)
                setSelectedAffixKeys(firstKey ? [firstKey] : [])
                setAffixSelectionAnchor(firstKey)
            },
            '词缀数据'
        )
    }

    async function loadBuffTable() {
        setViewMode('table')
        setActivePath(buffDirPath)
        if (!modRootPath || !buffDirPath) return
        if (buffCachePath === buffDirPath) {
            setStatus(buffDirty ? '已加载Buff数据（缓存，未保存）。' : '已加载Buff数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadBuffEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSpecialDrawerOptions([modRootPath, projectPath, workspaceRoot], modRootPath, true)
        try {
            const finalData = (await adaptBuffImportWithMerge({ modRootPath, loadProjectEntries, readFilePayload })).data
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setBuffMap(finalData)
            setBuffCachePath(buffDirPath)
            setBuffDirty(false)
            setSelectedBuffKey(firstKey)
            setSelectedBuffKeys(firstKey ? [firstKey] : [])
            setBuffSelectionAnchor(firstKey)
            setStatus('已加载Buff数据。')
        } catch (error) {
            setStatus(`读取Buff数据失败: ${String(error)}`)
        }
    }

    async function loadItemTable() {
        setViewMode('table')
        setActivePath(itemDirPath)
        if (!modRootPath || !itemDirPath) return
        if (itemCachePath === itemDirPath) {
            setStatus(itemDirty ? '已加载物品数据（缓存，未保存）。' : '已加载物品数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadItemSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadItemEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const finalData = (await adaptItemImportWithMerge({ modRootPath, loadProjectEntries, readFilePayload })).data
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setItemMap(finalData)
            setItemCachePath(itemDirPath)
            setItemDirty(false)
            setSelectedItemKey(firstKey)
            setSelectedItemKeys(firstKey ? [firstKey] : [])
            setItemSelectionAnchor(firstKey)
            setStatus('已加载物品数据。')
        } catch (error) {
            setStatus(`读取物品数据失败: ${String(error)}`)
        }
    }

    async function loadSkillTable() {
        setViewMode('table')
        setActivePath(skillDirPath)
        if (!modRootPath || !skillDirPath) return
        if (skillCachePath === skillDirPath) {
            setStatus(skillDirty ? '已加载神通数据（缓存，未保存）。' : '已加载神通数据（缓存）。')
            return
        }
        await preloadMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillSeidMeta([modRootPath, projectPath, workspaceRoot], true)
        await loadSkillEnumMeta([modRootPath, projectPath, workspaceRoot], true)
        try {
            const finalData = (await adaptSkillImportWithMerge({ modRootPath, loadProjectEntries, readFilePayload })).data
            const firstKey = Object.keys(finalData).sort((a, b) => Number(a) - Number(b))[0] ?? ''
            setSkillMap(finalData)
            setSkillCachePath(skillDirPath)
            setSkillDirty(false)
            setSelectedSkillKey(firstKey)
            setSelectedSkillKeys(firstKey ? [firstKey] : [])
            setSkillSelectionAnchor(firstKey)
            setStatus('已加载神通数据。')
        } catch (error) {
            setStatus(`读取神通数据失败: ${String(error)}`)
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
            const normalized = adaptStaticSkillImport(parsedResult.ok ? parsedResult.data : {}).data
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
            setStatus('已加载功法数据。')
        } catch (error) {
            setStatus(`读取功法数据失败: ${String(error)}`)
        }
    }

    async function handleSelectModule(key: ModuleKey) {
        setActiveModule(key)
        setTableSearchText('')
        if (key === 'project-config') return loadConfigForm()
        if (key === 'npc') return loadNpcTable()
        if (key === 'npcwudao') return loadNpcWuDaoTable()
        if (key === 'backpack') return loadBackpackTable()
        if (key === 'wudao') return loadWuDaoTable()
        if (key === 'wudaoskill') return loadWuDaoSkillTable()
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
        loadNpcTable,
        loadNpcWuDaoTable,
        loadBackpackTable,
        loadWuDaoTable,
        loadWuDaoSkillTable,
        loadTalentTable,
        loadAffixTable,
        loadBuffTable,
        loadItemTable,
        loadSkillTable,
        loadStaticSkillTable,
    }
}
