import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'

import type { HistoryEntry } from '../domain/history'
import { CalculatorHistory } from './CalculatorHistory'
import {
  SHEET_DEFAULT_RATIO,
  SHEET_MAX_RATIO,
  SHEET_MIN_RATIO,
  sheetRatioFromDrag,
  settleSheetDrag,
  stepSheetRatio,
  type SheetSettleResult,
} from './sheet-height'

type HistorySheetProps = {
  open: boolean
  entries: HistoryEntry[]
  onClose: () => void
  onRecall: (value: number) => void
  onClear: () => void
}

type DragState = {
  pointerId: number
  startY: number
  startRatio: number
}

export function HistorySheet({ open, entries, onClose, onRecall, onClear }: HistorySheetProps) {
  const [heightRatio, setHeightRatio] = useState(SHEET_DEFAULT_RATIO)
  const [dragging, setDragging] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  const drag = useRef<DragState | null>(null)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setHeightRatio(SHEET_DEFAULT_RATIO)
      setDragging(false)
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    function onPointerMove(event: PointerEvent) {
      const active = drag.current
      if (!active || event.pointerId !== active.pointerId) {
        return
      }

      const next = sheetRatioFromDrag(active.startRatio, active.startY, event.clientY, window.innerHeight)
      setHeightRatio(Math.min(SHEET_MAX_RATIO, Math.max(0.08, next)))
    }

    function onPointerUp(event: PointerEvent) {
      const active = drag.current
      if (!active || event.pointerId !== active.pointerId) {
        return
      }

      const next = sheetRatioFromDrag(active.startRatio, active.startY, event.clientY, window.innerHeight)
      drag.current = null
      setDragging(false)

      const settled = settleSheetDrag(next)
      if (settled.action === 'close') {
        onClose()
        return
      }

      setHeightRatio(settled.ratio)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  function applySettle(result: SheetSettleResult) {
    if (result.action === 'close') {
      onClose()
      return
    }

    setHeightRatio(result.ratio)
  }

  function onHandleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        applySettle(stepSheetRatio(heightRatio, 1))
        break
      case 'ArrowDown':
        event.preventDefault()
        applySettle(stepSheetRatio(heightRatio, -1))
        break
      case 'Home':
        event.preventDefault()
        setHeightRatio(SHEET_MAX_RATIO)
        break
      case 'End':
        event.preventDefault()
        setHeightRatio(SHEET_MIN_RATIO)
        break
      default:
        break
    }
  }

  const sheetClassName = dragging ? 'bottom-sheet history-panel is-dragging' : 'bottom-sheet history-panel'
  const sheetStyle = { '--sheet-height': `${heightRatio * 100}svh` } as CSSProperties

  return (
    <div className="history-sheet">
      <button type="button" className="sheet-backdrop" aria-label="Dismiss history" onClick={onClose} />
      <section
        className={sheetClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        style={sheetStyle}
      >
        <div
          role="slider"
          tabIndex={0}
          className="sheet-handle-hit"
          aria-label="History sheet height"
          aria-valuemin={Math.round(SHEET_MIN_RATIO * 100)}
          aria-valuemax={Math.round(SHEET_MAX_RATIO * 100)}
          aria-valuenow={Math.round(heightRatio * 100)}
          aria-orientation="vertical"
          onKeyDown={onHandleKeyDown}
          onPointerDown={(event) => {
            if (event.button !== 0) {
              return
            }

            event.currentTarget.setPointerCapture?.(event.pointerId)
            drag.current = {
              pointerId: event.pointerId,
              startY: event.clientY,
              startRatio: heightRatio,
            }
            setDragging(true)
          }}
        >
          <div className="sheet-handle" aria-hidden="true" />
        </div>
        <CalculatorHistory
          entries={entries}
          onRecall={(value) => {
            onRecall(value)
            onClose()
          }}
          onClear={onClear}
          onClose={onClose}
        />
      </section>
    </div>
  )
}
