import { useMemo } from 'react'

import { toAffixRows } from '../../components/affix/affix-domain'
import { toBuffRows } from '../../components/buff/buff-domain'
import { toItemRows } from '../../components/item/item-domain'
import { toSkillRows } from '../../components/skill/skill-domain'
import { toStaticSkillRows } from '../../components/staticskill/staticskill-domain'
import { toTalentRows } from '../../components/tianfu/talent-domain'
import { toWuDaoRows } from '../../components/wudao/wudao-domain'
import { toWuDaoSkillRows } from '../../components/wudaoskill/wudaoskill-domain'
import type {
    AffixEntry,
    BuffEntry,
    CreateAvatarEntry,
    ItemEntry,
    SkillEntry,
    StaticSkillEntry,
    WuDaoEntry,
    WuDaoSkillEntry,
} from '../../types'

type UseModuleTableRowsParams = {
    wudaoMap: Record<string, WuDaoEntry>
    wudaoSkillMap: Record<string, WuDaoSkillEntry>
    affixMap: Record<string, AffixEntry>
    talentMap: Record<string, CreateAvatarEntry>
    buffMap: Record<string, BuffEntry>
    itemMap: Record<string, ItemEntry>
    skillMap: Record<string, SkillEntry>
    staticSkillMap: Record<string, StaticSkillEntry>
    tableSearchText: string
}

export function useModuleTableRows({
    wudaoMap,
    wudaoSkillMap,
    affixMap,
    talentMap,
    buffMap,
    itemMap,
    skillMap,
    staticSkillMap,
    tableSearchText,
}: UseModuleTableRowsParams) {
    const wudaoRows = useMemo(() => toWuDaoRows(wudaoMap), [wudaoMap])
    const wudaoSkillRows = useMemo(() => toWuDaoSkillRows(wudaoSkillMap), [wudaoSkillMap])
    const affixRows = useMemo(() => toAffixRows(affixMap), [affixMap])
    const avatarRows = useMemo(() => toTalentRows(talentMap), [talentMap])
    const buffRows = useMemo(() => toBuffRows(buffMap), [buffMap])
    const itemRows = useMemo(() => toItemRows(itemMap), [itemMap])
    const skillRows = useMemo(() => toSkillRows(skillMap), [skillMap])
    const staticSkillRows = useMemo(() => toStaticSkillRows(staticSkillMap), [staticSkillMap])

    const keyword = tableSearchText.trim().toLowerCase()

    const filteredWuDaoRows = useMemo(() => {
        if (!keyword) return wudaoRows
        return wudaoRows.filter(row => {
            const source = wudaoMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.fenLei} ${source?.name1 ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [wudaoRows, wudaoMap, keyword])

    const filteredAvatarRows = useMemo(() => {
        if (!keyword) return avatarRows
        return avatarRows.filter(row => {
            const source = talentMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.desc} ${source?.Info ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [avatarRows, talentMap, keyword])

    const filteredWuDaoSkillRows = useMemo(() => {
        if (!keyword) return wudaoSkillRows
        return wudaoSkillRows.filter(row => {
            const source = wudaoSkillMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.fenLei} ${row.desc} ${source?.xiaoguo ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [wudaoSkillRows, wudaoSkillMap, keyword])

    const filteredAffixRows = useMemo(() => {
        if (!keyword) return affixRows
        return affixRows.filter(row => {
            const source = affixMap[row.key]
            const haystack = `${row.id} ${source?.name1 ?? ''} ${row.title} ${row.fenLei} ${row.desc}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [affixRows, affixMap, keyword])

    const filteredBuffRows = useMemo(() => {
        if (!keyword) return buffRows
        return buffRows.filter(row => {
            const source = buffMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.desc} ${source?.skillEffect ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [buffRows, buffMap, keyword])

    const filteredItemRows = useMemo(() => {
        if (!keyword) return itemRows
        return itemRows.filter(row => {
            const source = itemMap[row.key]
            const haystack = `${row.id} ${row.title} ${row.desc} ${source?.desc2 ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [itemRows, itemMap, keyword])

    const filteredSkillRows = useMemo(() => {
        if (!keyword) return skillRows
        return skillRows.filter(row => {
            const source = skillMap[row.key]
            const haystack =
                `${row.id} ${source?.Skill_ID ?? ''} ${row.title} ${row.desc} ${source?.TuJiandescr ?? ''} ${source?.skillEffect ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [skillRows, skillMap, keyword])

    const filteredStaticSkillRows = useMemo(() => {
        if (!keyword) return staticSkillRows
        return staticSkillRows.filter(row => {
            const source = staticSkillMap[row.key]
            const haystack = `${row.id} ${source?.Skill_ID ?? ''} ${row.title} ${row.desc} ${source?.TuJiandescr ?? ''}`.toLowerCase()
            return haystack.includes(keyword)
        })
    }, [staticSkillRows, staticSkillMap, keyword])

    return {
        wudaoRows,
        wudaoSkillRows,
        affixRows,
        avatarRows,
        buffRows,
        itemRows,
        skillRows,
        staticSkillRows,
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
