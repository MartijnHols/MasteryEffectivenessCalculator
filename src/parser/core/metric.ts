import { AnyEvent } from './Events';
import Ability from './modules/Ability';

export interface Info {
  playerId: number;
  abilities: Ability[];
  fightStart: number;
  fightEnd: number;
  fightDuration: number;
  fightId: number;
  reportCode: string;
}
export interface FunctionalStatisticProps {
  events: AnyEvent[];
  info: Info;
}
export type Metric<Value = any> = (events: AnyEvent[], info: Info, ...args: any[]) => Value;

// Shallow compare all args including the events array
function isEqual(args: any[], lastArgs: any[]) {
  if (args.length !== lastArgs.length) {
    return false;
  }

  return args.every((arg, index) => arg === lastArgs[index]);
}

/**
 * Wrap this around any metrics doing work. This will memoize results so there's
 * no performance impact when the metric is used multiple times (and this may
 * do more in the future.)
 */
const metric = <T extends any[], U>(fn: (events: AnyEvent[], ...args: T) => U) => {
  // We store the last events in the CombatLogParser anyway, so leaving
  // instances in stats should not be significant.
  let lastArgs: any[] | undefined = undefined;
  let lastValue: any | undefined = undefined;
  // TODO: Memoize multiple

  return (events: AnyEvent[], ...args: T): U => {
    const allArgs = [events, ...args];
    if (!lastArgs || !isEqual(allArgs, lastArgs)) {
      lastValue = fn(events, ...args);
      lastArgs = allArgs;
    }

    return lastValue;
  };
};

export default metric;
