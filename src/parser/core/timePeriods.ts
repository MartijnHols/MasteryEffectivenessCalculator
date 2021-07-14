/*
 * A collection of types and functions that help with the creation and manipulation of time periods.
 * All time fields are implicitly assumed to be log timestamps i.e. milliseconds since start of logging.
 */

import { Info } from 'parser/core/metric';

/**
 * A standard time period with explicitly defined start and end times.
 */
export type ClosedTimePeriod = {
  start: number;
  end: number;
};

/**
 * An 'open' time period whose start and/or end times might not be defined.
 * Open time periods may be bounded by its enclosing time period during calculations.
 *
 * For example, a buff's duration might be an open time period with respect to the encounter,
 * where the buff might not have a start time if it was applied before the encounter
 * and might not have an end time if it was still active when the encounter ended.
 * In this case, the fight's duration is the enclosing time period.
 */
export type OpenTimePeriod = Partial<ClosedTimePeriod>;

/** Returns the total duration of the given time period(s).
 * Overlap will NOT be considered, use union first if non-overlapping duration is required. */
export function duration(time: ClosedTimePeriod | ClosedTimePeriod[]): number {
  return Array.isArray(time)
    ? time.reduce((acc, t) => acc + t.end - t.start, 0)
    : time.end - time.start;
}

/**
 * Gets the logical intersection of two time periods, at least one of which must be closed
 * @return a closed time period representing the intersection of the two period,
 *   or null if the time periods do not overlap
 */
export function intersection(
  time: OpenTimePeriod,
  closedTime: ClosedTimePeriod,
): ClosedTimePeriod | null {
  const start =
    time.start === undefined ? closedTime.start : Math.max(time.start, closedTime.start);
  const end = time.end === undefined ? closedTime.end : Math.min(time.end, closedTime.end);
  return start >= end ? null : { start, end };
}

/*
 * A picture of what union does:
 * times:
 *         <*******>
 *   <******>
 *       <*******>
 *                    <*****************
 * enclosingTimePeriod:
 * |***********************|
 * returns:
 *   <*************>  <****>
 */
/**
 * Gets the logical union of several time periods, bounded by an intersection with an enclosing time period.
 * @return closed time periods representing the union of the given periods intersected with the
 *   enclosing time period, in ascending time order. Adjacent time periods that 'touch' but do not
 *   overlap will be merged into single time periods.
 */
export function union(
  times: OpenTimePeriod[],
  enclosingTimePeriod: ClosedTimePeriod,
): ClosedTimePeriod[] {
  /*
   * Algorithm:
   * Break down the time periods into 'start' and 'end' events, then sort them by time.
   * Iterate through the events in order while keeping track of the number of active time periods
   * by incrementing a counter for every 'start' and decrementing for every 'end'.
   * When the counter goes from 0 to 1 we know it's the start of a merged time period,
   * and when it goes from 1 to 0 we know it's the end of that period.
   * We can then further consolidate time periods by merging adjacent periods,
   * which could happen if there is an edge from 1 to 0 then 0 to 1 on the same timestamp.
   */
  type PeriodEdge = { time: number; change: number };
  const merged: ClosedTimePeriod[] = [];
  let active = 0;
  let currStart = 0;
  times
    .map((otp) => intersection(otp, enclosingTimePeriod))
    .filter((otp): otp is ClosedTimePeriod => otp !== null)
    .flatMap((time) => [
      { time: time.start, change: 1 },
      { time: time.end, change: -1 },
    ])
    .sort((a: PeriodEdge, b: PeriodEdge) => a.time - b.time)
    .forEach((edge) => {
      const wasActive = active;
      active += edge.change;
      if (wasActive === 0 && active > 0) {
        currStart = edge.time;
      } else if (wasActive > 0 && active === 0) {
        merged.push({ start: currStart, end: edge.time });
      }
    });

  const adjacentMerged: ClosedTimePeriod[] = [];
  let lastPeriod: ClosedTimePeriod | undefined = undefined;
  merged.forEach((period) => {
    if (!lastPeriod) {
      lastPeriod = period;
      return;
    }
    let newPeriod = period;
    if (lastPeriod.end === period.start) {
      newPeriod = { start: lastPeriod.start, end: period.end };
    } else {
      adjacentMerged.push(lastPeriod);
    }
    lastPeriod = newPeriod;
  });
  if (lastPeriod) {
    adjacentMerged.push(lastPeriod);
  }

  return adjacentMerged;
}

/**
 * Gets the logical union of several time periods, bounded by a fight's time period.
 * @return closed time periods representing the union of the given periods bounded by a fight's time period.
 */
export function unionOverFight(
  times: OpenTimePeriod[],
  fightInfo: Info,
): ClosedTimePeriod[] {
  return union(times, { start: fightInfo.fightStart, end: fightInfo.fightEnd });
}

