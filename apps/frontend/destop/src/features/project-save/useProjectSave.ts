import { saveAffixFile } from '../../components/affix/affix-domain'
import { saveBackpackFile } from '../../components/backpack/backpack-domain'
import { saveBuffFiles, saveBuffSeidFiles } from '../../components/buff/buff-domain'
import { saveItemFiles, saveItemSeidFiles } from '../../components/item/item-domain'
import { saveNpcFile } from '../../components/npc/npc-domain'
import { saveNpcImportantFile } from '../../components/npcimportant/npcimportant-domain'
import { saveNpcTypeFile } from '../../components/npctype/npctype-domain'
import { saveNpcWuDaoFile } from '../../components/npcwudao/npcwudao-domain'
import { saveSkillFiles, saveSkillSeidFiles } from '../../components/skill/skill-domain'
import { saveStaticSkillFile, saveStaticSkillSeidFiles } from '../../components/staticskill/staticskill-domain'
import { saveTalentSeidFiles } from '../../components/tianfu/talent-domain'
import { saveWuDaoFile } from '../../components/wudao/wudao-domain'
import { saveWuDaoSkillFile, saveWuDaoSkillSeidFiles } from '../../components/wudaoskill/wudaoskill-domain'
import { ensureModStructure } from '../../services/project-api'
import { joinWinPath } from '../../utils/path'

type Setter = (value: any) => void

type Params = {
    projectPath: string
    modRootPath: string
    moduleConfigPath: string
    rawConfigObject: Record<string, unknown>
    configForm: { name: string; author: string; version: string; description: string }
    preservedSettings: unknown
    npcMap: Record<string, any>
    npcPath: string
    npcImportantMap: Record<string, any>
    npcImportantPath: string
    npcTypeMap: Record<string, any>
    npcTypePath: string
    npcTypeCachePath: string
    npcWuDaoMap: Record<string, any>
    npcWuDaoPath: string
    backpackMap: Record<string, any>
    backpackPath: string
    wudaoMap: Record<string, any>
    wudaoPath: string
    wudaoSkillMap: Record<string, any>
    wudaoSkillPath: string
    talentPath: string
    createAvatarPath: string
    talentMap: Record<string, any>
    affixMap: Record<string, any>
    affixPath: string
    buffMap: Record<string, any>
    itemMap: Record<string, any>
    skillMap: Record<string, any>
    staticSkillMap: Record<string, any>
    staticSkillPath: string
    buffDirPath: string
    itemDirPath: string
    skillDirPath: string
    loadProjectEntries: (rootPath: string) => Promise<any[]>
    saveFilePayload: (path: string, content: string) => Promise<any>
    deleteFilePayload: (path: string) => Promise<any>
    setConfigDirty: Setter
    setNpcDirty: Setter
    setNpcImportantDirty: Setter
    setNpcTypeDirty: Setter
    setNpcWuDaoDirty: Setter
    setBackpackDirty: Setter
    setWuDaoDirty: Setter
    setWuDaoSkillDirty: Setter
    setAffixDirty: Setter
    setTalentDirty: Setter
    setBuffDirty: Setter
    setItemDirty: Setter
    setSkillDirty: Setter
    setStaticSkillDirty: Setter
    setNpcCachePath: Setter
    setNpcImportantCachePath: Setter
    setNpcTypeCachePath: Setter
    setNpcWuDaoCachePath: Setter
    setBackpackCachePath: Setter
    setAffixCachePath: Setter
    setWuDaoSkillCachePath: Setter
    setTalentCachePath: Setter
    setBuffCachePath: Setter
    setItemCachePath: Setter
    setSkillCachePath: Setter
    setStaticSkillCachePath: Setter
    setStatus: Setter
    onProjectSavingChange?: (payload: { open: boolean; progress: number; message: string }) => void
}

export function useProjectSave(params: Params) {
    const {
        projectPath,
        modRootPath,
        moduleConfigPath,
        rawConfigObject,
        configForm,
        preservedSettings,
        npcMap,
        npcPath,
        npcImportantMap,
        npcImportantPath,
        npcTypeMap,
        npcTypePath,
        npcTypeCachePath,
        npcWuDaoMap,
        npcWuDaoPath,
        backpackMap,
        backpackPath,
        wudaoMap,
        wudaoPath,
        wudaoSkillMap,
        wudaoSkillPath,
        talentPath,
        createAvatarPath,
        talentMap,
        affixMap,
        affixPath,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        staticSkillPath,
        buffDirPath,
        itemDirPath,
        skillDirPath,
        loadProjectEntries,
        saveFilePayload,
        deleteFilePayload,
        setConfigDirty,
        setNpcDirty,
        setNpcImportantDirty,
        setNpcTypeDirty,
        setNpcWuDaoDirty,
        setBackpackDirty,
        setWuDaoDirty,
        setWuDaoSkillDirty,
        setAffixDirty,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setNpcCachePath,
        setNpcImportantCachePath,
        setNpcTypeCachePath,
        setNpcWuDaoCachePath,
        setBackpackCachePath,
        setAffixCachePath,
        setWuDaoSkillCachePath,
        setTalentCachePath,
        setBuffCachePath,
        setItemCachePath,
        setSkillCachePath,
        setStaticSkillCachePath,
        setStatus,
        onProjectSavingChange,
    } = params

    async function handleSaveProject() {
        if (!projectPath || !modRootPath || !moduleConfigPath) {
            setStatus('请先打开项目后再保存。')
            return
        }

        const totalSteps = 20
        let completedSteps = 0
        const report = (message: string) => {
            onProjectSavingChange?.({
                open: true,
                progress: Math.max(0, Math.min(100, Math.round((completedSteps / totalSteps) * 100))),
                message,
            })
        }
        const finishStep = (message: string) => {
            completedSteps += 1
            report(message)
        }

        try {
            report('正在准备保存项目...')
            await ensureModStructure(modRootPath)
            finishStep('已完成目录结构检查')

            const configPayload = {
                ...rawConfigObject,
                Name: configForm.name,
                Author: configForm.author,
                Version: configForm.version,
                Description: configForm.description,
                Settings: preservedSettings,
            }
            await saveFilePayload(moduleConfigPath, `${JSON.stringify(configPayload, null, 2)}\n`)
            finishStep('已保存项目配置')

            const talentTarget = talentPath || createAvatarPath
            const normalizedTalentPayload = Object.fromEntries(
                Object.values(talentMap).map((row: any) => [String(row.id), { ...row, id: row.id }])
            )
            await saveFilePayload(talentTarget, `${JSON.stringify(normalizedTalentPayload, null, 2)}\n`)
            finishStep('已保存天赋主文件')

            const talentSeidFileCount = await saveTalentSeidFiles({
                talentMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存天赋 Seid 数据')

            const affixFileCount = await saveAffixFile({ affixMap, affixPath, saveFilePayload })
            finishStep('已保存词缀数据')

            await saveNpcFile({ npcMap, npcPath, saveFilePayload })
            finishStep('已保存非实例 NPC 数据')

            await saveNpcImportantFile({ npcImportantMap, npcImportantPath, saveFilePayload })
            finishStep('已保存重要NPC数据')

            const resolvedNpcTypePath = npcTypeCachePath || npcTypePath
            await saveNpcTypeFile({ npcTypeMap, npcTypePath: resolvedNpcTypePath, saveFilePayload })
            finishStep('已保存 NPC类型 数据')

            const npcWuDaoFileCount = await saveNpcWuDaoFile({ npcWuDaoMap, npcWuDaoPath, saveFilePayload })
            finishStep('已保存 NPC悟道 数据')

            const backpackFileCount = await saveBackpackFile({ backpackMap, backpackPath, saveFilePayload })
            finishStep('已保存背包数据')

            await saveWuDaoFile({ wudaoMap, wudaoPath, saveFilePayload })
            finishStep('已保存悟道数据')

            const wudaoSkillFileCount = await saveWuDaoSkillFile({ wudaoSkillMap, wudaoSkillPath, saveFilePayload })
            finishStep('已保存悟道技能数据')

            const wudaoSkillSeidFileCount = await saveWuDaoSkillSeidFiles({
                wudaoSkillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存悟道技能 Seid 数据')

            const buffFileCount = await saveBuffFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存 Buff 数据')

            const buffSeidFileCount = await saveBuffSeidFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存 Buff Seid 数据')

            const itemFileCount = await saveItemFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存物品数据')

            const itemSeidFileCount = await saveItemSeidFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存物品 Seid 数据')

            const skillFileCount = await saveSkillFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存神通数据')

            const skillSeidFileCount = await saveSkillSeidFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存神通 Seid 数据')

            const staticSkillFileCount = await saveStaticSkillFile({ staticSkillMap, staticSkillPath, saveFilePayload })
            finishStep('已保存功法数据')

            const staticSkillSeidFileCount = await saveStaticSkillSeidFiles({
                staticSkillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            finishStep('已保存功法 Seid 数据')

            setConfigDirty(false)
            setNpcDirty(false)
            setNpcImportantDirty(false)
            setNpcTypeDirty(false)
            setNpcWuDaoDirty(false)
            setBackpackDirty(false)
            setWuDaoDirty(false)
            setWuDaoSkillDirty(false)
            setAffixDirty(false)
            setTalentDirty(false)
            setBuffDirty(false)
            setItemDirty(false)
            setSkillDirty(false)
            setStaticSkillDirty(false)
            setNpcCachePath(npcPath)
            setNpcImportantCachePath(npcImportantPath)
            setNpcTypeCachePath(resolvedNpcTypePath)
            setNpcWuDaoCachePath(npcWuDaoPath)
            setBackpackCachePath(backpackPath)
            setAffixCachePath(affixPath)
            setWuDaoSkillCachePath(wudaoSkillPath)
            setTalentCachePath(talentTarget)
            setBuffCachePath(buffDirPath)
            setItemCachePath(itemDirPath)
            setSkillCachePath(skillDirPath)
            setStaticSkillCachePath(staticSkillPath)
            onProjectSavingChange?.({ open: true, progress: 100, message: '保存完成' })
            setStatus(
                `项目已保存：NPC悟道 ${npcWuDaoFileCount} 条；背包 ${backpackFileCount} 条；悟道 ${Object.keys(wudaoMap).length} 条；悟道技能 ${wudaoSkillFileCount} 条，WuDaoSeid ${wudaoSkillSeidFileCount} 个；词缀 ${affixFileCount} 条；天赋Seid ${talentSeidFileCount} 个；Buff ${buffFileCount} 个，BuffSeid ${buffSeidFileCount} 个；Item ${itemFileCount} 个，ItemSeid ${itemSeidFileCount} 个；Skill ${skillFileCount} 个，SkillSeid ${skillSeidFileCount} 个；StaticSkill ${staticSkillFileCount} 条，StaticSkillSeid ${staticSkillSeidFileCount} 个。`
            )
        } catch (error) {
            setStatus(`保存项目失败: ${String(error)}`)
        } finally {
            window.setTimeout(() => {
                onProjectSavingChange?.({ open: false, progress: 0, message: '' })
            }, 200)
        }
    }

    return { handleSaveProject }
}
