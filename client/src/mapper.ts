import {LocalOT, MixedOT} from './ot'
import {uid, ins, del} from './util'

export function OTToState(ots: readonly MixedOT[]): string {
  return ots.reduce((s, ot) => {
    switch (ot.type) {
      case 'CHAR':
        if (ot.visible) {
          return ins(s, ot.value, ot.index)
        } else {
          return del(s, ot.index)
        }
      case 'END_MARKER':
      case 'START_MARKER':
        return s
    }
  }, '')
}

export function stateChangeToOT(
  oldState: string,
  newState: string,
  cursorSelection: number
): LocalOT {
  // Insert
  if (newState.length > oldState.length) {
    let index = cursorSelection - 1
    let newValue = newState[index]
    console.log(`INSERT ${newValue} @${index}`)
    return {
      type: 'CHAR',
      id: uid(),
      index,
      isCommitted: false,
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
    id: uid(),
    index,
    isCommitted: false,
    value: oldValue,
    visible: false,
  }
}
