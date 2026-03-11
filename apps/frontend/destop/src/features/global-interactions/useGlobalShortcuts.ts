import { useEffect } from 'react'

type Params = {
    activeModule: string
    isEditableElement: (target: EventTarget | null) => boolean
    onDeleteNpc: () => void
    onDeleteWuDao: () => void
    onDeleteWuDaoSkill: () => void
    onDeleteAffix: () => void
    onDeleteTalent: () => void
    onDeleteBuff: () => void
    onDeleteItem: () => void
    onDeleteSkill: () => void
    onDeleteStaticSkill: () => void
    onCopyNpc: () => void
    onCopyWuDao: () => void
    onCopyWuDaoSkill: () => void
    onCopyAffix: () => void
    onCopyTalent: () => void
    onCopyBuff: () => void
    onCopyItem: () => void
    onCopySkill: () => void
    onCopyStaticSkill: () => void
    onPasteNpc: () => void
    onPasteWuDao: () => void
    onPasteWuDaoSkill: () => void
    onPasteAffix: () => void
    onPasteTalent: () => void
    onPasteBuff: () => void
    onPasteItem: () => void
    onPasteSkill: () => void
    onPasteStaticSkill: () => void
}

export function useGlobalShortcuts(params: Params) {
    const {
        activeModule,
        isEditableElement,
        onDeleteNpc,
        onDeleteWuDao,
        onDeleteWuDaoSkill,
        onDeleteAffix,
        onDeleteTalent,
        onDeleteBuff,
        onDeleteItem,
        onDeleteSkill,
        onDeleteStaticSkill,
        onCopyNpc,
        onCopyWuDao,
        onCopyWuDaoSkill,
        onCopyAffix,
        onCopyTalent,
        onCopyBuff,
        onCopyItem,
        onCopySkill,
        onCopyStaticSkill,
        onPasteNpc,
        onPasteWuDao,
        onPasteWuDaoSkill,
        onPasteAffix,
        onPasteTalent,
        onPasteBuff,
        onPasteItem,
        onPasteSkill,
        onPasteStaticSkill,
    } = params

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (
                activeModule !== 'npc' &&
                activeModule !== 'wudao' &&
                activeModule !== 'wudaoskill' &&
                activeModule !== 'affix' &&
                activeModule !== 'talent' &&
                activeModule !== 'buff' &&
                activeModule !== 'item' &&
                activeModule !== 'skill' &&
                activeModule !== 'staticskill'
            )
                return

            if (isEditableElement(event.target)) return

            if (event.key === 'Delete') {
                event.preventDefault()
                if (activeModule === 'npc') {
                    onDeleteNpc()
                } else if (activeModule === 'wudao') {
                    onDeleteWuDao()
                } else if (activeModule === 'wudaoskill') {
                    onDeleteWuDaoSkill()
                } else if (activeModule === 'affix') {
                    onDeleteAffix()
                } else if (activeModule === 'buff') {
                    onDeleteBuff()
                } else if (activeModule === 'item') {
                    onDeleteItem()
                } else if (activeModule === 'skill') {
                    onDeleteSkill()
                } else if (activeModule === 'staticskill') {
                    onDeleteStaticSkill()
                } else {
                    onDeleteTalent()
                }
                return
            }

            if (!(event.ctrlKey || event.metaKey)) return
            const key = event.key.toLowerCase()
            if (key === 'c') {
                event.preventDefault()
                if (activeModule === 'npc') {
                    onCopyNpc()
                } else if (activeModule === 'wudao') {
                    onCopyWuDao()
                } else if (activeModule === 'wudaoskill') {
                    onCopyWuDaoSkill()
                } else if (activeModule === 'affix') {
                    onCopyAffix()
                } else if (activeModule === 'buff') {
                    onCopyBuff()
                } else if (activeModule === 'item') {
                    onCopyItem()
                } else if (activeModule === 'skill') {
                    onCopySkill()
                } else if (activeModule === 'staticskill') {
                    onCopyStaticSkill()
                } else {
                    onCopyTalent()
                }
            } else if (key === 'v') {
                event.preventDefault()
                if (activeModule === 'npc') {
                    onPasteNpc()
                } else if (activeModule === 'wudao') {
                    onPasteWuDao()
                } else if (activeModule === 'wudaoskill') {
                    onPasteWuDaoSkill()
                } else if (activeModule === 'affix') {
                    onPasteAffix()
                } else if (activeModule === 'buff') {
                    onPasteBuff()
                } else if (activeModule === 'item') {
                    onPasteItem()
                } else if (activeModule === 'skill') {
                    onPasteSkill()
                } else if (activeModule === 'staticskill') {
                    onPasteStaticSkill()
                } else {
                    onPasteTalent()
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [
        activeModule,
        isEditableElement,
        onDeleteNpc,
        onDeleteWuDao,
        onDeleteWuDaoSkill,
        onDeleteAffix,
        onDeleteTalent,
        onDeleteBuff,
        onDeleteItem,
        onDeleteSkill,
        onDeleteStaticSkill,
        onCopyNpc,
        onCopyWuDao,
        onCopyWuDaoSkill,
        onCopyAffix,
        onCopyTalent,
        onCopyBuff,
        onCopyItem,
        onCopySkill,
        onCopyStaticSkill,
        onPasteNpc,
        onPasteWuDao,
        onPasteWuDaoSkill,
        onPasteAffix,
        onPasteTalent,
        onPasteBuff,
        onPasteItem,
        onPasteSkill,
        onPasteStaticSkill,
    ])
}
