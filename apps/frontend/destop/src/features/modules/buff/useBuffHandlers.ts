import { createEmptyBuff } from '../../../components/buff/buff-domain'
import type { BuffEntry } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredBuffRows: Array<{ key: string }>
    buffRows: Array<{ key: string }>
    buffMap: Record<string, BuffEntry>
    selectedBuffKey: string
    selectedBuffKeys: string[]
    buffSelectionAnchor: string
    buffClipboard: BuffEntry[]
    cloneBuffEntry: (entry: BuffEntry) => BuffEntry
    setSelectedBuffKey: Setter
    setSelectedBuffKeys: Setter
    setBuffSelectionAnchor: Setter
    setBuffMap: Setter
    setBuffDirty: Setter
    setStatus: Setter
    setAddBuffOpen: Setter
    setBuffClipboard: Setter
}

export function useBuffHandlers(params: Params) {
    const {
        filteredBuffRows,
        buffRows,
        buffMap,
        selectedBuffKey,
        selectedBuffKeys,
        buffSelectionAnchor,
        buffClipboard,
        cloneBuffEntry,
        setSelectedBuffKey,
        setSelectedBuffKeys,
        setBuffSelectionAnchor,
        setBuffMap,
        setBuffDirty,
        setStatus,
        setAddBuffOpen,
        setBuffClipboard,
    } = params

    function handleSelectBuff(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredBuffRows
        if (options.shift && buffSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === buffSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedBuffKeys(nextKeys)
                setSelectedBuffKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedBuffKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedBuffKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedBuffKey(key)
            setBuffSelectionAnchor(key)
            return
        }

        setSelectedBuffKeys([key])
        setSelectedBuffKey(key)
        setBuffSelectionAnchor(key)
    }

    function handleDeleteBuffs() {
        const targets = selectedBuffKeys.length > 0 ? selectedBuffKeys : selectedBuffKey ? [selectedBuffKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = buffRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setBuffMap((prev: Record<string, BuffEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedBuffKey(nextActive)
        setSelectedBuffKeys(nextActive ? [nextActive] : [])
        setBuffSelectionAnchor(nextActive)
        setBuffDirty(true)
        setStatus(`已删除 ${targets.length} 条 Buff 数据。`)
    }

    function handleBatchPrefixBuffIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedBuffKeys.length > 0 ? selectedBuffKeys : selectedBuffKey ? [selectedBuffKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的 Buff。')
            return
        }

        const orderedTargets = [...targets].sort((a, b) => (buffMap[a]?.buffid ?? 0) - (buffMap[b]?.buffid ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }
        const occupied = new Set(Object.keys(buffMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setBuffMap((prev: Record<string, BuffEntry>) => {
            const draft = { ...prev }
            orderedTargets.forEach(oldKey => delete draft[oldKey])
            orderedTargets.forEach((oldKey, index) => {
                const nextKey = nextKeys[index]
                const row = prev[oldKey]
                if (!row) return
                draft[nextKey] = { ...row, buffid: Number(nextKey) }
            })
            return draft
        })
        const nextActive = nextKeys[0] ?? ''
        setSelectedBuffKey(nextActive)
        setSelectedBuffKeys(nextKeys)
        setBuffSelectionAnchor(nextActive)
        setBuffDirty(true)
        setStatus(`已批量修改 ${targets.length} 条 Buff ID，开头为 ${prefix}。`)
    }

    function handleAddBuff(id: number) {
        const key = String(id)
        setAddBuffOpen(false)
        if (buffMap[key]) {
            setSelectedBuffKey(key)
            setSelectedBuffKeys([key])
            setBuffSelectionAnchor(key)
            setStatus(`Buff ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setBuffMap((prev: Record<string, BuffEntry>) => ({ ...prev, [key]: createEmptyBuff(id) }))
        setSelectedBuffKey(key)
        setSelectedBuffKeys([key])
        setBuffSelectionAnchor(key)
        setBuffDirty(true)
    }

    function handleCopyBuff() {
        const targets = selectedBuffKeys.length > 0 ? selectedBuffKeys : selectedBuffKey ? [selectedBuffKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => buffMap[key])
            .filter((item): item is BuffEntry => Boolean(item))
            .sort((a, b) => a.buffid - b.buffid)
            .map(item => cloneBuffEntry(item))
        if (copied.length === 0) return
        setBuffClipboard(copied)
        setStatus(copied.length === 1 ? `已复制 Buff ${copied[0].buffid}` : `已复制 ${copied.length} 条 Buff 数据`)
    }

    function handlePasteBuff() {
        if (buffClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(buffMap))
        const inserts: Array<{ key: string; row: BuffEntry }> = []
        const conflicts: BuffEntry[] = []

        buffClipboard.forEach(item => {
            const id = Number(item.buffid)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            const row = { ...cloneBuffEntry(item), buffid: id }
            inserts.push({ key, row })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条Buff ID重复，请输入新的ID前缀（例如 52）`)
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
                const row = { ...cloneBuffEntry(conflicts[index]), buffid: Number(nextKey) }
                inserts.push({ key: nextKey, row })
                existingKeys.add(nextKey)
            }
        }

        if (inserts.length === 0) return
        setBuffMap((prev: Record<string, BuffEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedBuffKey(nextKeys[0] ?? '')
        setSelectedBuffKeys(nextKeys)
        setBuffSelectionAnchor(nextKeys[0] ?? '')
        setBuffDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条 Buff 数据。`)
    }

    function handleChangeBuffForm(patch: Partial<BuffEntry>) {
        if (!selectedBuffKey || !buffMap[selectedBuffKey]) return
        const current = buffMap[selectedBuffKey]
        const next = { ...current, ...patch }
        const nextId = Number(next.buffid || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setBuffMap((prev: Record<string, BuffEntry>) => {
            if (nextKey !== selectedBuffKey && prev[nextKey]) {
                setStatus(`Buff ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedBuffKey]
            draft[nextKey] = { ...next, buffid: nextId }
            return draft
        })
        setSelectedBuffKey(nextKey)
        setSelectedBuffKeys((prev: string[]) =>
            prev.map(key => (key === selectedBuffKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setBuffSelectionAnchor(nextKey)
        setBuffDirty(true)
    }

    return {
        handleSelectBuff,
        handleDeleteBuffs,
        handleBatchPrefixBuffIds,
        handleAddBuff,
        handleCopyBuff,
        handlePasteBuff,
        handleChangeBuffForm,
    }
}
