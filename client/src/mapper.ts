import {LocalOP, MixedOP, ID, is, isID} from './ot'
import {ins, del} from './util'

// OT with tombstones -> reduced, renderable OT
function betaReduceOT(ots: readonly MixedOP[]): readonly MixedOP[] {
  return ots.reduce<MixedOP[]>((acc, ot) => {
    switch (ot.type) {
      case 'CHAR':
        // let after = ots.findIndex(_ => isID(_.id, ot.after))
        // if (after < 0) {
        //   throw ReferenceError(
        //     `Invariant: Unable to find "after" with id ${
        //       ot.after
        //     } to insert node with id ${ot.id} in [${ots
        //       .map(_ => _.id)
        //       .join(', ')}]`
        //   )
        // }
        if (ot.visible) {
          // insert
          acc.splice(ot.index, 0, ot)
        } else {
          // delete
          acc.splice(ot.index, 1)
        }
        return acc
      case 'START_MARKER':
      case 'END_MARKER':
        return [...acc, ot]
    }
  }, [])
}

export function OTToState(ots: readonly MixedOP[]): string {
  return betaReduceOT(ots)
    .map(_ => (_.type === 'CHAR' ? _.value : ''))
    .join('')
}

export function IDToIndex(id: ID, buffer: readonly MixedOP[]): number {
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

export function indexToID(index: number, buffer: readonly MixedOP[]): ID {
  return betaReduceOT(buffer)[index].id
}

let operationID = 0
export function stateChangeToOT(
  oldState: string,
  newState: string,
  cursorSelection: number,
  clientID: string,
  buffer: readonly MixedOP[]
): LocalOP {
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
      isCommitted: false,
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
    isCommitted: false,
    maxSeenIDs,
    value: oldValue,
    visible: false,
  }
}
