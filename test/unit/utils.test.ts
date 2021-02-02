import { getXY } from '../../src/utils'

let pointInfo = {
  position: {
    left: 10,
    top: 10,
    width: 100,
    height: 100
  },
  value: 10
}

describe('[Test] utils', () => {
  test('getXY', () => {
    expect(getXY(pointInfo)).toEqual([60, 60])
  })
})
