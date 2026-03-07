import { Minus, Square, X } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'

type TopBarProps = {
    children: ReactNode
    onMinimize: () => void
    onToggleMaximize: () => void
    onClose: () => void
    onStartDragging: () => void
}

export function TopBar({ children, onMinimize, onToggleMaximize, onClose, onStartDragging }: TopBarProps) {
    const handleAction = (action: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        action()
    }

    const handleDragMouseDown = (event: MouseEvent<HTMLElement>) => {
        if (event.button !== 0) {
            return
        }
        const target = event.target as HTMLElement | null
        if (target?.closest('[data-no-drag]')) {
            return
        }
        onStartDragging()
    }

    return (
        <header className="topbar" onMouseDown={handleDragMouseDown}>
            <div className="topbar-left">{children}</div>
            <div className="topbar-spacer" />
            <div className="window-actions" data-no-drag>
                <button className="window-btn" data-no-drag onClick={handleAction(onMinimize)} title="最小化" type="button">
                    <Minus size={14} />
                </button>
                <button className="window-btn" data-no-drag onClick={handleAction(onToggleMaximize)} title="最大化/还原" type="button">
                    <Square size={12} />
                </button>
                <button className="window-btn danger" data-no-drag onClick={handleAction(onClose)} title="关闭" type="button">
                    <X size={14} />
                </button>
            </div>
        </header>
    )
}
