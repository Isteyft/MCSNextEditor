export type JsonImportIssueLevel = 'error' | 'warning'

export type JsonImportIssue = {
    level: JsonImportIssueLevel
    message: string
    path?: string
}

export type JsonImportResult<T> = {
    ok: boolean
    data: T
    issues: JsonImportIssue[]
}
