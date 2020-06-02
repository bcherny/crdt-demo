import {OP, ID} from './ot'

// OT with tombstones -> reduced, renderable OT
function betaReduceOT(ots: readonly OP[]): readonly OP[] {
  return ots.reduce<OP[]>((acc, ot) => {
    switch (ot.type) {
      case 'CHAR':
        if (ot.visible) {
          // insert
          acc.splice(ot.indices[0], 0, ot)
          return acc
        }
        // delete
        acc.splice(ot.indices[0], ot.indices[1] - ot.indices[0])
        return acc
      case 'START_MARKER':
      case 'END_MARKER':
        return [...acc, ot]
    }
  }, [])
}

export function OTToState(ots: readonly OP[]): string {
  return betaReduceOT(ots)
    .map(_ => (_.type === 'CHAR' ? _.value : ''))
    .join('')
}

export function IDToIndex(id: ID, buffer: readonly OP[]): number {
  let index = betaReduceOT(buffer).findIndex(_ => _.id === id)
  if (index < 0) {
    throw ReferenceError(
      `Can't find index for noe with ID ${id} in buffer [${buffer
        .map(_ => _.id)
        .join(', ')}]`
    )
  }
  return index
}

export function indexToID(index: number, buffer: readonly OP[]): ID {
  return betaReduceOT(buffer)[index].id
}

function getMaxSeenIDs(
  clientID: string,
  buffer: readonly OP[]
): {[clientID: string]: number} {
  return buffer.reduce<{[clientID: string]: number}>((map, op) => {
    switch (op.type) {
      case 'CHAR':
        let [_clientID, operationID] = op.id
        if (_clientID === clientID) {
          // Don't track for own updates
          return map
        }
        return {...map, [_clientID]: Math.max(operationID, map[_clientID] ?? 0)}
      case 'END_MARKER':
      case 'START_MARKER':
        return map
    }
  }, {})
}

let operationID = 0
export function applyDeleteToState(
  oldState: string,
  selectionStart: number,
  selectionEnd: number,
  clientID: string,
  buffer: readonly OP[]
): OP {
  let indices = [selectionStart, selectionEnd] as const
  console.log('indices', indices)
  let oldValue = oldState.slice(selectionStart - 1, selectionEnd)
  console.log(`DELETE "${oldValue}" @${stringifyRange(indices)}`)
  return {
    type: 'CHAR',
    id: [clientID, operationID++],
    indices,
    maxSeenIDs: getMaxSeenIDs(clientID, buffer),
    value: oldValue,
    visible: false,
  }
}

export function applyInsertToState(
  newValue: string,
  selectionStart: number,
  selectionEnd: number,
  clientID: string,
  buffer: readonly OP[]
): OP {
  let maxSeenIDs = getMaxSeenIDs(clientID, buffer)
  let indices = [selectionStart, selectionEnd] as const
  // let newValue = newState.slice(selectionStart - 1, selectionEnd)
  console.log(`INSERT "${newValue}" @${stringifyRange(indices)}`)
  return {
    type: 'CHAR',
    id: [clientID, operationID++],
    indices,
    maxSeenIDs,
    value: newValue,
    visible: true,
  }
}

function stringifyRange([a, b]: readonly [number, number]): string {
  if (a === b) {
    return a.toString()
  }
  return `${a}-${b}`
}
