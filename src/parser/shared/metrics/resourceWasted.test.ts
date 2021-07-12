import { EnergizeEvent, EventType } from 'parser/core/Events';

import resourceWasted from './resourceWasted';

const energizeEvent = (id: number, amount: number = 100): EnergizeEvent => ({
  type: EventType.Energize,
  ability: {
    guid: id,
    name: 'test',
    type: 1,
    abilityIcon: 'test',
  },
  sourceID: 1,
  sourceIsFriendly: true,
  targetID: 1,
  targetIsFriendly: true,
  timestamp: 0,
  resourceChangeType: 0,
  resourceChange: amount,
  waste: 0,
  otherResourceChange: 0,
  resourceActor: 1, // this is unused, so a random value should suffice
  classResources: [],
  hitPoints: 100,
  maxHitPoints: 100,
  attackPower: 0,
  spellPower: 0,
  x: 0,
  y: 0,
  facing: 0,
  armor: 0,
  mapID: 0,
  itemLevel: 0,
});

describe('resourceWasted', () => {
  it('starts empty', () => {
    expect(resourceWasted([])).toEqual({});
  });
  it('tracks waste', () => {
    expect(resourceWasted([{ ...energizeEvent(1), resourceChange: 100, waste: 25 }])).toEqual({
      1: {
        0: {
          1: 25,
        },
      },
    });
    expect(resourceWasted([{ ...energizeEvent(1), resourceChange: 0, waste: 25 }])).toEqual({
      1: {
        0: {
          1: 25,
        },
      },
    });
    expect(
      resourceWasted([
        { ...energizeEvent(1), waste: 25 },
        { ...energizeEvent(3), waste: 50 },
        { ...energizeEvent(4), resourceChangeType: 2, waste: 75 },
      ]),
    ).toEqual({
      1: {
        0: {
          1: 25,
          3: 50,
        },
        2: {
          4: 75,
        },
      },
    });
  });
  it('adds up multiple events', () => {
    expect(
      resourceWasted([
        { ...energizeEvent(1), waste: 25 },
        { ...energizeEvent(1), waste: 50 },
      ]),
    ).toEqual({
      1: {
        0: {
          1: 75,
        },
      },
    });
  });
  it('does not include resource gain', () => {
    expect(resourceWasted([{ ...energizeEvent(1), resourceChange: 100, waste: 0 }])).toEqual({
      1: {
        0: {
          1: 0,
        },
      },
    });
  });
  it("tracks other player's resources wasted", () => {
    expect(
      resourceWasted([
        {
          ...energizeEvent(1),
          waste: 100,
          sourceID: 1,
          targetID: 2,
        },
      ]),
    ).toEqual({
      2: {
        0: {
          1: 100,
        },
      },
    });
  });
});
