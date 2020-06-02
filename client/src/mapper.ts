import {OP, ID} from './ot'

// OT with tombstones -> reduced, renderable OT
function betaReduceOT(ots: readonly OP[]): readonly OP[] {
  return ots.reduce<OP[]>((acc, ot) => {
    switch (ot.type) {
      case 'CHAR':
        if (ot.visible) {
          // insert
          acc.splice(ot.index, 0, ot)
          return acc
        }
        // delete
        acc.splice(ot.index, 1)
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

let operationID = 0
export function stateChangeToOT(
  oldState: string,
  newState: string,
  cursorSelection: number,
  clientID: string,
  buffer: readonly OP[]
): OP {
  let maxSeenIDs = buffer.reduce<{[clientID: string]: number}>((map, op) => {
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

  // Insert
  if (newState.length > oldState.length) {
    let index = cursorSelection - 1
    let newValue = newState[index]
    console.log(`INSERT ${newValue} @${index}`)
    return {
      type: 'CHAR',
      id: [clientID, operationID++],
      index,
      maxSeenIDs,
      value: newValue,
      visible: true,
    }
  }

  // Delete
  let index = cursorSelection
  let oldValue = oldState[index]
  console.log(`DELETE ${oldValue} @${index}`)
  return {
    type: 'CHAR',
    id: [clientID, operationID++],
    index,
    maxSeenIDs,
    value: oldValue,
    visible: false,
  }
}
