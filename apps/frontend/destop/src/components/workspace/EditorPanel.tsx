import { ViewMode } from '../../modules'
import type { AffixEntry, BuffEntry, ItemEntry, SkillEntry, StaticSkillEntry } from '../../types'
import { AffixForm } from '../affix/AffixForm'
import { BuffForm } from '../buff/BuffForm'
import { ItemForm } from '../item/ItemForm'
import { SettingsForm } from '../settings/SettingsForm'
import { SkillForm } from '../skill/SkillForm'
import { StaticSkillForm } from '../staticskill/StaticSkillForm'
import { TalentForm } from '../tianfu/TalentForm'
import { ProjectConfigForm } from './ProjectConfigForm'

type EditorPanelProps = {
    viewMode: ViewMode
    activeModule: string
    activeModuleLabel: string
    configForm: {
        name: string
        author: string
        version: string
        description: string
    }
    onChangeConfigForm: (patch: Partial<EditorPanelProps['configForm']>) => void
    affixForm: AffixEntry | null
    onChangeAffixForm: (patch: Partial<AffixEntry>) => void
    talentForm: {
        id: number
        Title: string
        fenLeiGuanLian: number
        fenLei: string
        seid: number[]
        seidData?: Record<string, Record<string, string | number | number[]>>
        Desc: string
        Info: string
    } | null
    onChangeTalentForm: (patch: Partial<NonNullable<EditorPanelProps['talentForm']>>) => void
    buffForm: BuffEntry | null
    buffIconDir: string
    onChangeBuffForm: (patch: Partial<BuffEntry>) => void
    itemForm: ItemEntry | null
    itemIconDir: string
    onChangeItemForm: (patch: Partial<ItemEntry>) => void
    skillForm: SkillEntry | null
    skillIconDir: string
    onChangeSkillForm: (patch: Partial<SkillEntry>) => void
    staticSkillForm: StaticSkillEntry | null
    onChangeStaticSkillForm: (patch: Partial<StaticSkillEntry>) => void
    talentTypeOptions: { id: number; name: string }[]
    buffTypeOptions: { id: number; name: string }[]
    buffTriggerOptions: { id: number; name: string }[]
    buffRemoveTriggerOptions: { id: number; name: string }[]
    buffOverlayTypeOptions: { id: number; name: string }[]
    skillAttackTypeOptions: { id: number; name: string }[]
    skillConsultTypeOptions: { id: number; name: string }[]
    skillPhaseOptions: { id: number; name: string }[]
    skillQualityOptions: { id: number; name: string }[]
    itemGuideTypeOptions: { id: number; name: string }[]
    itemShopTypeOptions: { id: number; name: string }[]
    itemUseTypeOptions: { id: number; name: string }[]
    itemTypeOptions: { id: number; name: string }[]
    itemQualityOptions: { id: number; name: string }[]
    itemPhaseOptions: { id: number; name: string }[]
    affixTypeOptions: { id: number; name: string }[]
    affixProjectTypeOptions: { id: number; name: string }[]
    affixDrawerOptions: { id: number; name: string }[]
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
    settingsForm: {
        jsonImportFolderPaths: string[]
        jsonImportFilePaths: string[]
        uniqueIdSyncEnabled: boolean
        uniqueIdSyncTriggerLevels: number[]
        batchIdChangeKeepOriginal: boolean
        autoSaveEnabled: boolean
        autoSaveIntervalSeconds: number
        autoSyncSkillDescrWithAtlas: boolean
        replaceSkillDescrWithSpecialFormat: boolean
        mainWindowWidth: number
        mainWindowHeight: number
    }
    onChangeSettingsForm: (patch: Partial<EditorPanelProps['settingsForm']>) => void
}

export function EditorPanel({
    viewMode,
    activeModule,
    activeModuleLabel,
    configForm,
    onChangeConfigForm,
    affixForm,
    onChangeAffixForm,
    talentForm,
    onChangeTalentForm,
    buffForm,
    buffIconDir,
    onChangeBuffForm,
    itemForm,
    itemIconDir,
    onChangeItemForm,
    skillForm,
    skillIconDir,
    onChangeSkillForm,
    staticSkillForm,
    onChangeStaticSkillForm,
    talentTypeOptions,
    buffTypeOptions,
    buffTriggerOptions,
    buffRemoveTriggerOptions,
    buffOverlayTypeOptions,
    skillAttackTypeOptions,
    skillConsultTypeOptions,
    skillPhaseOptions,
    skillQualityOptions,
    itemGuideTypeOptions,
    itemShopTypeOptions,
    itemUseTypeOptions,
    itemTypeOptions,
    itemQualityOptions,
    itemPhaseOptions,
    affixTypeOptions,
    affixProjectTypeOptions,
    affixDrawerOptions,
    onOpenSeidEditor,
    seidDisplayRows,
    settingsForm,
    onChangeSettingsForm,
}: EditorPanelProps) {
    return (
        <section className="panel panel-editor">
            <h2>编辑区域</h2>
            <div className="panel-content editor-wrap">
                {activeModule === 'settings' ? <SettingsForm values={settingsForm} onChange={onChangeSettingsForm} /> : null}

                {viewMode === 'config-form' ? <ProjectConfigForm values={configForm} onChange={onChangeConfigForm} /> : null}

                {activeModule !== 'settings' && viewMode === 'todo' ? (
                    <div className="todo-box">TODO: {activeModuleLabel === '-' ? '请选择模块' : activeModuleLabel}</div>
                ) : null}

                {activeModule !== 'settings' && viewMode === 'table' ? (
                    activeModule === 'affix' ? (
                        <AffixForm
                            values={affixForm}
                            onChange={onChangeAffixForm}
                            affixTypeOptions={affixTypeOptions}
                            affixProjectTypeOptions={affixProjectTypeOptions}
                        />
                    ) : activeModule === 'talent' ? (
                        <TalentForm
                            onOpenSeidEditor={onOpenSeidEditor}
                            seidDisplayRows={seidDisplayRows}
                            typeOptions={talentTypeOptions}
                            values={talentForm}
                            onChange={onChangeTalentForm}
                        />
                    ) : activeModule === 'buff' ? (
                        <BuffForm
                            buffIconDir={buffIconDir}
                            onOpenSeidEditor={onOpenSeidEditor}
                            seidDisplayRows={seidDisplayRows}
                            values={buffForm}
                            onChange={onChangeBuffForm}
                            buffTypeOptions={buffTypeOptions}
                            buffTriggerOptions={buffTriggerOptions}
                            buffRemoveTriggerOptions={buffRemoveTriggerOptions}
                            buffOverlayTypeOptions={buffOverlayTypeOptions}
                            affixOptions={affixDrawerOptions}
                        />
                    ) : activeModule === 'item' ? (
                        <ItemForm
                            itemIconDir={itemIconDir}
                            onOpenSeidEditor={onOpenSeidEditor}
                            seidDisplayRows={seidDisplayRows}
                            values={itemForm}
                            onChange={onChangeItemForm}
                            guideTypeOptions={itemGuideTypeOptions}
                            itemShopTypeOptions={itemShopTypeOptions}
                            itemUseTypeOptions={itemUseTypeOptions}
                            itemTypeOptions={itemTypeOptions}
                            itemQualityOptions={itemQualityOptions}
                            itemPhaseOptions={itemPhaseOptions}
                            affixOptions={affixDrawerOptions}
                        />
                    ) : activeModule === 'skill' ? (
                        <SkillForm
                            skillIconDir={skillIconDir}
                            onOpenSeidEditor={onOpenSeidEditor}
                            seidDisplayRows={seidDisplayRows}
                            values={skillForm}
                            onChange={onChangeSkillForm}
                            attackTypeOptions={skillAttackTypeOptions}
                            skillConsultTypeOptions={skillConsultTypeOptions}
                            skillPhaseOptions={skillPhaseOptions}
                            skillQualityOptions={skillQualityOptions}
                            affixOptions={affixDrawerOptions}
                        />
                    ) : activeModule === 'staticskill' ? (
                        <StaticSkillForm
                            skillIconDir={skillIconDir}
                            onOpenSeidEditor={onOpenSeidEditor}
                            seidDisplayRows={seidDisplayRows}
                            values={staticSkillForm}
                            onChange={onChangeStaticSkillForm}
                            attackTypeOptions={skillAttackTypeOptions}
                            skillConsultTypeOptions={skillConsultTypeOptions}
                            skillPhaseOptions={skillPhaseOptions}
                            skillQualityOptions={skillQualityOptions}
                            affixOptions={affixDrawerOptions}
                        />
                    ) : (
                        <div className="todo-box">TODO: {activeModuleLabel}</div>
                    )
                ) : null}
            </div>
        </section>
    )
}
