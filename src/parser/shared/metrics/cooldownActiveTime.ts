import { Info } from 'parser/core/metric';
import { AnyEvent } from 'parser/core/Events';
import {
  ClosedTimePeriod,
  duration,
  OpenTimePeriod,
  unionOverFight,
} from 'parser/core/timePeriods';
import buffApplications from 'parser/shared/metrics/buffApplications';
import { activeTimePeriodSubset } from 'parser/shared/metrics/activeTime';

/**
 * Gets the percentage of time the player was active while given buff(s) were active.
 */
const cooldownActiveTime = (events: AnyEvent[], info: Info, spellIds: number[]): number => {
  const { playerId } = info;
  const applications = buffApplications(events);
  const times: OpenTimePeriod[] = spellIds.flatMap((spellId) => {
    const buffHistory = applications[spellId]?.[playerId];
    return !buffHistory ? [] : buffHistory;
  });
  const nonOverlappingTimes: ClosedTimePeriod[] = unionOverFight(times, info);
  const totalTime: number = duration(nonOverlappingTimes);
  const activeTime: number = nonOverlappingTimes.reduce(
    (acc, time) => acc + duration(activeTimePeriodSubset(events, info, time)),
    0,
  );
  return totalTime === 0 ? 1 : activeTime / totalTime;
};

export default cooldownActiveTime;
