import { useMemo } from 'react'

import type { SeidMetaItem } from '../../components/tianfu/SeidPickerModal'
import type { ModuleKey } from '../../modules'
import type { BuffEntry, CreateAvatarEntry, ItemEntry, SkillEntry, StaticSkillEntry, WuDaoSkillEntry } from '../../types'

type UseSeidDerivedStateParams = {
    activeModule: ModuleKey | ''
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    selectedTalentKey: string
    selectedBuffKey: string
    selectedItemKey: string
    selectedSkillKey: string
    selectedStaticSkillKey: string
    selectedWuDaoSkillKey: string
    seidMetaMap: Record<number, SeidMetaItem>
    buffSeidMetaMap: Record<number, SeidMetaItem>
    itemEquipSeidMetaMap: Record<number, SeidMetaItem>
    itemUseSeidMetaMap: Record<number, SeidMetaItem>
    skillSeidMetaMap: Record<number, SeidMetaItem>
    staticSkillSeidMetaMap: Record<number, SeidMetaItem>
}

export function useSeidDerivedState({
    activeModule,
    talentMap,
    buffMap,
    itemMap,
    skillMap,
    staticSkillMap,
    wudaoSkillMap,
    selectedTalentKey,
    selectedBuffKey,
    selectedItemKey,
    selectedSkillKey,
    selectedStaticSkillKey,
    selectedWuDaoSkillKey,
    seidMetaMap,
    buffSeidMetaMap,
    itemEquipSeidMetaMap,
    itemUseSeidMetaMap,
    skillSeidMetaMap,
    staticSkillSeidMetaMap,
}: UseSeidDerivedStateParams) {
    const selectedTalent = useMemo(
        () => (selectedTalentKey ? (talentMap[selectedTalentKey] ?? null) : null),
        [talentMap, selectedTalentKey]
    )
    const selectedBuff = useMemo(() => (selectedBuffKey ? (buffMap[selectedBuffKey] ?? null) : null), [buffMap, selectedBuffKey])
    const selectedItem = useMemo(() => (selectedItemKey ? (itemMap[selectedItemKey] ?? null) : null), [itemMap, selectedItemKey])
    const selectedSkill = useMemo(() => (selectedSkillKey ? (skillMap[selectedSkillKey] ?? null) : null), [skillMap, selectedSkillKey])
    const selectedStaticSkill = useMemo(
        () => (selectedStaticSkillKey ? (staticSkillMap[selectedStaticSkillKey] ?? null) : null),
        [staticSkillMap, selectedStaticSkillKey]
    )
    const selectedWuDaoSkill = useMemo(
        () => (selectedWuDaoSkillKey ? (wudaoSkillMap[selectedWuDaoSkillKey] ?? null) : null),
        [wudaoSkillMap, selectedWuDaoSkillKey]
    )

    const activeSeidMetaMap = useMemo(() => {
        if (activeModule === 'buff') return buffSeidMetaMap
        if (activeModule === 'item') {
            const itemType = Number(selectedItem?.type ?? -1)
            const isEquipItem = itemType === 0 || itemType === 1 || itemType === 2
            return isEquipItem ? itemEquipSeidMetaMap : itemUseSeidMetaMap
        }
        if (activeModule === 'skill') return skillSeidMetaMap
        if (activeModule === 'wudaoskill') return staticSkillSeidMetaMap
        if (activeModule === 'staticskill') return staticSkillSeidMetaMap
        return seidMetaMap
    }, [
        activeModule,
        buffSeidMetaMap,
        selectedItem,
        itemEquipSeidMetaMap,
        itemUseSeidMetaMap,
        skillSeidMetaMap,
        staticSkillSeidMetaMap,
        seidMetaMap,
    ])

    const seidPickerItems = useMemo(() => Object.values(activeSeidMetaMap).sort((a, b) => a.id - b.id), [activeSeidMetaMap])

    const selectedSeidOwner = useMemo(
        () =>
            activeModule === 'buff'
                ? selectedBuff
                : activeModule === 'item'
                  ? selectedItem
                  : activeModule === 'skill'
                    ? selectedSkill
                    : activeModule === 'wudaoskill'
                      ? selectedWuDaoSkill
                      : activeModule === 'staticskill'
                        ? selectedStaticSkill
                        : selectedTalent,
        [activeModule, selectedBuff, selectedItem, selectedSkill, selectedStaticSkill, selectedTalent, selectedWuDaoSkill]
    )

    const selectedSeidIds = useMemo(() => selectedSeidOwner?.seid ?? [], [selectedSeidOwner])
    const selectedSeidData = useMemo(() => selectedSeidOwner?.seidData ?? {}, [selectedSeidOwner])

    const selectedSeidDisplayRows = useMemo(
        () =>
            selectedSeidIds.map(id => ({
                id,
                name: activeSeidMetaMap[id]?.name ?? '',
            })),
        [selectedSeidIds, activeSeidMetaMap]
    )

    return {
        selectedTalent,
        selectedBuff,
        selectedItem,
        selectedSkill,
        selectedStaticSkill,
        selectedWuDaoSkill,
        activeSeidMetaMap,
        seidPickerItems,
        selectedSeidDisplayRows,
        selectedSeidOwner,
        selectedSeidIds,
        selectedSeidData,
    }
}
