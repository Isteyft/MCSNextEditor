import { createEmptyItem } from '../../../components/item/item-domain'
import type { ItemEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredItemRows: Array<{ key: string }>
    itemRows: Array<{ key: string }>
    itemMap: Record<string, ItemEntry>
    selectedItemKey: string
    selectedItemKeys: string[]
    itemSelectionAnchor: string
    itemClipboard: ItemEntry[]
    cloneItemEntry: (entry: ItemEntry) => ItemEntry
    setSelectedItemKey: Setter
    setSelectedItemKeys: Setter
    setItemSelectionAnchor: Setter
    setItemMap: Setter
    setItemDirty: Setter
    setStatus: Setter
    setAddItemOpen: Setter
    setItemClipboard: Setter
}

export function useItemHandlers(params: Params) {
    const {
        filteredItemRows,
        itemRows,
        itemMap,
        selectedItemKey,
        selectedItemKeys,
        itemSelectionAnchor,
        itemClipboard,
        cloneItemEntry,
        setSelectedItemKey,
        setSelectedItemKeys,
        setItemSelectionAnchor,
        setItemMap,
        setItemDirty,
        setStatus,
        setAddItemOpen,
        setItemClipboard,
    } = params

    function handleSelectItem(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredItemRows
        if (options.shift && itemSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === itemSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedItemKeys(nextKeys)
                setSelectedItemKey(key)
                return
            }
        }
        if (options.ctrl) {
            setSelectedItemKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedItemKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedItemKey(key)
            setItemSelectionAnchor(key)
            return
        }
        setSelectedItemKeys([key])
        setSelectedItemKey(key)
        setItemSelectionAnchor(key)
    }

    function handleDeleteItems() {
        const targets = selectedItemKeys.length > 0 ? selectedItemKeys : selectedItemKey ? [selectedItemKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = itemRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''
        setItemMap((prev: Record<string, ItemEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => delete draft[key])
            return draft
        })
        setSelectedItemKey(nextActive)
        setSelectedItemKeys(nextActive ? [nextActive] : [])
        setItemSelectionAnchor(nextActive)
        setItemDirty(true)
        setStatus(`已删除 ${targets.length} 条 Item 数据。`)
    }

    function handleBatchPrefixItemIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedItemKeys.length > 0 ? selectedItemKeys : selectedItemKey ? [selectedItemKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 Item。')
            return
        }
        const orderedTargets = [...targets].sort((a, b) => (itemMap[a]?.id ?? 0) - (itemMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(itemMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }
        setItemMap((prev: Record<string, ItemEntry>) => {
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
        setSelectedItemKey(nextActive)
        setSelectedItemKeys(nextKeys)
        setItemSelectionAnchor(nextActive)
        setItemDirty(true)
    }

    function handleAddItem(id: number) {
        const key = String(id)
        setAddItemOpen(false)
        if (itemMap[key]) {
            setSelectedItemKey(key)
            setSelectedItemKeys([key])
            setItemSelectionAnchor(key)
            setStatus(`Item ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setItemMap((prev: Record<string, ItemEntry>) => ({ ...prev, [key]: createEmptyItem(id) }))
        setSelectedItemKey(key)
        setSelectedItemKeys([key])
        setItemSelectionAnchor(key)
        setItemDirty(true)
    }

    function handleCopyItem() {
        const targets = selectedItemKeys.length > 0 ? selectedItemKeys : selectedItemKey ? [selectedItemKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => itemMap[key])
            .filter((item): item is ItemEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneItemEntry(item))
        if (copied.length === 0) return
        setItemClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 Item ${copied[0].id}` : `已复制 ${copied.length} 条 Item 数据`)
    }

    function handlePasteItem() {
        if (itemClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(itemMap))
        const inserts: Array<{ key: string; row: ItemEntry }> = []
        const conflicts: ItemEntry[] = []
        itemClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            inserts.push({ key, row: { ...cloneItemEntry(item), id } })
            existingKeys.add(key)
        })
        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条Item ID重复，请输入新的ID前缀（例如 52）`)
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
                inserts.push({ key: nextKey, row: { ...cloneItemEntry(conflicts[index]), id: Number(nextKey) } })
                existingKeys.add(nextKey)
            }
        }
        if (inserts.length === 0) return
        setItemMap((prev: Record<string, ItemEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedItemKey(nextKeys[0] ?? '')
        setSelectedItemKeys(nextKeys)
        setItemSelectionAnchor(nextKeys[0] ?? '')
        setItemDirty(true)
    }

    function handleChangeItemForm(patch: Partial<ItemEntry>) {
        if (!selectedItemKey || !itemMap[selectedItemKey]) return
        const current = itemMap[selectedItemKey]
        const nextPatch = { ...patch }
        if (Object.prototype.hasOwnProperty.call(nextPatch, 'desc') && !Object.prototype.hasOwnProperty.call(nextPatch, 'desc2')) {
            nextPatch.desc2 = String(nextPatch.desc ?? '')
        }
        const next = { ...current, ...nextPatch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)
        setItemMap((prev: Record<string, ItemEntry>) => {
            if (nextKey !== selectedItemKey && prev[nextKey]) {
                setStatus(`Item ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedItemKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedItemKey(nextKey)
        setSelectedItemKeys((prev: string[]) =>
            prev.map(key => (key === selectedItemKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setItemSelectionAnchor(nextKey)
        setItemDirty(true)
    }

    return {
        handleSelectItem,
        handleDeleteItems,
        handleBatchPrefixItemIds,
        handleAddItem,
        handleCopyItem,
        handlePasteItem,
        handleChangeItemForm,
    }
}
