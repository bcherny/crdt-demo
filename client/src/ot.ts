export type LocalOT =
  | LocalCharOT
  | {type: 'START_MARKER'}
  | {type: 'END_MARKER'}

export type RemoteOT =
  | RemoteCharOT
  | {type: 'START_MARKER'}
  | {type: 'END_MARKER'}

export type LocalCharOT = {
  id: string
  isCommitted: false
  type: 'CHAR'
  index: number
  value: string
  visible: boolean
}

export type RemoteCharOT = {
  id: string
  isCommitted: true
  type: 'CHAR'
  index: number
  value: string
  visible: boolean
}

export type MixedOT = LocalOT | RemoteOT

export function isLocalOT(ot: MixedOT): ot is LocalOT {
  return ot.type === 'CHAR' && !ot.isCommitted
}

export function is(a: MixedOT, b: MixedOT): a is typeof b {
  if (a.type === 'START_MARKER') {
    return b.type === 'START_MARKER'
  }
  if (a.type === 'END_MARKER') {
    return b.type === 'END_MARKER'
  }
  if (a.type === 'CHAR' && b.type === 'CHAR') {
    return a.id === b.id
  }
  return false
}
