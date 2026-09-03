export function formatOperand(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error'
  }
  if (Object.is(value, -0)) {
    return '-0'
  }

  const absolute = Math.abs(value)
  if (absolute !== 0 && (absolute >= 1e9 || absolute < 1e-8)) {
    return trimScientific(value.toExponential(6))
  }

  return trimTrailingZeros(value.toPrecision(9))
}

function trimScientific(value: string): string {
  return value.replace(/e\+/, 'e')
}

function trimTrailingZeros(value: string): string {
  if (/[eE]/.test(value)) {
    return trimScientific(value)
  }
  if (!value.includes('.')) {
    return value
  }

  return value.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
}
