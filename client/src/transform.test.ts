import {transform, applyTransformsToBuffer} from './transform'
import {CharOT, OTToState} from './ot'
import {uid} from './util'
;[
  {
    buffer: [ot(0, 'a'), ot(0, 'a', false)],
    input: ot(1, 'b'),
    output: ot(0, 'b'),
  },
].forEach(({buffer, input, output}) => {
  test(`transform() shifts left/right: `, () => {
    assertCharsEqual(transform(input, buffer) as CharOT, output)
  })
})

function s(ots: CharOT | CharOT[]): string {
  if (Array.isArray(ots)) {
    return ots.map(s).join(' ')
  }
  return `${ots.visible ? '' : '-'}${ots.value}`
}

describe('transform() is commutative', () => {
  let cases = [
    {
      initialState: [ot(0, 'a'), ot(1, 'b'), ot(2, 'e')],
      updateA: [ot(1, 'b', false)],
      updateB: [ot(2, 'c')],
      expectedText: 'ace',
    },
    {
      initialState: [],
      updateA: [ot(0, 'a'), ot(1, 'b')],
      updateB: [ot(0, 'a'), ot(1, 'b')],
      expectedText: 'abab',
    },
  ]
  cases.forEach(({expectedText, initialState, updateA, updateB}) => {
    let a = [...initialState, ...updateA]
    let b = [...initialState, ...updateB]
    test(`${s(a)} + ${s(updateB)} = ${s(b)} + ${s(
      updateA
    )} = ${expectedText}`, () => {
      expect(OTToState(applyTransformsToBuffer(updateB, a))).toBe(expectedText)
      expect(OTToState(applyTransformsToBuffer(updateA, b))).toBe(expectedText)
    })
  })
})

function assertBuffersEqual(
  as: readonly CharOT[],
  bs: readonly CharOT[]
): void {
  expect(as.map(stringify)).toEqual(bs.map(stringify))
}

function assertCharsEqual(a: CharOT, b: CharOT): void {
  expect(stringify(a)).toBe(stringify(b))
}

function stringify(ot: CharOT): string {
  if (!ot.visible) {
    return '(-' + ot.index + ': ' + ot.value + ')'
  }
  return '(+' + ot.index + ': ' + ot.value + ')'
}

function ot(index: number, value: string, visible = true): CharOT {
  return {
    type: 'CHAR',
    id: uid(),
    index,
    value,
    visible,
  }
}
