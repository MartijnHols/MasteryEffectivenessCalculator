import { AnyEvent } from 'parser/core/Events';
import metric, { Info } from 'parser/core/metric';

import buffApplications from './buffApplications';

/**
 * Returns the total uptime of the buff. Any overlap is included (so the
 * total may be longer than the fight duration).
 */
const buffUptimeTotal = (
  events: AnyEvent[],
  info: Pick<Info, 'playerId' | 'fightStart' | 'fightEnd'>,
  spellId: number,
) => {
  const { playerId, fightStart, fightEnd } = info;
  const applications = buffApplications(events);
  const buffHistory = applications[spellId]?.[playerId];

  if (!buffHistory) {
    return 0;
  }

  return buffHistory.reduce(
    (uptime, buff) => uptime + (buff.end ?? fightEnd) - (buff.start ?? fightStart),
    0,
  );
};

export default metric(buffUptimeTotal);
