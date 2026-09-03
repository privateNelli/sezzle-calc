import type { Operation } from './types'

export type PadKey =
  | { id: string; kind: 'digit'; digit: string; label: string; ariaLabel: string; wide?: boolean }
  | { id: string; kind: 'decimal'; label: string; ariaLabel: string }
  | { id: string; kind: 'equals'; label: string; ariaLabel: string }
  | { id: string; kind: 'clear'; label: string; ariaLabel: string }
  | { id: string; kind: 'sign'; label: string; ariaLabel: string }
  | {
      id: string
      kind: 'operation'
      operationId: string
      label: string
      ariaLabel: string
      variant: 'accent' | 'function'
    }

const KNOWN_OPERATION_IDS = ['add', 'subtract', 'multiply', 'divide', 'percentage', 'sqrt', 'power']

export function buildKeypadRows(operations: Operation[], clearLabel: 'AC' | 'C'): PadKey[][] {
  const byId = new Map(operations.map((item) => [item.id, item]))
  const extraOperations = operations.filter((item) => !KNOWN_OPERATION_IDS.includes(item.id))

  const rows: PadKey[][] = [
    compactRow([
      { id: 'clear', kind: 'clear', label: clearLabel, ariaLabel: clearLabel === 'AC' ? 'All Clear' : 'Clear' },
      { id: 'sign', kind: 'sign', label: '+/−', ariaLabel: 'Toggle sign' },
      optionalOperation(byId.get('percentage'), 'function'),
      optionalOperation(byId.get('divide'), 'accent'),
    ]),
    compactRow([
      digitKey('7'),
      digitKey('8'),
      digitKey('9'),
      optionalOperation(byId.get('multiply'), 'accent'),
    ]),
    compactRow([
      digitKey('4'),
      digitKey('5'),
      digitKey('6'),
      optionalOperation(byId.get('subtract'), 'accent'),
    ]),
    compactRow([
      digitKey('1'),
      digitKey('2'),
      digitKey('3'),
      optionalOperation(byId.get('add'), 'accent'),
    ]),
    [
      { ...digitKey('0'), wide: true },
      { id: 'decimal', kind: 'decimal', label: '.', ariaLabel: 'Decimal point' },
      { id: 'equals', kind: 'equals', label: '=', ariaLabel: 'Equals' },
    ],
  ]

  const scientific = compactRow([
    optionalOperation(byId.get('sqrt'), 'function'),
    optionalOperation(byId.get('power'), 'accent'),
    ...extraOperations.map((item) => operationKey(item, item.arity === 1 ? 'function' : 'accent')),
  ])

  if (scientific.length > 0) {
    rows.push(scientific)
  }

  return rows
}

function digitKey(digit: string): Extract<PadKey, { kind: 'digit' }> {
  return { id: `digit-${digit}`, kind: 'digit', digit, label: digit, ariaLabel: digit }
}

function optionalOperation(
  operation: Operation | undefined,
  variant: 'accent' | 'function',
): PadKey | null {
  return operation ? operationKey(operation, variant) : null
}

function operationKey(operation: Operation, variant: 'accent' | 'function'): PadKey {
  return {
    id: `op-${operation.id}`,
    kind: 'operation',
    operationId: operation.id,
    label: operation.symbol,
    ariaLabel: operation.label,
    variant,
  }
}

function compactRow(keys: Array<PadKey | null>): PadKey[] {
  return keys.filter((key): key is PadKey => key !== null)
}
