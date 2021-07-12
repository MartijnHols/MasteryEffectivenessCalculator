import { CastEvent, EventType } from 'parser/core/Events';
import { Info } from 'parser/core/metric';

import castCount from './castCount';

const castEvent = (id: number): CastEvent => ({
  type: EventType.Cast,
  ability: {
    guid: id,
    name: 'test',
    type: 1,
    abilityIcon: 'test',
  },
  sourceID: 1,
  sourceIsFriendly: true,
  targetID: 2,
  targetIsFriendly: false,
  timestamp: 0,
});

describe('castCount', () => {
  const info: Pick<Info, 'playerId'> = {
    playerId: 1,
  };

  it('starts empty', () => {
    expect(castCount([], info)).toEqual({});
  });
  it('tracks casts', () => {
    expect(castCount([castEvent(1)], info)).toEqual({
      1: 1,
    });
    expect(castCount([castEvent(3)], info)).toEqual({
      3: 1,
    });
    expect(castCount([castEvent(1), castEvent(3)], info)).toEqual({
      1: 1,
      3: 1,
    });
    expect(
      castCount(
        [castEvent(1), castEvent(3), castEvent(3), castEvent(3), castEvent(1), castEvent(3)],
        info,
      ),
    ).toEqual({
      1: 2,
      3: 4,
    });
  });
  it("ignores other player's spells", () => {
    expect(
      castCount(
        [
          {
            ...castEvent(1),
            sourceID: 2,
            targetID: 1,
          },
        ],
        info,
      ),
    ).toEqual({});
  });
});
