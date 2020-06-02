export type OP = CharOP | StartOP | EndOP

export type StartOP = {type: 'START_MARKER'; id: ['START_MARKER', -1]}
export type EndOP = {type: 'END_MARKER'; id: ['END_MARKER', -1]}

export const StartOP: StartOP = {type: 'START_MARKER', id: ['START_MARKER', -1]}
export const EndOP: EndOP = {type: 'END_MARKER', id: ['END_MARKER', -1]}

/**
 * [clientID, sequenceID]
 */
export type ID = readonly [string, number]

export type CharOP = {
  id: ID
  index: number
  type: 'CHAR'
  maxSeenIDs: {[clientID: string]: number}
  value: string
  visible: boolean
}

export function isID(a: ID, b: ID): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

export function is(a: OP, b: OP): a is typeof b {
  if (a.type === 'START_MARKER') {
    return b.type === 'START_MARKER'
  }
  if (a.type === 'END_MARKER') {
    return b.type === 'END_MARKER'
  }
  if (a.type === 'CHAR' && b.type === 'CHAR') {
    return isID(a.id, b.id)
  }
  return false
}
