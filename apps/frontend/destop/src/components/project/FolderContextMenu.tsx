import { useMemo } from 'react'

type FolderContextMenuProps = {
    open: boolean
    x: number
    y: number
    onRename?: () => void
    onDelete?: () => void
    onCreateProject?: () => void
    onClose: () => void
}

export function FolderContextMenu({ open, x, y, onRename, onDelete, onCreateProject, onClose }: FolderContextMenuProps) {
    if (!open) return null

    const position = useMemo(() => {
        const itemCount = [onCreateProject, onRename, onDelete].filter(Boolean).length
        const menuWidth = 140
        const menuHeight = 12 + itemCount * 36
        const maxX = Math.max(8, window.innerWidth - menuWidth - 8)
        const maxY = Math.max(8, window.innerHeight - menuHeight - 8)
        return {
            left: Math.min(Math.max(x, 8), maxX),
            top: Math.min(Math.max(y, 8), maxY),
        }
    }, [onCreateProject, onDelete, onRename, x, y])

    return (
        <>
            <div className="context-mask" onClick={onClose} />
            <div className="folder-menu" style={{ left: `${position.left}px`, top: `${position.top}px` }}>
                {onCreateProject ? (
                    <button
                        className="folder-menu-item"
                        onClick={() => {
                            onClose()
                            onCreateProject()
                        }}
                        type="button"
                    >
                        新增mod目录
                    </button>
                ) : null}
                {onRename ? (
                    <button
                        className="folder-menu-item"
                        onClick={() => {
                            onClose()
                            onRename()
                        }}
                        type="button"
                    >
                        重命名
                    </button>
                ) : null}
                {onDelete ? (
                    <button
                        className="folder-menu-item danger"
                        onClick={() => {
                            onClose()
                            onDelete()
                        }}
                        type="button"
                    >
                        删除文件夹
                    </button>
                ) : null}
            </div>
        </>
    )
}
