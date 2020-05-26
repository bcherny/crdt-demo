export type OT =
  | CharOT
  | { type: "START_MARKER" }
  | { type: "END_MARKER" }

export type CharOT = {
  type: "CHAR"
  id: string
  index: number
  value: string
  visible: boolean
}

export function is(a: OT, b: OT): a is typeof b {
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

export function OTToState(ots: readonly OT[]): string {
  let initial: string[] = []
  ots.forEach(ot => {
    switch (ot.type) {
      case 'CHAR':
        if (ot.visible) {
          initial.splice(ot.index, 0, ot.value)
        } else {
          delete initial[ot.index]
        }
    }
  })
  return initial.join('')
}
