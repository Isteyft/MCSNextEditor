import type { JsonImportIssue, JsonImportResult } from './types'

function buildError(message: string, path?: string): JsonImportIssue {
    return {
        level: 'error',
        message,
        path,
    }
}

export function parseJsonUnknown(content: string, path?: string): JsonImportResult<unknown> {
    try {
        const normalizedContent = content.replace(/^\uFEFF/, '')
        return {
            ok: true,
            data: JSON.parse(normalizedContent) as unknown,
            issues: [],
        }
    } catch (error) {
        return {
            ok: false,
            data: null,
            issues: [buildError(`JSON parse failed: ${String(error)}`, path)],
        }
    }
}

export function parseJsonObject(
    content: string,
    fallback: Record<string, unknown>,
    path?: string
): JsonImportResult<Record<string, unknown>> {
    const parsed = parseJsonUnknown(content, path)
    if (!parsed.ok) {
        return {
            ok: false,
            data: fallback,
            issues: parsed.issues,
        }
    }
    if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
        return {
            ok: false,
            data: fallback,
            issues: [buildError('JSON root is not an object.', path)],
        }
    }
    return {
        ok: true,
        data: parsed.data as Record<string, unknown>,
        issues: [],
    }
}

type ReadFilePayload = (filePath: string) => Promise<{ content: string }>
type SaveFilePayload = (filePath: string, content: string) => Promise<unknown>

export async function readJsonUnknownWithFallback(params: {
    filePath: string
    defaultContent: string
    readFilePayload: ReadFilePayload
    saveFilePayload: SaveFilePayload
}): Promise<{ content: string; created: boolean }> {
    const { filePath, defaultContent, readFilePayload, saveFilePayload } = params
    try {
        const payload = await readFilePayload(filePath)
        return { content: String(payload.content ?? ''), created: false }
    } catch {
        await saveFilePayload(filePath, defaultContent)
        const payload = await readFilePayload(filePath)
        return { content: String(payload.content ?? ''), created: true }
    }
}
