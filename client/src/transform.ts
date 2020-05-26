import { OT } from "./ot";

export function transform(ot: OT, buffer: readonly OT[]): OT {
  switch (ot.type) {
    case 'CHAR':
      if (ot.visible) {
        let leftShiftCount = buffer.filter(_ => _.type === 'CHAR' && _.index < ot.index && !_.visible).length
        // let rightShiftCount = buffer.filter(_ => _.type === 'CHAR' && _.index < ot.index && _.visible).length
        return {
          ...ot,
          index: ot.index - leftShiftCount
        }
      }
  }
  return ot
}
