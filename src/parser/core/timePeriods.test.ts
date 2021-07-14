import { duration, intersection, union } from 'parser/core/timePeriods';

function ctp (start: number, end: number) { return {start, end}; }
function otp (start?: number, end?: number) { return {start, end}; }

describe('duration', () => {
  it('handles single time periods', () => {
    expect(duration(ctp(10, 15))).toEqual(15 - 10);
    expect(duration(ctp(100, 200))).toEqual(200 - 100);
    expect(duration(ctp(-50, 0))).toEqual(0 - -50);
  });
  it('handles multiple time periods', () => {
    expect(duration([ctp(0, 1), ctp(3, 4), ctp(10, 12)])).toEqual(4);
  });
});

describe('intersection', () => {
  it('handles enclosed cases', () => {
    expect(intersection(ctp(10, 20), ctp(0, 100))).toEqual(ctp(10, 20));
    expect(intersection(ctp(0, 50), ctp(0, 100))).toEqual(ctp(0, 50));
    expect(intersection(ctp(30, 100), ctp(0, 100))).toEqual(ctp(30, 100));
  });
  it('handles closed edge cases', () => {
    expect(intersection(ctp(-30, 20), ctp(0, 100))).toEqual(ctp(0, 20));
    expect(intersection(ctp(50, 200), ctp(0, 100))).toEqual(ctp(50, 100));
    expect(intersection(ctp(-100, 1000), ctp(0, 100))).toEqual(ctp(0, 100));
  });
  it('handles open cases', () => {
    expect(intersection(otp(undefined, undefined), ctp(0, 100))).toEqual(ctp(0, 100));
    expect(intersection(otp(undefined, 20), ctp(0, 100))).toEqual(ctp(0, 20));
    expect(intersection(otp(20, undefined), ctp(0, 100))).toEqual(ctp(20, 100));
  });
});

describe('union', () => {
  it('handles simple non-overlapping', () => {
    expect(union([ctp(10, 20)], ctp(0, 100)))
      .toEqual([ctp(10, 20)]);
    expect(union([ctp(0, 10), ctp(30, 40), ctp(70, 90)], ctp(0, 100)))
      .toEqual([ctp(0, 10), ctp(30, 40), ctp(70, 90)]);
  });
  it('handles overlapping', () => {
    expect(union([ctp(10, 30), ctp(20, 40)], ctp(0, 100)))
      .toEqual([ctp(10, 40)]);
    expect(union([ctp(10, 30), ctp(20, 40), ctp(35, 70), ctp(90, 110)], ctp(0, 100)))
      .toEqual([ctp(10, 70), ctp(90, 100)]);
    expect(union([ctp(10, 70), ctp(20, 40), ctp(35, 60), ctp(90, 110)], ctp(0, 100)))
      .toEqual([ctp(10, 70), ctp(90, 100)]);
  });
  it('handles adjacent merging', () => {
    expect(union([ctp(10, 30), ctp(30, 40)], ctp(0, 100)))
      .toEqual([ctp(10, 40)]);
  });
  it('handles open time periods', () => {
    expect(union([otp(undefined, 30), ctp(20, 40), otp(60, undefined)], ctp(0, 100)))
      .toEqual([ctp(0, 40), ctp(60, 100)]);
  });
  it('handles out of order time periods', () => {
    expect(union([ctp(70, 90), ctp(0, 10), ctp(30, 40)], ctp(0, 100)))
      .toEqual([ctp(0, 10), ctp(30, 40), ctp(70, 90)]);
    expect(union([ctp(70, 90), ctp(15, 30), ctp(5, 20)], ctp(0, 100)))
      .toEqual([ctp(5, 30), ctp(70, 90)]);
  });
});
