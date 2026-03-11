import { type Dispatch, type SetStateAction, useEffect } from 'react'

type RowWithKey = { key: string }

type SelectionSyncParams = {
    rows: RowWithKey[]
    selectedKey: string
    setSelectedKey: (value: string) => void
    setSelectedKeys: Dispatch<SetStateAction<string[]>>
    setSelectionAnchor: (value: string) => void
}

type UseModuleSelectionSyncParams = Partial<{
    npc: SelectionSyncParams
    npcwudao: SelectionSyncParams
    backpack: SelectionSyncParams
    wudao: SelectionSyncParams
    wudaoskill: SelectionSyncParams
    affix: SelectionSyncParams
    talent: SelectionSyncParams
    buff: SelectionSyncParams
    item: SelectionSyncParams
    skill: SelectionSyncParams
    staticSkill: SelectionSyncParams
}>

const EMPTY_SELECTION_SYNC: SelectionSyncParams = {
    rows: [],
    selectedKey: '',
    setSelectedKey: () => {},
    setSelectedKeys: () => [],
    setSelectionAnchor: () => {},
}

function useSelectionSync(params?: SelectionSyncParams) {
    const { rows, selectedKey, setSelectedKey, setSelectedKeys, setSelectionAnchor } = params ?? EMPTY_SELECTION_SYNC

    useEffect(() => {
        const validKeys = new Set(rows.map(row => row.key))
        setSelectedKeys(prev => prev.filter(key => validKeys.has(key)))
        if (selectedKey && !validKeys.has(selectedKey)) {
            const fallback = rows[0]?.key ?? ''
            setSelectedKey(fallback)
            setSelectedKeys(fallback ? [fallback] : [])
            setSelectionAnchor(fallback)
        }
    }, [rows, selectedKey, setSelectedKey, setSelectedKeys, setSelectionAnchor])
}

export function useModuleSelectionSync({
    npc,
    npcwudao,
    backpack,
    wudao,
    wudaoskill,
    affix,
    talent,
    buff,
    item,
    skill,
    staticSkill,
}: UseModuleSelectionSyncParams) {
    useSelectionSync(npc)
    useSelectionSync(npcwudao)
    useSelectionSync(backpack)
    useSelectionSync(wudao)
    useSelectionSync(wudaoskill)
    useSelectionSync(affix)
    useSelectionSync(talent)
    useSelectionSync(buff)
    useSelectionSync(item)
    useSelectionSync(skill)
    useSelectionSync(staticSkill)
}
