import { CastEvent, EventType } from 'parser/core/Events';
import { Info } from 'parser/core/metric';
import Ability from 'parser/core/modules/Ability';

import lowRankSpells from './lowRankSpells';

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

describe('lowRankSpells', () => {
  const info: Info = {
    abilities: [
      new Ability(undefined, {
        spell: 5,
        category: 'test',
        lowerRanks: [1, 3],
      }),
    ],
    playerId: 1,
    fightStart: 0,
    fightEnd: 0,
    fightDuration: 0,
    fightId: 1,
    reportCode: 'test',
  };

  it('starts empty', () => {
    expect(lowRankSpells()([], info)).toHaveLength(0);
  });
  it('fails on low rank spells', () => {
    expect(lowRankSpells()([castEvent(1)], info)).toHaveLength(1);
    expect(lowRankSpells()([castEvent(3)], info)).toHaveLength(1);
  });
  it('ignores unrelated spells', () => {
    expect(lowRankSpells()([castEvent(2)], info)).toHaveLength(0);
  });
  it('passes on the main spell', () => {
    expect(lowRankSpells()([castEvent(5)], info)).toHaveLength(0);
  });
  it("ignores other player's spells", () => {
    expect(
      lowRankSpells()(
        [
          {
            ...castEvent(1),
            sourceID: 2,
            targetID: 1,
          },
        ],
        info,
      ),
    ).toHaveLength(0);
  });
});
