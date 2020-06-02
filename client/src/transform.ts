import {MixedOP, RemoteOP, isID} from './ot'

export function applyTransformsToBuffer(
  updates: readonly RemoteOP[],
  buffer: readonly MixedOP[],
  clientID: string
): readonly MixedOP[] {
  return updates.reduce((b, ot) => [...b, transform(ot, b, clientID)], buffer)
}

function it(ot: RemoteOP, contextOT: MixedOP): RemoteOP {
  switch (ot.type) {
    case 'CHAR':
      switch (contextOT.type) {
        case 'CHAR':
          if (!ot.visible || !contextOT.visible) {
            // Removals win
            return {...ot, visible: false}
          }
          // Rebase: Inserted after
          if (ot.index >= contextOT.index) {
            if (ot.id[0] > contextOT.id[0]) {
              // win
              return ot
            } else {
              // lose
              return {...ot, index: ot.index + 1}
            }
          }
          return ot
        case 'END_MARKER':
        case 'START_MARKER':
          return ot
      }
    case 'END_MARKER':
    case 'START_MARKER':
      return ot
  }
}

export function transform(
  op: RemoteOP,
  buffer: readonly MixedOP[],
  clientID: string
): RemoteOP {
  switch (op.type) {
    case 'CHAR':
      // Grab the latest sequence ID of ops in our buffer that they saw
      let latestID = op.maxSeenIDs[clientID] ?? -1

      let opTransformed: RemoteOP = op
      for (let i = 0; i < buffer.length; i++) {
        let _op = buffer[i]
        if (_op.type !== 'CHAR') {
          continue
        }
        if (_op.id[0] === opTransformed.id[0]) {
          // The remote client has already seen all of their own operations
          continue
        }
        if (_op.id[1] <= latestID) {
          // The remote client has already seen this operation of ours
          continue
        }
        opTransformed = it(opTransformed, _op)
      }
      return opTransformed
    case 'END_MARKER':
    case 'END_MARKER':
      return op
  }
  return op
}
