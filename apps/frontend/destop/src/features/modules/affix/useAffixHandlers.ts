import { createEmptyAffix } from '../../../components/affix/affix-domain'
import type { AffixEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredAffixRows: Array<{ key: string }>
    affixRows: Array<{ key: string }>
    affixMap: Record<string, AffixEntry>
    selectedAffixKey: string
    selectedAffixKeys: string[]
    affixSelectionAnchor: string
    affixClipboard: AffixEntry[]
    cloneAffixEntry: (entry: AffixEntry) => AffixEntry
    setSelectedAffixKey: Setter
    setSelectedAffixKeys: Setter
    setAffixSelectionAnchor: Setter
    setAffixMap: Setter
    setAffixDirty: Setter
    setStatus: Setter
    setAddAffixOpen: Setter
    setAffixClipboard: Setter
}

export function useAffixHandlers(params: Params) {
    const {
        filteredAffixRows,
        affixRows,
        affixMap,
        selectedAffixKey,
        selectedAffixKeys,
        affixSelectionAnchor,
        affixClipboard,
        cloneAffixEntry,
        setSelectedAffixKey,
        setSelectedAffixKeys,
        setAffixSelectionAnchor,
        setAffixMap,
        setAffixDirty,
        setStatus,
        setAddAffixOpen,
        setAffixClipboard,
    } = params

    function handleSelectAffix(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredAffixRows
        if (options.shift && affixSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === affixSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedAffixKeys(nextKeys)
                setSelectedAffixKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedAffixKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedAffixKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedAffixKey(key)
            setAffixSelectionAnchor(key)
            return
        }

        setSelectedAffixKeys([key])
        setSelectedAffixKey(key)
        setAffixSelectionAnchor(key)
    }

    function handleDeleteAffixes() {
        const targets = selectedAffixKeys.length > 0 ? selectedAffixKeys : selectedAffixKey ? [selectedAffixKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = affixRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setAffixMap((prev: Record<string, AffixEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedAffixKey(nextActive)
        setSelectedAffixKeys(nextActive ? [nextActive] : [])
        setAffixSelectionAnchor(nextActive)
        setAffixDirty(true)
        setStatus(`已删除 ${targets.length} 条词缀数据。`)
    }

    function handleBatchPrefixAffixIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedAffixKeys.length > 0 ? selectedAffixKeys : selectedAffixKey ? [selectedAffixKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的词缀。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (affixMap[a]?.id ?? 0) - (affixMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(affixMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setAffixMap((prev: Record<string, AffixEntry>) => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedAffixKey(nextActive)
        setSelectedAffixKeys(nextKeys)
        setAffixSelectionAnchor(nextActive)
        setAffixDirty(true)
        setStatus(`已批量修改 ${targets.length} 条ID，开头为 ${prefix}。`)
    }

    function handleAddAffix(id: number) {
        const key = String(id)
        setAddAffixOpen(false)
        if (affixMap[key]) {
            setSelectedAffixKey(key)
            setSelectedAffixKeys([key])
            setAffixSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setAffixMap((prev: Record<string, AffixEntry>) => ({ ...prev, [key]: createEmptyAffix(id) }))
        setSelectedAffixKey(key)
        setSelectedAffixKeys([key])
        setAffixSelectionAnchor(key)
        setAffixDirty(true)
    }

    function handleCopyAffix() {
        const targets = selectedAffixKeys.length > 0 ? selectedAffixKeys : selectedAffixKey ? [selectedAffixKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => affixMap[key])
            .filter((item): item is AffixEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneAffixEntry(item))
        if (copied.length === 0) return
        setAffixClipboard(copied)
        setStatus(copied.length === 1 ? `已复制词缀 ${copied[0].id}` : `已复制 ${copied.length} 条词缀数据`)
    }

    function handlePasteAffix() {
        if (affixClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(affixMap))
        const inserts: Array<{ key: string; row: AffixEntry }> = []
        const conflicts: AffixEntry[] = []

        affixClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneAffixEntry(item), id } })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条ID重复，请输入新的ID前缀（例如 70）`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名ID冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneAffixEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setAffixMap((prev: Record<string, AffixEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedAffixKey(nextKeys[0] ?? '')
        setSelectedAffixKeys(nextKeys)
        setAffixSelectionAnchor(nextKeys[0] ?? '')
        setAffixDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条词缀数据。`)
    }

    function handleChangeAffixForm(patch: Partial<AffixEntry>) {
        if (!selectedAffixKey || !affixMap[selectedAffixKey]) return
        const current = affixMap[selectedAffixKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setAffixMap((prev: Record<string, AffixEntry>) => {
            if (nextKey !== selectedAffixKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedAffixKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedAffixKey(nextKey)
        setSelectedAffixKeys((prev: string[]) =>
            prev.map(key => (key === selectedAffixKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setAffixSelectionAnchor(nextKey)
        setAffixDirty(true)
    }

    return {
        handleSelectAffix,
        handleDeleteAffixes,
        handleBatchPrefixAffixIds,
        handleAddAffix,
        handleCopyAffix,
        handlePasteAffix,
        handleChangeAffixForm,
    }
}
