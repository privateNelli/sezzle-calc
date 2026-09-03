export const HISTORY_STORAGE_KEY = 'sezzle-calculator-history'
export const HISTORY_LIMIT = 50

export type HistoryEntry = {
  id: string
  expression: string
  analysis: string
  result: number
  createdAt: string
}

export type HistoryDraft = {
  expression: string
  analysis: string
  result: number
}

export function addHistoryEntry(
  history: HistoryEntry[],
  draft: HistoryDraft,
  limit = HISTORY_LIMIT,
): HistoryEntry[] {
  const entry: HistoryEntry = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  return [entry, ...history].slice(0, limit)
}

export function serializeHistory(entries: HistoryEntry[]): string {
  return JSON.stringify(entries)
}

export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isHistoryEntry)
  } catch {
    return []
  }
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.expression === 'string' &&
    typeof entry.analysis === 'string' &&
    typeof entry.result === 'number' &&
    Number.isFinite(entry.result) &&
    typeof entry.createdAt === 'string'
  )
}
