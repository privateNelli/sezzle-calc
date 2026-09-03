export const SHEET_MIN_RATIO = 0.32
export const SHEET_DEFAULT_RATIO = 0.55
export const SHEET_MAX_RATIO = 0.92
export const SHEET_CLOSE_RATIO = 0.22

export const SHEET_SNAPS = [SHEET_MIN_RATIO, SHEET_DEFAULT_RATIO, SHEET_MAX_RATIO] as const

export type SheetSettleResult = { action: 'close' } | { action: 'snap'; ratio: number }

export function sheetRatioFromDrag(
  startRatio: number,
  startY: number,
  currentY: number,
  viewportHeight: number,
): number {
  return startRatio + (startY - currentY) / viewportHeight
}

export function settleSheetDrag(ratio: number): SheetSettleResult {
  if (ratio <= SHEET_CLOSE_RATIO) {
    return { action: 'close' }
  }

  return { action: 'snap', ratio: nearestSnap(ratio) }
}

export function stepSheetRatio(ratio: number, direction: 1 | -1): SheetSettleResult {
  const index = nearestSnapIndex(ratio)
  const nextIndex = index + direction

  if (nextIndex < 0) {
    return { action: 'close' }
  }

  const next = SHEET_SNAPS[Math.min(SHEET_SNAPS.length - 1, nextIndex)]
  return { action: 'snap', ratio: next ?? SHEET_MAX_RATIO }
}

function nearestSnap(ratio: number): number {
  return SHEET_SNAPS[nearestSnapIndex(ratio)] ?? SHEET_DEFAULT_RATIO
}

function nearestSnapIndex(ratio: number): number {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < SHEET_SNAPS.length; index += 1) {
    const snap = SHEET_SNAPS[index]
    if (snap === undefined) {
      continue
    }

    const distance = Math.abs(ratio - snap)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}
