import {OT} from './ot'

export function applyTransformsToBuffer(
  updates: readonly OT[],
  buffer: readonly OT[]
): readonly OT[] {
  return updates.reduce((b, ot) => [...b, transform(ot, b)], buffer)
}

export function transform(ot: OT, buffer: readonly OT[]): OT {
  switch (ot.type) {
    case 'CHAR':
      if (ot.visible) {
        let leftShiftCount = buffer.filter(
          _ => _.type === 'CHAR' && _.index <= ot.index && !_.visible
        ).length
        // let rightShiftCount = buffer.filter(
        //   _ => _.type === 'CHAR' && _.index <= ot.index && _.visible
        // ).length
        return {
          ...ot,
          index: ot.index - leftShiftCount, //+ rightShiftCount,
        }
      }
  }
  return ot
}
