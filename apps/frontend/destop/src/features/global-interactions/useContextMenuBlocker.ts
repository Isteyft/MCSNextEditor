import { useEffect } from 'react'

export function useContextMenuBlocker() {
    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault()
        }
        window.addEventListener('contextmenu', handleContextMenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [])
}
