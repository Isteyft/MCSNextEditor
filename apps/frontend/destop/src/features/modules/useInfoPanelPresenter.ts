import { useMemo } from 'react'

import type { CreateAvatarRow } from '../../components/workspace/InfoPanel'
import type { ModuleKey } from '../../modules'
import type { SkillEntry, StaticSkillEntry } from '../../types'

type SelectOptions = { shift: boolean; ctrl: boolean }
type SelectFn = (key: string, index: number, options: SelectOptions) => void

type UseInfoPanelPresenterParams = {
    activeModule: ModuleKey | ''
    setAddWuDaoOpen: (open: boolean) => void
    setAddWuDaoSkillOpen: (open: boolean) => void
    setAddTalentOpen: (open: boolean) => void
    setAddAffixOpen: (open: boolean) => void
    setAddBuffOpen: (open: boolean) => void
    setAddItemOpen: (open: boolean) => void
    setAddSkillOpen: (open: boolean) => void
    setAddStaticSkillOpen: (open: boolean) => void
    handleBatchPrefixWuDaoIds: (prefix: string) => void
    handleBatchPrefixWuDaoSkillIds: (prefix: string) => void
    handleBatchPrefixAffixIds: (prefix: string) => void
    handleBatchPrefixIds: (prefix: string) => void
    handleBatchPrefixBuffIds: (prefix: string) => void
    handleBatchPrefixItemIds: (prefix: string) => void
    handleBatchPrefixSkillIds: (prefix: string) => void
    handleBatchPrefixStaticSkillIds: (prefix: string) => void
    handleDeleteWuDaos: () => void
    handleDeleteWuDaoSkills: () => void
    handleDeleteAffixes: () => void
    handleDeleteTalents: () => void
    handleDeleteBuffs: () => void
    handleDeleteItems: () => void
    handleDeleteSkills: () => void
    handleDeleteStaticSkills: () => void
    handleCopyWuDao: () => void
    handleCopyWuDaoSkill: () => void
    handleCopyAffix: () => void
    handleCopyTalent: () => void
    handleCopyBuff: () => void
    handleCopyItem: () => void
    handleCopySkill: () => void
    handleCopyStaticSkill: () => void
    handlePasteWuDao: () => void
    handlePasteWuDaoSkill: () => void
    handlePasteAffix: () => void
    handlePasteTalent: () => void
    handlePasteBuff: () => void
    handlePasteItem: () => void
    handlePasteSkill: () => void
    handlePasteStaticSkill: () => void
    handleImportWuDao: (jsonText: string) => void
    handleImportWuDaoSkill: (jsonText: string) => void
    handleImportAffix: (jsonText: string) => void
    handleImportTalent: (jsonText: string) => void
    handleImportBuff: (jsonText: string) => void
    handleImportItem: (jsonText: string) => void
    handleImportSkill: (jsonText: string) => void
    handleImportStaticSkill: (jsonText: string) => void
    handleGenerateSkillGroup: () => void
    handleGenerateStaticSkillGroup: () => void
    handleGenerateSkillBooksFromSkill: () => void
    handleGenerateSkillBooksFromStaticSkill: () => void
    handleSelectWuDao: SelectFn
    handleSelectWuDaoSkill: SelectFn
    handleSelectAffix: SelectFn
    handleSelectTalent: SelectFn
    handleSelectBuff: SelectFn
    handleSelectItem: SelectFn
    handleSelectSkill: SelectFn
    handleSelectStaticSkill: SelectFn
    filteredWuDaoRows: CreateAvatarRow[]
    filteredWuDaoSkillRows: CreateAvatarRow[]
    filteredAffixRows: CreateAvatarRow[]
    filteredAvatarRows: CreateAvatarRow[]
    filteredBuffRows: CreateAvatarRow[]
    filteredItemRows: CreateAvatarRow[]
    filteredSkillRows: CreateAvatarRow[]
    filteredStaticSkillRows: CreateAvatarRow[]
    selectedWuDaoKey: string
    selectedWuDaoSkillKey: string
    selectedAffixKey: string
    selectedTalentKey: string
    selectedBuffKey: string
    selectedItemKey: string
    selectedSkillKey: string
    selectedStaticSkillKey: string
    selectedWuDaoKeys: string[]
    selectedWuDaoSkillKeys: string[]
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
        setAddWuDaoOpen,
        setAddWuDaoSkillOpen,
        setAddTalentOpen,
        setAddAffixOpen,
        setAddBuffOpen,
        setAddItemOpen,
        setAddSkillOpen,
        setAddStaticSkillOpen,
        handleBatchPrefixWuDaoIds,
        handleBatchPrefixWuDaoSkillIds,
        handleBatchPrefixAffixIds,
        handleBatchPrefixIds,
        handleBatchPrefixBuffIds,
        handleBatchPrefixItemIds,
        handleBatchPrefixSkillIds,
        handleBatchPrefixStaticSkillIds,
        handleDeleteWuDaos,
        handleDeleteWuDaoSkills,
        handleDeleteAffixes,
        handleDeleteTalents,
        handleDeleteBuffs,
        handleDeleteItems,
        handleDeleteSkills,
        handleDeleteStaticSkills,
        handleCopyWuDao,
        handleCopyWuDaoSkill,
        handleCopyAffix,
        handleCopyTalent,
        handleCopyBuff,
        handleCopyItem,
        handleCopySkill,
        handleCopyStaticSkill,
        handlePasteWuDao,
        handlePasteWuDaoSkill,
        handlePasteAffix,
        handlePasteTalent,
        handlePasteBuff,
        handlePasteItem,
        handlePasteSkill,
        handlePasteStaticSkill,
        handleImportWuDao,
        handleImportWuDaoSkill,
        handleImportAffix,
        handleImportTalent,
        handleImportBuff,
        handleImportItem,
        handleImportSkill,
        handleImportStaticSkill,
        handleGenerateSkillGroup,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromSkill,
        handleGenerateSkillBooksFromStaticSkill,
        handleSelectWuDao,
        handleSelectWuDaoSkill,
        handleSelectAffix,
        handleSelectTalent,
        handleSelectBuff,
        handleSelectItem,
        handleSelectSkill,
        handleSelectStaticSkill,
        filteredWuDaoRows,
        filteredWuDaoSkillRows,
        filteredAffixRows,
        filteredAvatarRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
        selectedWuDaoKey: selectedWuDaoKeyState,
        selectedWuDaoSkillKey: selectedWuDaoSkillKeyState,
        selectedAffixKey: selectedAffixKeyState,
        selectedTalentKey: selectedTalentKeyState,
        selectedBuffKey: selectedBuffKeyState,
        selectedItemKey: selectedItemKeyState,
        selectedSkillKey: selectedSkillKeyState,
        selectedStaticSkillKey: selectedStaticSkillKeyState,
        selectedWuDaoKeys: selectedWuDaoKeysState,
        selectedWuDaoSkillKeys: selectedWuDaoSkillKeysState,
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
            if (activeModule === 'wudao') return setAddWuDaoOpen(true)
            if (activeModule === 'wudaoskill') return setAddWuDaoSkillOpen(true)
            if (activeModule === 'affix') return setAddAffixOpen(true)
            if (activeModule === 'buff') return setAddBuffOpen(true)
            if (activeModule === 'item') return setAddItemOpen(true)
            if (activeModule === 'skill') return setAddSkillOpen(true)
            if (activeModule === 'staticskill') return setAddStaticSkillOpen(true)
            return setAddTalentOpen(true)
        }

        const onBatchPrefixIds = (prefix: string) => {
            if (activeModule === 'wudao') return handleBatchPrefixWuDaoIds(prefix)
            if (activeModule === 'wudaoskill') return handleBatchPrefixWuDaoSkillIds(prefix)
            if (activeModule === 'affix') return handleBatchPrefixAffixIds(prefix)
            if (activeModule === 'buff') return handleBatchPrefixBuffIds(prefix)
            if (activeModule === 'item') return handleBatchPrefixItemIds(prefix)
            if (activeModule === 'skill') return handleBatchPrefixSkillIds(prefix)
            if (activeModule === 'staticskill') return handleBatchPrefixStaticSkillIds(prefix)
            return handleBatchPrefixIds(prefix)
        }

        const onDeleteTalents = () => {
            if (activeModule === 'wudao') return handleDeleteWuDaos()
            if (activeModule === 'wudaoskill') return handleDeleteWuDaoSkills()
            if (activeModule === 'affix') return handleDeleteAffixes()
            if (activeModule === 'buff') return handleDeleteBuffs()
            if (activeModule === 'item') return handleDeleteItems()
            if (activeModule === 'skill') return handleDeleteSkills()
            if (activeModule === 'staticskill') return handleDeleteStaticSkills()
            return handleDeleteTalents()
        }

        const onCopyTalent = () => {
            if (activeModule === 'wudao') return handleCopyWuDao()
            if (activeModule === 'wudaoskill') return handleCopyWuDaoSkill()
            if (activeModule === 'affix') return handleCopyAffix()
            if (activeModule === 'buff') return handleCopyBuff()
            if (activeModule === 'item') return handleCopyItem()
            if (activeModule === 'skill') return handleCopySkill()
            if (activeModule === 'staticskill') return handleCopyStaticSkill()
            return handleCopyTalent()
        }

        const onPasteTalent = () => {
            if (activeModule === 'wudao') return handlePasteWuDao()
            if (activeModule === 'wudaoskill') return handlePasteWuDaoSkill()
            if (activeModule === 'affix') return handlePasteAffix()
            if (activeModule === 'buff') return handlePasteBuff()
            if (activeModule === 'item') return handlePasteItem()
            if (activeModule === 'skill') return handlePasteSkill()
            if (activeModule === 'staticskill') return handlePasteStaticSkill()
            return handlePasteTalent()
        }

        const onImportTalent = (jsonText: string) => {
            if (activeModule === 'wudao') return handleImportWuDao(jsonText)
            if (activeModule === 'wudaoskill') return handleImportWuDaoSkill(jsonText)
            if (activeModule === 'affix') return handleImportAffix(jsonText)
            if (activeModule === 'buff') return handleImportBuff(jsonText)
            if (activeModule === 'item') return handleImportItem(jsonText)
            if (activeModule === 'skill') return handleImportSkill(jsonText)
            if (activeModule === 'staticskill') return handleImportStaticSkill(jsonText)
            return handleImportTalent(jsonText)
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
            if (activeModule === 'wudao') return handleSelectWuDao(key, index, options)
            if (activeModule === 'wudaoskill') return handleSelectWuDaoSkill(key, index, options)
            if (activeModule === 'affix') return handleSelectAffix(key, index, options)
            if (activeModule === 'buff') return handleSelectBuff(key, index, options)
            if (activeModule === 'item') return handleSelectItem(key, index, options)
            if (activeModule === 'skill') return handleSelectSkill(key, index, options)
            if (activeModule === 'staticskill') return handleSelectStaticSkill(key, index, options)
            return handleSelectTalent(key, index, options)
        }

        const rows =
            activeModule === 'wudao'
                ? filteredWuDaoRows
                : activeModule === 'wudaoskill'
                  ? filteredWuDaoSkillRows
                  : activeModule === 'affix'
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
            activeModule === 'wudao'
                ? selectedWuDaoKeyState
                : activeModule === 'wudaoskill'
                  ? selectedWuDaoSkillKeyState
                  : activeModule === 'affix'
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
            activeModule === 'wudao'
                ? selectedWuDaoKeysState
                : activeModule === 'wudaoskill'
                  ? selectedWuDaoSkillKeysState
                  : activeModule === 'affix'
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
            onImportTalent,
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
        setAddWuDaoOpen,
        setAddAffixOpen,
        setAddTalentOpen,
        setAddBuffOpen,
        setAddItemOpen,
        setAddSkillOpen,
        setAddStaticSkillOpen,
        handleBatchPrefixWuDaoIds,
        handleBatchPrefixWuDaoSkillIds,
        handleBatchPrefixAffixIds,
        handleBatchPrefixIds,
        handleBatchPrefixBuffIds,
        handleBatchPrefixItemIds,
        handleBatchPrefixSkillIds,
        handleBatchPrefixStaticSkillIds,
        handleDeleteWuDaos,
        handleDeleteWuDaoSkills,
        handleDeleteAffixes,
        handleDeleteTalents,
        handleDeleteBuffs,
        handleDeleteItems,
        handleDeleteSkills,
        handleDeleteStaticSkills,
        handleCopyWuDao,
        handleCopyWuDaoSkill,
        handleCopyAffix,
        handleCopyTalent,
        handleCopyBuff,
        handleCopyItem,
        handleCopySkill,
        handleCopyStaticSkill,
        handlePasteWuDao,
        handlePasteWuDaoSkill,
        handlePasteAffix,
        handlePasteTalent,
        handlePasteBuff,
        handlePasteItem,
        handlePasteSkill,
        handlePasteStaticSkill,
        handleImportWuDao,
        handleImportWuDaoSkill,
        handleImportAffix,
        handleImportTalent,
        handleImportBuff,
        handleImportItem,
        handleImportSkill,
        handleImportStaticSkill,
        handleGenerateSkillGroup,
        handleGenerateStaticSkillGroup,
        handleGenerateSkillBooksFromSkill,
        handleGenerateSkillBooksFromStaticSkill,
        handleSelectWuDao,
        handleSelectWuDaoSkill,
        handleSelectAffix,
        handleSelectTalent,
        handleSelectBuff,
        handleSelectItem,
        handleSelectSkill,
        handleSelectStaticSkill,
        filteredWuDaoRows,
        filteredWuDaoSkillRows,
        filteredAffixRows,
        filteredAvatarRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
        selectedWuDaoKeyState,
        selectedAffixKeyState,
        selectedTalentKeyState,
        selectedBuffKeyState,
        selectedItemKeyState,
        selectedSkillKeyState,
        selectedStaticSkillKeyState,
        selectedWuDaoKeysState,
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
