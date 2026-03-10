import { saveAffixFile } from '../../components/affix/affix-domain'
import { saveBuffFiles, saveBuffSeidFiles } from '../../components/buff/buff-domain'
import { saveItemFiles, saveItemSeidFiles } from '../../components/item/item-domain'
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
    setWuDaoDirty: Setter
    setWuDaoSkillDirty: Setter
    setAffixDirty: Setter
    setTalentDirty: Setter
    setBuffDirty: Setter
    setItemDirty: Setter
    setSkillDirty: Setter
    setStaticSkillDirty: Setter
    setAffixCachePath: Setter
    setWuDaoSkillCachePath: Setter
    setTalentCachePath: Setter
    setBuffCachePath: Setter
    setItemCachePath: Setter
    setSkillCachePath: Setter
    setStaticSkillCachePath: Setter
    setStatus: Setter
}

export function useProjectSave(params: Params) {
    const {
        projectPath,
        modRootPath,
        moduleConfigPath,
        rawConfigObject,
        configForm,
        preservedSettings,
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
        setWuDaoDirty,
        setWuDaoSkillDirty,
        setAffixDirty,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setAffixCachePath,
        setWuDaoSkillCachePath,
        setTalentCachePath,
        setBuffCachePath,
        setItemCachePath,
        setSkillCachePath,
        setStaticSkillCachePath,
        setStatus,
    } = params

    async function handleSaveProject() {
        if (!projectPath || !modRootPath || !moduleConfigPath) {
            setStatus('请先打开项目后再保存。')
            return
        }

        try {
            await ensureModStructure(modRootPath)
            const configPayload = {
                ...rawConfigObject,
                Name: configForm.name,
                Author: configForm.author,
                Version: configForm.version,
                Description: configForm.description,
                Settings: preservedSettings,
            }
            await saveFilePayload(moduleConfigPath, `${JSON.stringify(configPayload, null, 2)}\n`)

            const talentTarget = talentPath || createAvatarPath
            const normalizedTalentPayload = Object.fromEntries(
                Object.values(talentMap).map((row: any) => [String(row.id), { ...row, id: row.id }])
            )
            await saveFilePayload(talentTarget, `${JSON.stringify(normalizedTalentPayload, null, 2)}\n`)

            const talentSeidFileCount = await saveTalentSeidFiles({
                talentMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const affixFileCount = await saveAffixFile({
                affixMap,
                affixPath,
                saveFilePayload,
            })
            await saveWuDaoFile({
                wudaoMap,
                wudaoPath,
                saveFilePayload,
            })
            const wudaoSkillFileCount = await saveWuDaoSkillFile({
                wudaoSkillMap,
                wudaoSkillPath,
                saveFilePayload,
            })
            const wudaoSkillSeidFileCount = await saveWuDaoSkillSeidFiles({
                wudaoSkillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const buffFileCount = await saveBuffFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const buffSeidFileCount = await saveBuffSeidFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const itemFileCount = await saveItemFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const itemSeidFileCount = await saveItemSeidFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const skillFileCount = await saveSkillFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const skillSeidFileCount = await saveSkillSeidFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })
            const staticSkillFileCount = await saveStaticSkillFile({
                staticSkillMap,
                staticSkillPath,
                saveFilePayload,
            })
            const staticSkillSeidFileCount = await saveStaticSkillSeidFiles({
                staticSkillMap,
                modRootPath,
                joinWinPath,
                loadProjectEntries,
                deleteFilePayload,
                saveFilePayload,
            })

            setConfigDirty(false)
            setWuDaoDirty(false)
            setWuDaoSkillDirty(false)
            setAffixDirty(false)
            setTalentDirty(false)
            setBuffDirty(false)
            setItemDirty(false)
            setSkillDirty(false)
            setStaticSkillDirty(false)
            setAffixCachePath(affixPath)
            setWuDaoSkillCachePath(wudaoSkillPath)
            setTalentCachePath(talentTarget)
            setBuffCachePath(buffDirPath)
            setItemCachePath(itemDirPath)
            setSkillCachePath(skillDirPath)
            setStaticSkillCachePath(staticSkillPath)
            setStatus(
                `项目已保存：${moduleConfigPath}；悟道 ${Object.keys(wudaoMap).length} 条；悟道技能 ${wudaoSkillFileCount} 条，WuDaoSeid ${wudaoSkillSeidFileCount} 个；词缀 ${affixFileCount} 条；天赋Seid ${talentSeidFileCount} 个；Buff ${buffFileCount} 个，BuffSeid ${buffSeidFileCount} 个；Item ${itemFileCount} 个，ItemSeid ${itemSeidFileCount} 个；Skill ${skillFileCount} 个，SkillSeid ${skillSeidFileCount} 个；StaticSkill ${staticSkillFileCount} 条，StaticSkillSeid ${staticSkillSeidFileCount} 个`
            )
        } catch (error) {
            setStatus(`保存项目失败: ${String(error)}`)
        }
    }

    return { handleSaveProject }
}
