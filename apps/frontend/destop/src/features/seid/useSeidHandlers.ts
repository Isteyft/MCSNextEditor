type Setter = (value: any) => void

type Params = {
    activeModule: string
    selectedTalent: any
    selectedBuff: any
    selectedItem: any
    selectedSkill: any
    selectedStaticSkill: any
    selectedWuDaoSkill: any
    selectedTalentKey: string
    selectedBuffKey: string
    selectedItemKey: string
    selectedSkillKey: string
    selectedStaticSkillKey: string
    selectedWuDaoSkillKey: string
    talentMap: Record<string, any>
    buffMap: Record<string, any>
    itemMap: Record<string, any>
    skillMap: Record<string, any>
    staticSkillMap: Record<string, any>
    wudaoSkillMap: Record<string, any>
    activeSeidId: number | null
    seidMetaMap: Record<number, any>
    buffSeidMetaMap: Record<number, any>
    itemEquipSeidMetaMap: Record<number, any>
    itemUseSeidMetaMap: Record<number, any>
    skillSeidMetaMap: Record<number, any>
    staticSkillSeidMetaMap: Record<number, any>
    workspaceRoot: string
    projectPath: string
    modRootPath: string
    preloadMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadBuffSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadItemSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadSkillSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    loadStaticSkillSeidMeta: (roots: string[], silent?: boolean) => Promise<any>
    setTalentMap: Setter
    setBuffMap: Setter
    setItemMap: Setter
    setSkillMap: Setter
    setStaticSkillMap: Setter
    setWuDaoSkillMap: Setter
    setTalentDirty: Setter
    setBuffDirty: Setter
    setItemDirty: Setter
    setSkillDirty: Setter
    setStaticSkillDirty: Setter
    setWuDaoSkillDirty: Setter
    setActiveSeidId: Setter
    setSeidEditorOpen: Setter
    setSeidPickerOpen: Setter
    setStatus: Setter
}

export function useSeidHandlers(params: Params) {
    const {
        activeModule,
        selectedTalent,
        selectedBuff,
        selectedItem,
        selectedSkill,
        selectedStaticSkill,
        selectedWuDaoSkill,
        selectedTalentKey,
        selectedBuffKey,
        selectedItemKey,
        selectedSkillKey,
        selectedStaticSkillKey,
        selectedWuDaoSkillKey,
        talentMap,
        buffMap,
        itemMap,
        skillMap,
        staticSkillMap,
        wudaoSkillMap,
        activeSeidId,
        seidMetaMap,
        buffSeidMetaMap,
        itemEquipSeidMetaMap,
        itemUseSeidMetaMap,
        skillSeidMetaMap,
        staticSkillSeidMetaMap,
        workspaceRoot,
        projectPath,
        modRootPath,
        preloadMeta,
        loadBuffSeidMeta,
        loadItemSeidMeta,
        loadSkillSeidMeta,
        loadStaticSkillSeidMeta,
        setTalentMap,
        setBuffMap,
        setItemMap,
        setSkillMap,
        setStaticSkillMap,
        setWuDaoSkillMap,
        setTalentDirty,
        setBuffDirty,
        setItemDirty,
        setSkillDirty,
        setStaticSkillDirty,
        setWuDaoSkillDirty,
        setActiveSeidId,
        setSeidEditorOpen,
        setSeidPickerOpen,
        setStatus,
    } = params

    function updateSelectedSeidOwner(
        updater: (current: { seid: number[]; seidData: Record<string, Record<string, string | number | number[]>> }) => {
            seid: number[]
            seidData: Record<string, Record<string, string | number | number[]>>
        }
    ) {
        if (activeModule === 'buff') {
            if (!selectedBuffKey || !buffMap[selectedBuffKey]) return
            setBuffMap((prev: Record<string, any>) => {
                const current = prev[selectedBuffKey]
                if (!current) return prev
                return { ...prev, [selectedBuffKey]: { ...current, ...updater(current) } }
            })
            setBuffDirty(true)
            return
        }

        if (activeModule === 'item') {
            if (!selectedItemKey || !itemMap[selectedItemKey]) return
            setItemMap((prev: Record<string, any>) => {
                const current = prev[selectedItemKey]
                if (!current) return prev
                return { ...prev, [selectedItemKey]: { ...current, ...updater(current) } }
            })
            setItemDirty(true)
            return
        }

        if (activeModule === 'skill') {
            if (!selectedSkillKey || !skillMap[selectedSkillKey]) return
            setSkillMap((prev: Record<string, any>) => {
                const current = prev[selectedSkillKey]
                if (!current) return prev
                return { ...prev, [selectedSkillKey]: { ...current, ...updater(current) } }
            })
            setSkillDirty(true)
            return
        }

        if (activeModule === 'wudaoskill') {
            if (!selectedWuDaoSkillKey || !wudaoSkillMap[selectedWuDaoSkillKey]) return
            setWuDaoSkillMap((prev: Record<string, any>) => {
                const current = prev[selectedWuDaoSkillKey]
                if (!current) return prev
                return { ...prev, [selectedWuDaoSkillKey]: { ...current, ...updater(current) } }
            })
            setWuDaoSkillDirty(true)
            return
        }

        if (activeModule === 'staticskill') {
            if (!selectedStaticSkillKey || !staticSkillMap[selectedStaticSkillKey]) return
            setStaticSkillMap((prev: Record<string, any>) => {
                const current = prev[selectedStaticSkillKey]
                if (!current) return prev
                return { ...prev, [selectedStaticSkillKey]: { ...current, ...updater(current) } }
            })
            setStaticSkillDirty(true)
            return
        }

        if (!selectedTalentKey || !talentMap[selectedTalentKey]) return
        setTalentMap((prev: Record<string, any>) => {
            const current = prev[selectedTalentKey]
            if (!current) return prev
            return { ...prev, [selectedTalentKey]: { ...current, ...updater(current) } }
        })
        setTalentDirty(true)
    }

    async function ensureSeidMetaLoaded() {
        if (activeModule === 'buff') {
            if (Object.keys(buffSeidMetaMap).length > 0) return true
            return loadBuffSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (activeModule === 'item') {
            const itemType = Number(selectedItem?.type ?? -1)
            const isEquipItem = itemType === 0 || itemType === 1 || itemType === 2
            const targetMap = isEquipItem ? itemEquipSeidMetaMap : itemUseSeidMetaMap
            if (Object.keys(targetMap).length > 0) return true
            return loadItemSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (activeModule === 'skill') {
            if (Object.keys(skillSeidMetaMap).length > 0) return true
            return loadSkillSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (activeModule === 'wudaoskill' || activeModule === 'staticskill') {
            if (Object.keys(staticSkillSeidMetaMap).length > 0) return true
            return loadStaticSkillSeidMeta([workspaceRoot, projectPath, modRootPath], true)
        }
        if (Object.keys(seidMetaMap).length > 0) return true
        const result = await preloadMeta([workspaceRoot, projectPath, modRootPath], true)
        return result.seidLoaded
    }

    async function handleOpenSeidEditor() {
        const selected =
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
                        : selectedTalent
        if (!selected) return
        const ok = await ensureSeidMetaLoaded()
        if (!ok) {
            setStatus(
                activeModule === 'buff'
                    ? '未加载到 Buff Seid 元数据，请确认 editorMeta/BuffSeidMeta.json 路径和 JSON 格式。'
                    : activeModule === 'item'
                      ? '未加载到 Item Seid 元数据，请确认 editorMeta/ItemUseSeidMeta.json 路径和 JSON 格式。'
                      : activeModule === 'skill'
                        ? '未加载到 Skill Seid 元数据，请确认 editorMeta/SkillSeidMeta.json 路径和 JSON 格式。'
                        : activeModule === 'wudaoskill'
                          ? '未加载到悟道技能 Seid 元数据，请确认 editorMeta/StaticSkillSeidMeta.json 路径和 JSON 格式。'
                          : activeModule === 'staticskill'
                            ? '未加载到 StaticSkill Seid 元数据，请确认 editorMeta/StaticSkillSeidMeta.json 路径和 JSON 格式。'
                            : '未加载到 Seid 元数据，请确认 editorMeta/CreateAvatarSeidMeta.json 路径和 JSON 格式。'
            )
        }
        const first = selected.seid[0] ?? null
        setActiveSeidId(first)
        setSeidEditorOpen(true)
    }

    async function handleOpenSeidPicker() {
        const ok = await ensureSeidMetaLoaded()
        setSeidPickerOpen(true)
        if (!ok) {
            setStatus('未加载到 Seid 元数据，无法新增 Seid。')
        }
    }

    function handleAddSeidFromPicker(id: number) {
        updateSelectedSeidOwner(current => {
            if (current.seid.includes(id)) return current
            const nextSeid = [...current.seid, id]
            const nextData = { ...current.seidData }
            if (!nextData[String(id)]) nextData[String(id)] = {}
            return { ...current, seid: nextSeid, seidData: nextData }
        })
        setActiveSeidId(id)
        setSeidPickerOpen(false)
    }

    function handleDeleteSelectedSeid() {
        if (!activeSeidId) return
        updateSelectedSeidOwner(current => {
            const nextSeid = current.seid.filter(id => id !== activeSeidId)
            const nextData = { ...current.seidData }
            delete nextData[String(activeSeidId)]
            return { ...current, seid: nextSeid, seidData: nextData }
        })
        const currentList =
            activeModule === 'buff'
                ? (selectedBuff?.seid ?? [])
                : activeModule === 'item'
                  ? (selectedItem?.seid ?? [])
                  : activeModule === 'skill'
                    ? (selectedSkill?.seid ?? [])
                    : activeModule === 'wudaoskill'
                      ? (selectedWuDaoSkill?.seid ?? [])
                      : activeModule === 'staticskill'
                        ? (selectedStaticSkill?.seid ?? [])
                        : (selectedTalent?.seid ?? [])
        const nextId = currentList.find((id: number) => id !== activeSeidId) ?? null
        setActiveSeidId(nextId)
    }

    function handleMoveSelectedSeid(direction: 'up' | 'down') {
        if (!activeSeidId) return
        updateSelectedSeidOwner(current => {
            const index = current.seid.findIndex(id => id === activeSeidId)
            if (index < 0) return current
            const targetIndex = direction === 'up' ? index - 1 : index + 1
            if (targetIndex < 0 || targetIndex >= current.seid.length) return current
            const nextSeid = [...current.seid]
            const temp = nextSeid[index]
            nextSeid[index] = nextSeid[targetIndex]
            nextSeid[targetIndex] = temp
            return { ...current, seid: nextSeid }
        })
    }

    function handleChangeSeidProperty(seidId: number, key: string, value: string | number | number[]) {
        updateSelectedSeidOwner(current => {
            const nextData = { ...current.seidData }
            const row = { ...(nextData[String(seidId)] ?? {}) }
            row[key] = value
            nextData[String(seidId)] = row
            return { ...current, seidData: nextData }
        })
    }

    return {
        handleOpenSeidEditor,
        handleOpenSeidPicker,
        handleAddSeidFromPicker,
        handleDeleteSelectedSeid,
        handleMoveSelectedSeid,
        handleChangeSeidProperty,
    }
}
