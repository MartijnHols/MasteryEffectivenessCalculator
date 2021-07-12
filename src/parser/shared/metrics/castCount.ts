import { AnyEvent, EventType } from 'parser/core/Events';
import metric, { Info } from 'parser/core/metric';

/**
 * Returns an object with the total amount of casts per spell.
 */
const castCount = (events: AnyEvent[], { playerId }: Pick<Info, 'playerId'>) =>
  events.reduce<{ [spellId: number]: number }>((obj, event) => {
    if (event.type === EventType.Cast && event.sourceID === playerId) {
      obj[event.ability.guid] = (obj[event.ability.guid] ?? 0) + 1;
    }
    return obj;
  }, {});

export default metric(castCount);
