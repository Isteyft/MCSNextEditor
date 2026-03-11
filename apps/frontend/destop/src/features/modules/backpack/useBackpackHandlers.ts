import { createEmptyBackpack } from '../../../components/backpack/backpack-domain'
import type { BackpackEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredBackpackRows: Array<{ key: string }>
    backpackRows: Array<{ key: string }>
    backpackMap: Record<string, BackpackEntry>
    selectedBackpackKey: string
    selectedBackpackKeys: string[]
    backpackSelectionAnchor: string
    backpackClipboard: BackpackEntry[]
    cloneBackpackEntry: (entry: BackpackEntry) => BackpackEntry
    setSelectedBackpackKey: Setter
    setSelectedBackpackKeys: Setter
    setBackpackSelectionAnchor: Setter
    setBackpackMap: Setter
    setBackpackDirty: Setter
    setStatus: Setter
    setAddBackpackOpen: Setter
    setBackpackClipboard: Setter
}

export function useBackpackHandlers(params: Params) {
    const {
        filteredBackpackRows,
        backpackRows,
        backpackMap,
        selectedBackpackKey,
        selectedBackpackKeys,
        backpackSelectionAnchor,
        backpackClipboard,
        cloneBackpackEntry,
        setSelectedBackpackKey,
        setSelectedBackpackKeys,
        setBackpackSelectionAnchor,
        setBackpackMap,
        setBackpackDirty,
        setStatus,
        setAddBackpackOpen,
        setBackpackClipboard,
    } = params

    function handleSelectBackpack(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredBackpackRows
        if (options.shift && backpackSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === backpackSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedBackpackKeys(nextKeys)
                setSelectedBackpackKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedBackpackKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedBackpackKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedBackpackKey(key)
            setBackpackSelectionAnchor(key)
            return
        }
        setSelectedBackpackKeys([key])
        setSelectedBackpackKey(key)
        setBackpackSelectionAnchor(key)
    }

    function handleDeleteBackpacks() {
        const targets = selectedBackpackKeys.length > 0 ? selectedBackpackKeys : selectedBackpackKey ? [selectedBackpackKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = backpackRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setBackpackMap((prev: Record<string, BackpackEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedBackpackKey(nextActive)
        setSelectedBackpackKeys(nextActive ? [nextActive] : [])
        setBackpackSelectionAnchor(nextActive)
        setBackpackDirty(true)
        setStatus(`已删除 ${targets.length} 条背包数据。`)
    }

    function handleBatchPrefixBackpackIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改 ID 失败：请输入数字开头。')
            return
        }
        const targets = selectedBackpackKeys.length > 0 ? selectedBackpackKeys : selectedBackpackKey ? [selectedBackpackKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的背包。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (backpackMap[a]?.id ?? 0) - (backpackMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const occupied = new Set(Object.keys(backpackMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改 ID 失败：目标 ID ${conflict} 已存在。`)
            return
        }
        setBackpackMap((prev: Record<string, BackpackEntry>) => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const row = prev[oldKey]
                if (!row) return
                const nextKey = nextKeys[index]
                draft[nextKey] = { ...row, id: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedBackpackKey(nextActive)
        setSelectedBackpackKeys(nextKeys)
        setBackpackSelectionAnchor(nextActive)
        setBackpackDirty(true)
        setStatus(`已批量修改 ${targets.length} 条背包 ID，开头为 ${prefix}。`)
    }

    function handleAddBackpack(id: number) {
        const key = String(id)
        setAddBackpackOpen(false)
        if (backpackMap[key]) {
            setSelectedBackpackKey(key)
            setSelectedBackpackKeys([key])
            setBackpackSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setBackpackMap((prev: Record<string, BackpackEntry>) => ({ ...prev, [key]: createEmptyBackpack(id) }))
        setSelectedBackpackKey(key)
        setSelectedBackpackKeys([key])
        setBackpackSelectionAnchor(key)
        setBackpackDirty(true)
    }

    function handleCopyBackpack() {
        const targets = selectedBackpackKeys.length > 0 ? selectedBackpackKeys : selectedBackpackKey ? [selectedBackpackKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => backpackMap[key])
            .filter((item): item is BackpackEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneBackpackEntry(item))
        if (copied.length === 0) return
        setBackpackClipboard(copied)
        setStatus(copied.length === 1 ? `已复制背包 ${copied[0].id}` : `已复制 ${copied.length} 条背包数据。`)
    }

    function handlePasteBackpack() {
        if (backpackClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(backpackMap))
        const inserts: Array<{ key: string; row: BackpackEntry }> = []
        const conflicts: BackpackEntry[] = []
        backpackClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneBackpackEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条背包 ID 重复，请输入新的 ID 前缀，例如 90`)
            if (prefixText === null) return
            const prefix = prefixText.trim()
            if (!/^\d+$/.test(prefix)) {
                setStatus('粘贴失败：请输入数字前缀。')
                return
            }
            for (let index = 0; index < conflicts.length; index += 1) {
                const nextKey = String(Number(`${prefix}${index + 1}`))
                if (existingKeys.has(nextKey)) {
                    setStatus(`粘贴失败：批量重命名 ID 冲突（${nextKey}）。`)
                    return
                }
                inserts.push({ key: nextKey, row: { ...cloneBackpackEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setBackpackMap((prev: Record<string, BackpackEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedBackpackKey(nextKeys[0] ?? '')
        setSelectedBackpackKeys(nextKeys)
        setBackpackSelectionAnchor(nextKeys[0] ?? '')
        setBackpackDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条背包数据。`)
    }

    function handleChangeBackpackForm(patch: Partial<BackpackEntry>) {
        if (!selectedBackpackKey || !backpackMap[selectedBackpackKey]) return
        const current = backpackMap[selectedBackpackKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setBackpackMap((prev: Record<string, BackpackEntry>) => {
            if (nextKey !== selectedBackpackKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedBackpackKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedBackpackKey(nextKey)
        setSelectedBackpackKeys((prev: string[]) =>
            prev.map(key => (key === selectedBackpackKey ? nextKey : key)).filter((key, index, arr) => arr.indexOf(key) === index)
        )
        setBackpackSelectionAnchor(nextKey)
        setBackpackDirty(true)
    }

    return {
        handleSelectBackpack,
        handleDeleteBackpacks,
        handleBatchPrefixBackpackIds,
        handleAddBackpack,
        handleCopyBackpack,
        handlePasteBackpack,
        handleChangeBackpackForm,
    }
}
