import {transform, applyTransformsToBuffer} from './transform'
import {CharOP, OP} from './ot'
import {uid, s} from './util'
;[
  {
    buffer: [rot(0, 'a'), lot(0, 'a', false)],
    input: rot(1, 'b'),
    output: rot(1, 'b'),
  },
].forEach(({buffer, input, output}) => {
  test(`transform() shifts left/right: `, () => {
    assertCharsEqual(transform(input, buffer), output)
  })
})

describe('transform() is commutative', () => {
  let cases = [
    {
      initialState: [rot(0, 'a'), rot(1, 'b'), rot(2, 'e')],
      updateA: [rot(1, 'b', false)],
      updateB: [rot(2, 'c')],
      expectedText: 'ace',
    },
    {
      initialState: [],
      updateA: [rot(0, 'a'), rot(1, 'b')],
      updateB: [rot(0, 'a'), rot(1, 'b')],
      expectedText: 'abab',
    },
    {
      initialState: [rot(0, 'o')],
      updateA: [rot(1, 'b'), rot(2, 'a')],
      updateB: [rot(0, 'b')],
      expectedText: 'boba',
    },
  ]
  cases.forEach(({expectedText, initialState, updateA, updateB}) => {
    let a = [...initialState, {type: 'START_MARKER'} as const, ...updateA]
    let b = [...initialState, {type: 'START_MARKER'} as const, ...updateB]
    test(`${s(a)} + ${s(updateB)} = ${s(b)} + ${s(
      updateA
    )} = ${expectedText}`, () => {
      expect(OTToState(applyTransformsToBuffer(updateB, a))).toBe(expectedText)
      expect(OTToState(applyTransformsToBuffer(updateA, b))).toBe(expectedText)
    })
  })
})

// function assertBuffersEqual(
//   as: readonly CharOT[],
//   bs: readonly CharOT[]
// ): void {
//   expect(as.map(stringify)).toEqual(bs.map(stringify))
// }

function assertCharsEqual(a: OP, b: OP): void {
  expect(s(a)).toBe(s(b))
}

function lot(index: number, value: string, visible = true): CharOP {
  return {
    type: 'CHAR',
    id: uid(),
    isCommitted: false,
    index,
    value,
    visible,
  }
}

function rot(index: number, value: string, visible = true): CharOP {
  return {
    type: 'CHAR',
    id: uid(),
    isCommitted: true,
    index,
    value,
    visible,
  }
}
