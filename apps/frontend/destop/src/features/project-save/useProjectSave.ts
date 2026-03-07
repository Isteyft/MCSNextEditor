import { saveAffixFile } from '../../components/affix/affix-domain'
import { saveBuffFiles, saveBuffSeidFiles } from '../../components/buff/buff-domain'
import { saveItemFiles, saveItemSeidFiles } from '../../components/item/item-domain'
import { saveSkillFiles, saveSkillSeidFiles } from '../../components/skill/skill-domain'
import { saveStaticSkillFile, saveStaticSkillSeidFiles } from '../../components/staticskill/staticskill-domain'
import { saveTalentSeidFiles } from '../../components/tianfu/talent-domain'
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
    readFilePayload: (path: string) => Promise<any>
    saveFilePayload: (path: string, content: string) => Promise<any>
    setConfigDirty: Setter
    setAffixDirty: Setter
    setTalentDirty: Setter
    setBuffDirty: Setter
    setItemDirty: Setter
    setSkillDirty: Setter
    setStaticSkillDirty: Setter
    setAffixCachePath: Setter
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
        readFilePayload,
        saveFilePayload,
        setConfigDirty,
        setAffixDirty,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setAffixCachePath,
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

            const seidFileCount = await saveTalentSeidFiles({
                talentMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const affixFileCount = await saveAffixFile({
                affixMap,
                affixPath,
                saveFilePayload,
            })

            const buffFileCount = await saveBuffFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })
            const buffSeidFileCount = await saveBuffSeidFiles({
                buffMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const itemFileCount = await saveItemFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })
            const itemSeidFileCount = await saveItemSeidFiles({
                itemMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
                saveFilePayload,
            })
            const skillFileCount = await saveSkillFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                saveFilePayload,
            })
            const skillSeidFileCount = await saveSkillSeidFiles({
                skillMap,
                modRootPath,
                joinWinPath,
                readFilePayload,
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
                readFilePayload,
                saveFilePayload,
            })

            setConfigDirty(false)
            setAffixDirty(false)
            setTalentDirty(false)
            setBuffDirty(false)
            setItemDirty(false)
            setSkillDirty(false)
            setStaticSkillDirty(false)
            setAffixCachePath(affixPath)
            setTalentCachePath(talentTarget)
            setBuffCachePath(buffDirPath)
            setItemCachePath(itemDirPath)
            setSkillCachePath(skillDirPath)
            setStaticSkillCachePath(staticSkillPath)
            setStatus(
                `项目已保存：${moduleConfigPath}；词缀 ${affixFileCount} 条；天赋Seid ${seidFileCount} 个；Buff ${buffFileCount} 个，BuffSeid ${buffSeidFileCount} 个；Item ${itemFileCount} 个，ItemSeid ${itemSeidFileCount} 个；Skill ${skillFileCount} 个，SkillSeid ${skillSeidFileCount} 个；StaticSkill ${staticSkillFileCount} 条，StaticSkillSeid ${staticSkillSeidFileCount} 个`
            )
        } catch (error) {
            setStatus(`保存项目失败: ${String(error)}`)
        }
    }

    return { handleSaveProject }
}
