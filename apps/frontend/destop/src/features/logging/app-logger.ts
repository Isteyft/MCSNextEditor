import { cleanupAppLogs, writeAppLog } from '../../services/log-api'

const LOG_RETENTION_DAYS = 15
let writeChain: Promise<unknown> = Promise.resolve()

function nowDateParts() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = `${now.getMonth() + 1}`.padStart(2, '0')
    const dd = `${now.getDate()}`.padStart(2, '0')
    const hh = `${now.getHours()}`.padStart(2, '0')
    const mi = `${now.getMinutes()}`.padStart(2, '0')
    const ss = `${now.getSeconds()}`.padStart(2, '0')
    return {
        fileDate: `${yyyy}-${mm}-${dd}`,
        stamp: `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`,
    }
}

function enqueueWrite(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
    const task = async () => {
        const { fileDate, stamp } = nowDateParts()
        const line = `[${stamp}] [${level}] ${message}`
        await writeAppLog(fileDate, line)
    }
    writeChain = writeChain.then(task).catch(() => undefined)
    return writeChain
}

export async function initAppLogger() {
    try {
        const deleted = await cleanupAppLogs(LOG_RETENTION_DAYS)
        await enqueueWrite('INFO', `logger initialized, cleaned old logs: ${deleted}`)
    } catch {
        // ignore logger init failure
    }
}

export function logInfo(message: string) {
    return enqueueWrite('INFO', message)
}

export function logWarn(message: string) {
    return enqueueWrite('WARN', message)
}

export function logError(message: string) {
    return enqueueWrite('ERROR', message)
}
