import { useMemo } from 'react'

import { toAffixRows } from '../../components/affix/affix-domain'
import { toBackpackRows } from '../../components/backpack/backpack-domain'
import { toBuffRows } from '../../components/buff/buff-domain'
import { toItemRows } from '../../components/item/item-domain'
import { toNpcRows } from '../../components/npc/npc-domain'
import { toNpcImportantRows } from '../../components/npcimportant/npcimportant-domain'
import { toNpcTypeRows } from '../../components/npctype/npctype-domain'
import { toNpcWuDaoRows } from '../../components/npcwudao/npcwudao-domain'
import { toSkillRows } from '../../components/skill/skill-domain'
import { toStaticSkillRows } from '../../components/staticskill/staticskill-domain'
import { toTalentRows } from '../../components/tianfu/talent-domain'
import { toWuDaoRows } from '../../components/wudao/wudao-domain'
import { toWuDaoSkillRows } from '../../components/wudaoskill/wudaoskill-domain'
import type {
    AffixEntry,
    BackpackEntry,
    BuffEntry,
    CreateAvatarEntry,
    ItemEntry,
    NpcEntry,
    NpcImportantEntry,
    NpcTypeEntry,
    NpcWuDaoEntry,
    SkillEntry,
    StaticSkillEntry,
    WuDaoEntry,
    WuDaoSkillEntry,
} from '../../types'

type UseModuleTableRowsParams = {
    npcMap: Record<string, NpcEntry>
    npcImportantMap: Record<string, NpcImportantEntry>
    npcTypeMap: Record<string, NpcTypeEntry>
    npcWuDaoMap: Record<string, NpcWuDaoEntry>
    backpackMap: Record<string, BackpackEntry>
    wudaoMap: Record<string, WuDaoEntry>
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    affixMap: Record<string, AffixEntry>
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    staticSkillAttributeOptions: Array<{ id: number; name: string }>
    tableSearchText: string
}

export function useModuleTableRows({
    npcMap,
    npcImportantMap,
    npcTypeMap,
    npcWuDaoMap,
    backpackMap,
    wudaoMap,
    wudaoSkillMap,
    affixMap,
    talentMap,
    buffMap,
    itemMap,
    skillMap,
    staticSkillMap,
    staticSkillAttributeOptions,
    tableSearchText,
}: UseModuleTableRowsParams) {
    const npcRows = useMemo(() => toNpcRows(npcMap), [npcMap])
    const npcImportantRows = useMemo(() => toNpcImportantRows(npcImportantMap), [npcImportantMap])
    const npcTypeRows = useMemo(() => toNpcTypeRows(npcTypeMap), [npcTypeMap])
    const npcWuDaoRows = useMemo(() => toNpcWuDaoRows(npcWuDaoMap), [npcWuDaoMap])
    const backpackRows = useMemo(() => toBackpackRows(backpackMap), [backpackMap])
    const wudaoRows = useMemo(() => toWuDaoRows(wudaoMap), [wudaoMap])
    const wudaoSkillRows = useMemo(() => toWuDaoSkillRows(wudaoSkillMap), [wudaoSkillMap])
    const affixRows = useMemo(() => toAffixRows(affixMap), [affixMap])
    const avatarRows = useMemo(() => toTalentRows(talentMap), [talentMap])
    const buffRows = useMemo(() => toBuffRows(buffMap), [buffMap])
    const itemRows = useMemo(() => toItemRows(itemMap), [itemMap])
    const skillRows = useMemo(() => toSkillRows(skillMap), [skillMap])
    const staticSkillRows = useMemo(
        () => toStaticSkillRows(staticSkillMap, staticSkillAttributeOptions),
        [staticSkillMap, staticSkillAttributeOptions]
    )

    const keyword = tableSearchText.trim().toLowerCase()

    const filteredNpcRows = useMemo(() => {
        if (!keyword) return npcRows
        return npcRows.filter(row =>
            `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${npcMap[row.key]?.menPai ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [npcRows, npcMap, keyword])

    const filteredNpcWuDaoRows = useMemo(() => {
        if (!keyword) return npcWuDaoRows
        return npcWuDaoRows.filter(row =>
            `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${(npcWuDaoMap[row.key]?.wudaoID ?? []).join(' ')}`
                .toLowerCase()
                .includes(keyword)
        )
    }, [npcWuDaoRows, npcWuDaoMap, keyword])

    const filteredNpcImportantRows = useMemo(() => {
        if (!keyword) return npcImportantRows
        return npcImportantRows.filter(row =>
            `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${npcImportantMap[row.key]?.LiuPai ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [npcImportantRows, npcImportantMap, keyword])

    const filteredNpcTypeRows = useMemo(() => {
        if (!keyword) return npcTypeRows
        return npcTypeRows.filter(row =>
            `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${npcTypeMap[row.key]?.FirstName ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [npcTypeRows, npcTypeMap, keyword])

    const filteredBackpackRows = useMemo(() => {
        if (!keyword) return backpackRows
        return backpackRows.filter(row => {
            const source = backpackMap[row.key]
            const haystack =
                `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${source?.BackpackName ?? ''} ${(source?.ItemID ?? []).join(' ')} ${(source?.randomNum ?? []).join(' ')}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [backpackRows, backpackMap, keyword])

    const filteredWuDaoRows = useMemo(() => {
        if (!keyword) return wudaoRows
        return wudaoRows.filter(row =>
            `${row.id} ${row.title} ${row.fenLei} ${wudaoMap[row.key]?.name1 ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [wudaoRows, wudaoMap, keyword])

    const filteredAvatarRows = useMemo(() => {
        if (!keyword) return avatarRows
        return avatarRows.filter(row =>
            `${row.id} ${row.title} ${row.desc} ${talentMap[row.key]?.Info ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [avatarRows, talentMap, keyword])

    const filteredWuDaoSkillRows = useMemo(() => {
        if (!keyword) return wudaoSkillRows
        return wudaoSkillRows.filter(row =>
            `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${wudaoSkillMap[row.key]?.xiaoguo ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [wudaoSkillRows, wudaoSkillMap, keyword])

    const filteredAffixRows = useMemo(() => {
        if (!keyword) return affixRows
        return affixRows.filter(row =>
            `${row.id} ${affixMap[row.key]?.name1 ?? ''} ${row.title} ${row.fenLei} ${row.desc}`.toLowerCase().includes(keyword)
        )
    }, [affixRows, affixMap, keyword])

    const filteredBuffRows = useMemo(() => {
        if (!keyword) return buffRows
        return buffRows.filter(row =>
            `${row.id} ${row.title} ${row.desc} ${buffMap[row.key]?.skillEffect ?? ''}`.toLowerCase().includes(keyword)
        )
    }, [buffRows, buffMap, keyword])

    const filteredItemRows = useMemo(() => {
        if (!keyword) return itemRows
        return itemRows.filter(row => `${row.id} ${row.title} ${row.desc} ${itemMap[row.key]?.desc2 ?? ''}`.toLowerCase().includes(keyword))
    }, [itemRows, itemMap, keyword])

    const filteredSkillRows = useMemo(() => {
        if (!keyword) return skillRows
        return skillRows.filter(row =>
            `${row.id} ${skillMap[row.key]?.Skill_ID ?? ''} ${row.title} ${row.desc} ${skillMap[row.key]?.TuJiandescr ?? ''} ${skillMap[row.key]?.skillEffect ?? ''}`
                .toLowerCase()
                .includes(keyword)
        )
    }, [skillRows, skillMap, keyword])

    const filteredStaticSkillRows = useMemo(() => {
        if (!keyword) return staticSkillRows
        return staticSkillRows.filter(row =>
            `${row.id} ${staticSkillMap[row.key]?.Skill_ID ?? ''} ${row.title} ${row.fenLei} ${row.desc} ${staticSkillMap[row.key]?.TuJiandescr ?? ''}`
                .toLowerCase()
                .includes(keyword)
        )
    }, [staticSkillRows, staticSkillMap, keyword])

    return {
        npcRows,
        npcImportantRows,
        npcTypeRows,
        npcWuDaoRows,
        backpackRows,
        wudaoRows,
        wudaoSkillRows,
        affixRows,
        avatarRows,
        buffRows,
        itemRows,
        skillRows,
        staticSkillRows,
        filteredNpcRows,
        filteredNpcImportantRows,
        filteredNpcTypeRows,
        filteredNpcWuDaoRows,
        filteredBackpackRows,
        filteredWuDaoRows,
        filteredWuDaoSkillRows,
        filteredAvatarRows,
        filteredAffixRows,
        filteredBuffRows,
        filteredItemRows,
        filteredSkillRows,
        filteredStaticSkillRows,
    }
}
