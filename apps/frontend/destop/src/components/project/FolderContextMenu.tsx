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

    return (
        <>
            <div className="context-mask" onClick={onClose} />
            <div className="folder-menu" style={{ left: `${x}px`, top: `${y}px` }}>
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
