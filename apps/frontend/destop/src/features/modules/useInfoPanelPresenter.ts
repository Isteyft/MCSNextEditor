import { useMemo } from 'react'

import type { CreateAvatarRow } from '../../components/workspace/InfoPanel'
import type { ModuleKey } from '../../modules'
import type { SkillEntry, StaticSkillEntry } from '../../types'

type SelectOptions = { shift: boolean; ctrl: boolean }
type SelectFn = (key: string, index: number, options: SelectOptions) => void

type UseInfoPanelPresenterParams = {
    activeModule: ModuleKey | ''
    setAddTalentOpen: (open: boolean) => void
    setAddAffixOpen: (open: boolean) => void
    setAddBuffOpen: (open: boolean) => void
    setAddItemOpen: (open: boolean) => void
    setAddSkillOpen: (open: boolean) => void
    setAddStaticSkillOpen: (open: boolean) => void
    handleBatchPrefixAffixIds: (prefix: string) => void
    handleBatchPrefixIds: (prefix: string) => void
    handleBatchPrefixBuffIds: (prefix: string) => void
    handleBatchPrefixItemIds: (prefix: string) => void
    handleBatchPrefixSkillIds: (prefix: string) => void
    handleBatchPrefixStaticSkillIds: (prefix: string) => void
    handleDeleteAffixes: () => void
    handleDeleteTalents: () => void
    handleDeleteBuffs: () => void
    handleDeleteItems: () => void
    handleDeleteSkills: () => void
    handleDeleteStaticSkills: () => void
    handleCopyAffix: () => void
    handleCopyTalent: () => void
    handleCopyBuff: () => void
    handleCopyItem: () => void
    handleCopySkill: () => void
    handleCopyStaticSkill: () => void
    handlePasteAffix: () => void
    handlePasteTalent: () => void
    handlePasteBuff: () => void
    handlePasteItem: () => void
    handlePasteSkill: () => void
    handlePasteStaticSkill: () => void
    handleGenerateSkillGroup: () => void
    handleGenerateStaticSkillGroup: () => void
    handleGenerateSkillBooksFromSkill: () => void
    handleGenerateSkillBooksFromStaticSkill: () => void
    handleSelectAffix: SelectFn
    handleSelectTalent: SelectFn
    handleSelectBuff: SelectFn
    handleSelectItem: SelectFn
    handleSelectSkill: SelectFn
    handleSelectStaticSkill: SelectFn
    filteredAffixRows: CreateAvatarRow[]
    filteredAvatarRows: CreateAvatarRow[]
    filteredBuffRows: CreateAvatarRow[]
    filteredItemRows: CreateAvatarRow[]
    filteredSkillRows: CreateAvatarRow[]
    filteredStaticSkillRows: CreateAvatarRow[]
    selectedAffixKey: string
    selectedTalentKey: string
    selectedBuffKey: string
    selectedItemKey: string
    selectedSkillKey: string
    selectedStaticSkillKey: string
    selectedAffixKeys: string[]
    selectedTalentKeys: string[]
    selectedBuffKeys: string[]
    selectedItemKeys: string[]
    selectedSkillKeys: string[]
    selectedStaticSkillKeys: string[]
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
}

export function useInfoPanelPresenter(params: UseInfoPanelPresenterParams) {
    const {
        activeModule,
        setAddTalentOpen,
        setAddAffixOpen,
        setAddBuffOpen,
        setAddItemOpen,
        setAddSkillOpen,
        setAddStaticSkillOpen,
        handleBatchPrefixAffixIds,
        handleBatchPrefixIds,
        handleBatchPrefixBuffIds,
        handleBatchPrefixItemIds,
        handleBatchPrefixSkillIds,
        handleBatchPrefixStaticSkillIds,
        handleDeleteAffixes,
        handleDeleteTalents,
        handleDeleteBuffs,
        handleDeleteItems,
        handleDeleteSkills,
        handleDeleteStaticSkills,
        handleCopyAffix,
        handleCopyTalent,
        handleCopyBuff,
        handleCopyItem,
        handleCopySkill,
        handleCopyStaticSkill,
        handlePasteAffix,
        handlePasteTalent,
        handlePasteBuff,
        handlePasteItem,
        handlePasteSkill,
        handlePasteStaticSkill,
        handleGenerateSkillGroup,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromSkill,
        handleGenerateSkillBooksFromStaticSkill,
        handleSelectAffix,
        handleSelectTalent,
        handleSelectBuff,
        handleSelectItem,
        handleSelectSkill,
        handleSelectStaticSkill,
        filteredAffixRows,
        filteredAvatarRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
        selectedAffixKey: selectedAffixKeyState,
        selectedTalentKey: selectedTalentKeyState,
        selectedBuffKey: selectedBuffKeyState,
        selectedItemKey: selectedItemKeyState,
        selectedSkillKey: selectedSkillKeyState,
        selectedStaticSkillKey: selectedStaticSkillKeyState,
        selectedAffixKeys: selectedAffixKeysState,
        selectedTalentKeys: selectedTalentKeysState,
        selectedBuffKeys: selectedBuffKeysState,
        selectedItemKeys: selectedItemKeysState,
        selectedSkillKeys: selectedSkillKeysState,
        selectedStaticSkillKeys: selectedStaticSkillKeysState,
        skillMap,
        staticSkillMap,
    } = params

    return useMemo(() => {
        const onAddTalent = () => {
            if (activeModule === 'affix') return setAddAffixOpen(true)
            if (activeModule === 'buff') return setAddBuffOpen(true)
            if (activeModule === 'item') return setAddItemOpen(true)
            if (activeModule === 'skill') return setAddSkillOpen(true)
            if (activeModule === 'staticskill') return setAddStaticSkillOpen(true)
            return setAddTalentOpen(true)
        }

        const onBatchPrefixIds = (prefix: string) => {
            if (activeModule === 'affix') return handleBatchPrefixAffixIds(prefix)
            if (activeModule === 'buff') return handleBatchPrefixBuffIds(prefix)
            if (activeModule === 'item') return handleBatchPrefixItemIds(prefix)
            if (activeModule === 'skill') return handleBatchPrefixSkillIds(prefix)
            if (activeModule === 'staticskill') return handleBatchPrefixStaticSkillIds(prefix)
            return handleBatchPrefixIds(prefix)
        }

        const onDeleteTalents = () => {
            if (activeModule === 'affix') return handleDeleteAffixes()
            if (activeModule === 'buff') return handleDeleteBuffs()
            if (activeModule === 'item') return handleDeleteItems()
            if (activeModule === 'skill') return handleDeleteSkills()
            if (activeModule === 'staticskill') return handleDeleteStaticSkills()
            return handleDeleteTalents()
        }

        const onCopyTalent = () => {
            if (activeModule === 'affix') return handleCopyAffix()
            if (activeModule === 'buff') return handleCopyBuff()
            if (activeModule === 'item') return handleCopyItem()
            if (activeModule === 'skill') return handleCopySkill()
            if (activeModule === 'staticskill') return handleCopyStaticSkill()
            return handleCopyTalent()
        }

        const onPasteTalent = () => {
            if (activeModule === 'affix') return handlePasteAffix()
            if (activeModule === 'buff') return handlePasteBuff()
            if (activeModule === 'item') return handlePasteItem()
            if (activeModule === 'skill') return handlePasteSkill()
            if (activeModule === 'staticskill') return handlePasteStaticSkill()
            return handlePasteTalent()
        }

        const onGenerateGroup =
            activeModule === 'skill'
                ? handleGenerateSkillGroup
                : activeModule === 'staticskill'
                  ? handleGenerateStaticSkillGroup
                  : undefined

        const canGenerateGroup =
            activeModule === 'skill'
                ? selectedSkillKeysState.length === 1 &&
                  Boolean(selectedSkillKeyState) &&
                  Number(skillMap[selectedSkillKeyState]?.Skill_Lv ?? -1) === 0
                : activeModule === 'staticskill'
                  ? selectedStaticSkillKeysState.length === 1 &&
                    Boolean(selectedStaticSkillKeyState) &&
                    Number(staticSkillMap[selectedStaticSkillKeyState]?.Skill_Lv ?? -1) === 0
                  : false

        const onGenerateBook =
            activeModule === 'skill'
                ? handleGenerateSkillBooksFromSkill
                : activeModule === 'staticskill'
                  ? handleGenerateSkillBooksFromStaticSkill
                  : undefined

        const canGenerateBook =
            activeModule === 'skill'
                ? selectedSkillKeysState.length > 0 || Boolean(selectedSkillKeyState)
                : activeModule === 'staticskill'
                  ? selectedStaticSkillKeysState.length > 0 || Boolean(selectedStaticSkillKeyState)
                  : false

        const onSelectTalent: SelectFn = (key, index, options) => {
            if (activeModule === 'affix') return handleSelectAffix(key, index, options)
            if (activeModule === 'buff') return handleSelectBuff(key, index, options)
            if (activeModule === 'item') return handleSelectItem(key, index, options)
            if (activeModule === 'skill') return handleSelectSkill(key, index, options)
            if (activeModule === 'staticskill') return handleSelectStaticSkill(key, index, options)
            return handleSelectTalent(key, index, options)
        }

        const rows =
            activeModule === 'affix'
                ? filteredAffixRows
                : activeModule === 'buff'
                  ? filteredBuffRows
                  : activeModule === 'item'
                    ? filteredItemRows
                    : activeModule === 'skill'
                      ? filteredSkillRows
                      : activeModule === 'staticskill'
                        ? filteredStaticSkillRows
                        : filteredAvatarRows

        const selectedTalentKey =
            activeModule === 'affix'
                ? selectedAffixKeyState
                : activeModule === 'buff'
                  ? selectedBuffKeyState
                  : activeModule === 'item'
                    ? selectedItemKeyState
                    : activeModule === 'skill'
                      ? selectedSkillKeyState
                      : activeModule === 'staticskill'
                        ? selectedStaticSkillKeyState
                        : selectedTalentKeyState

        const selectedTalentKeys =
            activeModule === 'affix'
                ? selectedAffixKeysState
                : activeModule === 'buff'
                  ? selectedBuffKeysState
                  : activeModule === 'item'
                    ? selectedItemKeysState
                    : activeModule === 'skill'
                      ? selectedSkillKeysState
                      : activeModule === 'staticskill'
                        ? selectedStaticSkillKeysState
                        : selectedTalentKeysState

        return {
            onAddTalent,
            onBatchPrefixIds,
            onDeleteTalents,
            onCopyTalent,
            onPasteTalent,
            onGenerateGroup,
            canGenerateGroup,
            generateGroupLabel: activeModule === 'staticskill' ? '生成功法组' : '生成技能组',
            onGenerateBook,
            canGenerateBook,
            generateBookLabel: '生成技能书',
            onSelectTalent,
            rows,
            selectedTalentKey,
            selectedTalentKeys,
        }
    }, [
        activeModule,
        setAddAffixOpen,
        setAddTalentOpen,
        setAddBuffOpen,
        setAddItemOpen,
        setAddSkillOpen,
        setAddStaticSkillOpen,
        handleBatchPrefixAffixIds,
        handleBatchPrefixIds,
        handleBatchPrefixBuffIds,
        handleBatchPrefixItemIds,
        handleBatchPrefixSkillIds,
        handleBatchPrefixStaticSkillIds,
        handleDeleteAffixes,
        handleDeleteTalents,
        handleDeleteBuffs,
        handleDeleteItems,
        handleDeleteSkills,
        handleDeleteStaticSkills,
        handleCopyAffix,
        handleCopyTalent,
        handleCopyBuff,
        handleCopyItem,
        handleCopySkill,
        handleCopyStaticSkill,
        handlePasteAffix,
        handlePasteTalent,
        handlePasteBuff,
        handlePasteItem,
        handlePasteSkill,
        handlePasteStaticSkill,
        handleGenerateSkillGroup,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromSkill,
        handleGenerateSkillBooksFromStaticSkill,
        handleSelectAffix,
        handleSelectTalent,
        handleSelectBuff,
        handleSelectItem,
        handleSelectSkill,
        handleSelectStaticSkill,
        filteredAffixRows,
        filteredAvatarRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
        selectedAffixKeyState,
        selectedTalentKeyState,
        selectedBuffKeyState,
        selectedItemKeyState,
        selectedSkillKeyState,
        selectedStaticSkillKeyState,
        selectedAffixKeysState,
        selectedTalentKeysState,
        selectedBuffKeysState,
        selectedItemKeysState,
        selectedSkillKeysState,
        selectedStaticSkillKeysState,
        skillMap,
        staticSkillMap,
    ])
}
