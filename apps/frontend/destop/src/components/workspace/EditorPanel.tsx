import { ViewMode } from '../../modules'
import type { BuffEntry, SkillEntry, StaticSkillEntry } from '../../types'
import { BuffForm } from '../buff/BuffForm'
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
    onOpenSeidEditor: () => void
    seidDisplayRows: { id: number; name: string }[]
}

export function EditorPanel({
    viewMode,
    activeModule,
    activeModuleLabel,
    configForm,
    onChangeConfigForm,
    talentForm,
    onChangeTalentForm,
    buffForm,
    buffIconDir,
    onChangeBuffForm,
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
    onOpenSeidEditor,
    seidDisplayRows,
}: EditorPanelProps) {
    return (
        <section className="panel panel-editor">
            <h2>编辑区域</h2>
            <div className="panel-content editor-wrap">
                {viewMode === 'config-form' ? <ProjectConfigForm values={configForm} onChange={onChangeConfigForm} /> : null}

                {viewMode === 'todo' ? (
                    <div className="todo-box">TODO: {activeModuleLabel === '-' ? '请选择模块' : activeModuleLabel}</div>
                ) : null}

                {viewMode === 'table' ? (
                    activeModule === 'talent' ? (
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
                        />
                    ) : (
                        <div className="todo-box">TODO: {activeModuleLabel}</div>
                    )
                ) : null}
            </div>
        </section>
    )
}
