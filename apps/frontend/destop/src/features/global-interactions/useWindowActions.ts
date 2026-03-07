type WindowLike = {
    close: () => Promise<void>
    minimize: () => Promise<void>
    startDragging: () => Promise<void>
    isMaximized: () => Promise<boolean>
    maximize: () => Promise<void>
    unmaximize: () => Promise<void>
}

export function useWindowActions(appWindow: WindowLike) {
    async function handleToggleMaximize() {
        const maximized = await appWindow.isMaximized()
        if (maximized) {
            await appWindow.unmaximize()
            return
        }
        await appWindow.maximize()
    }

    return {
        handleToggleMaximize,
        handleClose: () => appWindow.close(),
        handleMinimize: () => appWindow.minimize(),
        handleStartDragging: () => appWindow.startDragging(),
    }
}
