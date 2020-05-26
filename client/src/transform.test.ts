import { transform } from "./transform";
import { CharOT, OTToState } from "./ot";
import { uid } from "./util";

[
  {
    buffer: [ot(0, 'a'), ot(0, 'a', false)],
    ot0: ot(1, 'b'),
    ot1: ot(0, 'b')
  }
].forEach(({buffer, ot0, ot1}) => {
  test(`transform() shifts left/right: `, () => {
    assertCharsEqual(transform(ot0, buffer) as CharOT, ot1)
  })
})

test('transform() is commutative', () => {
  let buffer = [
    ot(0, 'a'),
    ot(1, 'b'),
    ot(2, 'e')
  ]
  let deleteB = ot(1, 'b', false)
  let insertC = ot(2, 'c')
  expect(OTToState([...buffer, transform(insertC, [...buffer, deleteB])]))
    .toEqual(OTToState([...buffer, transform(deleteB, [...buffer, insertC])]))
});

function assertBuffersEqual(as: readonly CharOT[], bs: readonly CharOT[]): void {
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
    visible
  }
}
