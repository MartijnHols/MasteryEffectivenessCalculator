import Analyzer from 'parser/core/Analyzer';
import { AnyEvent, EventType } from 'parser/core/Events';

const BUFFER = 3000;

class FilteredActiveTime extends Analyzer {

  filterEvents(events: AnyEvent[], start: number, end: number) {
    let filteredEvents = [];
    filteredEvents = events.filter(
      (event) =>
        event.timestamp >= start &&
        event.timestamp <= end &&
        (event.type === EventType.GlobalCooldown || event.type === EventType.EndChannel),
    );
    return filteredEvents;
  }

  getActiveTime(start: number, end: number, events: AnyEvent[] = this.owner.eventHistory) {
    let activeTime = 0;
    let lastGCD: {
      duration: number;
      timestamp: number;
    } = { duration: 0, timestamp: 0 };
    const filteredEvents = this.filterEvents(events, start - BUFFER, end + BUFFER);

    filteredEvents.forEach((event) => {
      //Global Cooldown
      if (event.type === EventType.GlobalCooldown) {
        lastGCD = { duration: event.duration, timestamp: event.timestamp };

        //If the GCD was triggered by a BeginChannel event, was triggered after the start time, and the entire GCD does not extend beyond the end time, then this event will be handled by End Channel, so we should disregard it to avoid counting twice.
        if (
          event.trigger.type === EventType.BeginChannel &&
          event.timestamp > start &&
          event.timestamp + event.duration < end
        ) {
          return;
        }

        //If the GCD started and finished before the start time or didnt start until after the end time, disregard those as well.
        if (event.timestamp + event.duration < start || event.timestamp > end) {
          return;
        }

        //If a spell was on GCD at the start of the timeframe, then count the portion after the "start" time. Likewise if a GCD extended beyond the end of the timeframe, then count the portion before the "end" time.
        if (start - event.timestamp > 0) {
          activeTime += event.timestamp + event.duration - start;
        } else if (event.timestamp + event.duration >= end) {
          activeTime += end - event.timestamp;
        } else {
          activeTime += event.duration;
        }
      }

      //End Channel
      if (event.type === EventType.EndChannel) {
        //If the channel ended before the start time, the channel started after the end time, or the channel triggered a GCD that extended beyond the end time, then disregard it.
        if (
          event.timestamp < start ||
          (event.trigger && event.trigger.timestamp > end) ||
          event.timestamp + lastGCD.duration > end
        ) {
          return;
        }

        if (event.start < start) {
          activeTime += Math.max(event.timestamp - start, event.start + lastGCD.duration - start);
        } else if (event.timestamp > end) {
          activeTime += Math.max(end - event.start, end - lastGCD.timestamp);
        } else {
          activeTime += Math.max(event.duration, lastGCD.duration);
        }
      }
    });
    return activeTime;
  }

  getDowntime(start: number, end: number, events: AnyEvent[] = this.owner.eventHistory) {
    const activeTime = this.getActiveTime(start, end, events);
    const duration = end - start;
    return duration - activeTime;
  }
}

export default FilteredActiveTime;
