import { type Dispatch, type SetStateAction, useEffect } from 'react'

type RowWithKey = {
    key: string
}

type SelectionSyncParams = {
    rows: RowWithKey[]
    selectedKey: string
    setSelectedKey: (value: string) => void
    setSelectedKeys: Dispatch<SetStateAction<string[]>>
    setSelectionAnchor: (value: string) => void
}

type UseModuleSelectionSyncParams = {
    affix: SelectionSyncParams
    talent: SelectionSyncParams
    buff: SelectionSyncParams
    item: SelectionSyncParams
    skill: SelectionSyncParams
    staticSkill: SelectionSyncParams
}

function useSelectionSync({ rows, selectedKey, setSelectedKey, setSelectedKeys, setSelectionAnchor }: SelectionSyncParams) {
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

export function useModuleSelectionSync({ affix, talent, buff, item, skill, staticSkill }: UseModuleSelectionSyncParams) {
    useSelectionSync(affix)
    useSelectionSync(talent)
    useSelectionSync(buff)
    useSelectionSync(item)
    useSelectionSync(skill)
    useSelectionSync(staticSkill)
}
