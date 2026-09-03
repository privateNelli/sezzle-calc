import { describe, expect, it } from 'vitest'

import {
  SHEET_CLOSE_RATIO,
  SHEET_DEFAULT_RATIO,
  SHEET_MAX_RATIO,
  SHEET_MIN_RATIO,
  sheetRatioFromDrag,
  settleSheetDrag,
  stepSheetRatio,
} from './sheet-height'

describe('sheet-height', () => {
  it('grows the sheet when the handle is dragged up', () => {
    expect(sheetRatioFromDrag(0.5, 400, 300, 1000)).toBeCloseTo(0.6)
  })

  it('shrinks the sheet when the handle is dragged down', () => {
    expect(sheetRatioFromDrag(0.5, 400, 550, 1000)).toBeCloseTo(0.35)
  })

  it('snaps to the nearest height after a drag', () => {
    expect(settleSheetDrag(0.5)).toEqual({ action: 'snap', ratio: SHEET_DEFAULT_RATIO })
    expect(settleSheetDrag(0.86)).toEqual({ action: 'snap', ratio: SHEET_MAX_RATIO })
    expect(settleSheetDrag(0.34)).toEqual({ action: 'snap', ratio: SHEET_MIN_RATIO })
  })

  it('closes when dragged below the dismiss threshold', () => {
    expect(settleSheetDrag(SHEET_CLOSE_RATIO)).toEqual({ action: 'close' })
    expect(settleSheetDrag(0.1)).toEqual({ action: 'close' })
  })

  it('steps between snap points from the keyboard', () => {
    expect(stepSheetRatio(SHEET_DEFAULT_RATIO, 1)).toEqual({ action: 'snap', ratio: SHEET_MAX_RATIO })
    expect(stepSheetRatio(SHEET_DEFAULT_RATIO, -1)).toEqual({ action: 'snap', ratio: SHEET_MIN_RATIO })
    expect(stepSheetRatio(SHEET_MIN_RATIO, -1)).toEqual({ action: 'close' })
    expect(stepSheetRatio(SHEET_MAX_RATIO, 1)).toEqual({ action: 'snap', ratio: SHEET_MAX_RATIO })
  })
})
