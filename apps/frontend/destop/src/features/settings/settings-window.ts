import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

const SETTINGS_WINDOW_LABEL = 'settings-window'

export async function openOrFocusSettingsWindow() {
    const existing = await WebviewWindow.getByLabel(SETTINGS_WINDOW_LABEL)
    if (existing) {
        await existing.show()
        await existing.setFocus()
        return
    }

    const url = `${window.location.origin}${window.location.pathname}?view=settings`
    const win = new WebviewWindow(SETTINGS_WINDOW_LABEL, {
        url,
        title: '设置',
        width: 1120,
        height: 820,
        minWidth: 960,
        minHeight: 680,
        resizable: true,
        decorations: true,
        center: true,
    })

    await new Promise<void>((resolve, reject) => {
        let settled = false
        void win.once('tauri://created', () => {
            if (settled) return
            settled = true
            resolve()
        })
        void win.once('tauri://error', event => {
            if (settled) return
            settled = true
            const payload =
                typeof event.payload === 'string' && event.payload.trim().length > 0 ? event.payload : 'failed to create settings window'
            reject(new Error(payload))
        })
    })
}

export async function closeSettingsWindowIfOpen() {
    const existing = await WebviewWindow.getByLabel(SETTINGS_WINDOW_LABEL)
    if (!existing) return
    await existing.close()
}
