import { createEmptyTalent } from '../../../components/tianfu/talent-domain'
import type { CreateAvatarEntry, TalentTypeOption } from '../../../types'

type Setter = (value: any) => void

type Params = {
    filteredAvatarRows: Array<{ key: string }>
    avatarRows: Array<{ key: string }>
    talentMap: Record<string, CreateAvatarEntry>
    selectedTalentKey: string
    selectedTalentKeys: string[]
    talentSelectionAnchor: string
    talentClipboard: CreateAvatarEntry[]
    talentTypeOptions: TalentTypeOption[]
    cloneTalentEntry: (entry: CreateAvatarEntry) => CreateAvatarEntry
    setSelectedTalentKey: Setter
    setSelectedTalentKeys: Setter
    setTalentSelectionAnchor: Setter
    setTalentMap: Setter
    setTalentDirty: Setter
    setStatus: Setter
    setAddTalentOpen: Setter
    setTalentClipboard: Setter
}

export function useTalentHandlers(params: Params) {
    const {
        filteredAvatarRows,
        avatarRows,
        talentMap,
        selectedTalentKey,
        selectedTalentKeys,
        talentSelectionAnchor,
        talentClipboard,
        talentTypeOptions,
        cloneTalentEntry,
        setSelectedTalentKey,
        setSelectedTalentKeys,
        setTalentSelectionAnchor,
        setTalentMap,
        setTalentDirty,
        setStatus,
        setAddTalentOpen,
        setTalentClipboard,
    } = params

    function handleSelectTalent(key: string, index: number, options: { shift: boolean; ctrl: boolean }) {
        const sourceRows = filteredAvatarRows
        if (options.shift && talentSelectionAnchor) {
            const anchorIndex = sourceRows.findIndex(row => row.key === talentSelectionAnchor)
            if (anchorIndex >= 0) {
                const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
                const nextKeys = sourceRows.slice(start, end + 1).map(row => row.key)
                setSelectedTalentKeys(nextKeys)
                setSelectedTalentKey(key)
                return
            }
        }

        if (options.ctrl) {
            setSelectedTalentKeys((prev: string[]) => {
                if (prev.includes(key)) {
                    const next = prev.filter(item => item !== key)
                    const active = next[next.length - 1] ?? ''
                    setSelectedTalentKey(active)
                    return next
                }
                return [...prev, key]
            })
            setSelectedTalentKey(key)
            setTalentSelectionAnchor(key)
            return
        }

        setSelectedTalentKeys([key])
        setSelectedTalentKey(key)
        setTalentSelectionAnchor(key)
    }

    function handleDeleteTalents() {
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) return
        const targetSet = new Set(targets)
        const remainingRows = avatarRows.filter(row => !targetSet.has(row.key))
        const nextActive = remainingRows[0]?.key ?? ''

        setTalentMap((prev: Record<string, CreateAvatarEntry>) => {
            const draft = { ...prev }
            targets.forEach(key => {
                delete draft[key]
            })
            return draft
        })
        setSelectedTalentKey(nextActive)
        setSelectedTalentKeys(nextActive ? [nextActive] : [])
        setTalentSelectionAnchor(nextActive)
        setTalentDirty(true)
        setStatus(`已删除 ${targets.length} 条天赋数据。`)
    }

    function handleBatchPrefixIds(prefix: string) {
        if (!/^\d+$/.test(prefix)) {
            setStatus('批量修改ID失败：请输入数字开头。')
            return
        }
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) {
            setStatus('请先选中要修改的天赋。')
            return
        }

        const orderedTargets = [...targets].sort((a, b) => (talentMap[a]?.id ?? 0) - (talentMap[b]?.id ?? 0))
        const nextKeys = orderedTargets.map((_, index) => String(Number(prefix) + index))
        const nextKeySet = new Set(nextKeys)
        if (nextKeySet.size !== nextKeys.length) {
            setStatus('批量修改ID失败：新ID出现重复。')
            return
        }

        const occupied = new Set(Object.keys(talentMap).filter(key => !orderedTargets.includes(key)))
        const conflict = nextKeys.find(key => occupied.has(key))
        if (conflict) {
            setStatus(`批量修改ID失败：目标ID ${conflict} 已存在。`)
            return
        }

        setTalentMap((prev: Record<string, CreateAvatarEntry>) => {
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
        setSelectedTalentKey(nextActive)
        setSelectedTalentKeys(nextKeys)
        setTalentSelectionAnchor(nextActive)
        setTalentDirty(true)
        setStatus(`已批量修改 ${targets.length} 条ID，开头为 ${prefix}。`)
    }

    function handleAddTalent(id: number) {
        const key = String(id)
        setAddTalentOpen(false)
        if (talentMap[key]) {
            setSelectedTalentKey(key)
            setSelectedTalentKeys([key])
            setTalentSelectionAnchor(key)
            setStatus(`ID ${id} 已存在，已定位到该条目。`)
            return
        }
        setTalentMap((prev: Record<string, CreateAvatarEntry>) => ({ ...prev, [key]: createEmptyTalent(id) }))
        setSelectedTalentKey(key)
        setSelectedTalentKeys([key])
        setTalentSelectionAnchor(key)
        setTalentDirty(true)
    }

    function handleCopyTalent() {
        const targets = selectedTalentKeys.length > 0 ? selectedTalentKeys : selectedTalentKey ? [selectedTalentKey] : []
        if (targets.length === 0) return
        const copied = targets
            .map(key => talentMap[key])
            .filter((item): item is CreateAvatarEntry => Boolean(item))
            .sort((a, b) => a.id - b.id)
            .map(item => cloneTalentEntry(item))
        if (copied.length === 0) return
        setTalentClipboard(copied)
        setStatus(copied.length === 1 ? `已复制天赋 ${copied[0].id}` : `已复制 ${copied.length} 条天赋数据`)
    }

    function handlePasteTalent() {
        if (talentClipboard.length === 0) return
        const existingKeys = new Set(Object.keys(talentMap))
        const inserts: Array<{ key: string; row: CreateAvatarEntry }> = []
        const conflicts: CreateAvatarEntry[] = []

        talentClipboard.forEach(item => {
            const id = Number(item.id)
            if (!Number.isFinite(id) || id <= 0) return
            const key = String(id)
            if (existingKeys.has(key)) {
                conflicts.push(item)
                return
            }
            const row = { ...cloneTalentEntry(item), id }
            inserts.push({ key, row })
            existingKeys.add(key)
        })

        if (conflicts.length > 0) {
            const prefixText = window.prompt(`检测到 ${conflicts.length} 条ID重复，请输入新的ID前缀（例如 50）`)
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
                const row = { ...cloneTalentEntry(conflicts[index]), id: Number(nextKey) }
                inserts.push({ key: nextKey, row })
                existingKeys.add(nextKey)
            }
        }

        if (inserts.length === 0) return
        setTalentMap((prev: Record<string, CreateAvatarEntry>) => {
            const draft = { ...prev }
            inserts.forEach(({ key, row }) => {
                draft[key] = row
            })
            return draft
        })
        const nextKeys = inserts.map(item => item.key)
        setSelectedTalentKey(nextKeys[0] ?? '')
        setSelectedTalentKeys(nextKeys)
        setTalentSelectionAnchor(nextKeys[0] ?? '')
        setTalentDirty(true)
        setStatus(`已粘贴 ${inserts.length} 条天赋数据。`)
    }

    function handleChangeTalentForm(patch: Partial<CreateAvatarEntry>) {
        if (!selectedTalentKey || !talentMap[selectedTalentKey]) return
        const current = talentMap[selectedTalentKey]
        const option =
            typeof patch.fenLeiGuanLian === 'number' ? talentTypeOptions.find(item => item.id === patch.fenLeiGuanLian) : undefined
        const normalizedPatch = typeof patch.fenLeiGuanLian === 'number' ? { ...patch, fenLei: option?.name ?? '' } : patch
        const next = { ...current, ...normalizedPatch }
        const nextId = Number(next.id || 0)
        if (!Number.isFinite(nextId) || nextId <= 0) return
        const nextKey = String(nextId)

        setTalentMap((prev: Record<string, CreateAvatarEntry>) => {
            if (nextKey !== selectedTalentKey && prev[nextKey]) {
                setStatus(`ID ${nextId} 已存在，不能重复。`)
                return prev
            }
            const draft = { ...prev }
            delete draft[selectedTalentKey]
            draft[nextKey] = { ...next, id: nextId }
            return draft
        })
        setSelectedTalentKey(nextKey)
        setSelectedTalentKeys((prev: string[]) =>
            prev.map(key => (key === selectedTalentKey ? nextKey : key)).filter((key, idx, arr) => arr.indexOf(key) === idx)
        )
        setTalentSelectionAnchor(nextKey)
        setTalentDirty(true)
    }

    return {
        handleSelectTalent,
        handleDeleteTalents,
        handleBatchPrefixIds,
        handleAddTalent,
        handleCopyTalent,
        handlePasteTalent,
        handleChangeTalentForm,
    }
}
