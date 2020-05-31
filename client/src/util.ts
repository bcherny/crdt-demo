import {MixedOT} from './ot'

export function uid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return S4() + S4() + S4()
}

export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1]
}

export function del(s: string, index: number): string {
  if (index < 0) {
    return s
  }
  return s.slice(0, index) + s.slice(index + 1)
}

export function ins(s: string, needle: string, index: number): string {
  if (index < 0) {
    return s
  }
  return s.slice(0, index) + needle + s.slice(index)
}

export function swap<T>(
  array: readonly T[],
  element: T,
  replacement: T
): readonly T[] {
  let index = array.indexOf(element)
  if (index < 0) {
    return array
  }
  return [...array.slice(0, index), replacement, ...array.slice(index + 1)]
}

export function s(ots: MixedOT | MixedOT[]): string {
  if (Array.isArray(ots)) {
    return ots.map(s).join(' ')
  }
  if (ots.type !== 'CHAR') {
    return ots.type
  }
  return `${ots.visible ? '' : '-'}${ots.value}`
}

function skipWhile<T>(
  array: readonly T[],
  f: (value: T, index: number) => boolean
): readonly T[] {
  let i = 0
  while (i < array.length && f(array[i], i)) {
    i++
  }
  return array.slice(i)
}
