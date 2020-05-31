import {MixedOT, RemoteOT} from './ot'

export function applyTransformsToBuffer(
  updates: readonly RemoteOT[],
  buffer: readonly MixedOT[]
): readonly MixedOT[] {
  return updates.reduce((b, ot) => [...b, transform(ot, b)], buffer)
}

export function transform(ot: RemoteOT, buffer: readonly MixedOT[]): RemoteOT {
  switch (ot.type) {
    case 'CHAR':
      if (ot.visible) {
        let leftShiftCount = buffer.filter(
          _ =>
            _.type === 'CHAR' &&
            _.index <= ot.index &&
            !_.visible &&
            !_.isCommitted
        ).length
        let rightShiftCount = buffer.filter(
          _ =>
            _.type === 'CHAR' &&
            _.index <= ot.index &&
            _.visible &&
            !_.isCommitted
        ).length
        return {
          ...ot,
          index: ot.index - leftShiftCount + rightShiftCount,
        }
      }
  }
  return ot
}
