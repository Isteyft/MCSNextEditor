import { invoke } from '@tauri-apps/api/core'

export async function writeAppLog(fileDate: string, line: string) {
    return invoke<string>('write_app_log', { fileDate, line })
}

export async function cleanupAppLogs(retentionDays: number) {
    return invoke<number>('cleanup_app_logs', { retentionDays })
}
