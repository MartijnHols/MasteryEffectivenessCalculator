import SPELLS from 'common/SPELLS';
import Spell from 'common/SPELLS/Spell';
import RACES from 'game/RACES';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Combatant from 'parser/core/Combatant';
import Events, {
  ApplyDebuffEvent,
  RefreshDebuffEvent,
  RemoveDebuffEvent,
  TargettedEvent,
} from 'parser/core/Events';
import { ClosedTimePeriod, union } from 'parser/core/timePeriods';
import { encodeTargetString } from 'parser/shared/modules/EnemyInstances';
import { UptimeBarSpec } from 'parser/ui/UptimeBarSubStatistic';

import {
  BLOODTALONS_DAMAGE_BONUS,
  cdSpell,
  PANDEMIC_FRACTION,
  PROWL_RAKE_DAMAGE_BONUS,
  TIGERS_FURY_DAMAGE_BONUS,
} from '../../constants';

/** Buffer in ms to use when determining if a buff was present when a DoT was applied */
const BUFF_DROP_BUFFER = 60;

export const TIGERS_FURY_SPEC: StaticSnapshotSpec = {
  name: "Tiger's Fury",
  spellFunc: (_) => [SPELLS.TIGERS_FURY],
  isActive: (_) => true,
  isPresent: (c, timestamp) => c.hasBuff(SPELLS.TIGERS_FURY.id, timestamp, BUFF_DROP_BUFFER),
  displayColor: '#ff9955',
  boostStrength: TIGERS_FURY_DAMAGE_BONUS,
};

export const PROWL_SPEC: StaticSnapshotSpec = {
  name: 'Prowl',
  spellFunc: (c) => {
    const res = [];
    res.push(SPELLS.PROWL);
    res.push(cdSpell(c));
    if (c.race === RACES.NightElf) {
      res.push(SPELLS.SHADOWMELD);
    }
    if (c.hasConduitBySpellID(SPELLS.SUDDEN_AMBUSH.id)) {
      res.push(SPELLS.SUDDEN_AMBUSH);
    }
    return res;
  },
  isActive: (_) => true,
  isPresent: (c, timestamp) =>
    c.hasBuff(SPELLS.INCARNATION_KING_OF_THE_JUNGLE_TALENT.id, timestamp, BUFF_DROP_BUFFER) ||
    c.hasBuff(SPELLS.BERSERK.id, timestamp, BUFF_DROP_BUFFER) ||
    c.hasBuff(SPELLS.PROWL.id, timestamp, BUFF_DROP_BUFFER) ||
    c.hasBuff(SPELLS.PROWL_INCARNATION.id, timestamp, BUFF_DROP_BUFFER) ||
    c.hasBuff(SPELLS.SHADOWMELD.id, timestamp, BUFF_DROP_BUFFER) ||
    c.hasBuff(SPELLS.SUDDEN_AMBUSH_BUFF.id, timestamp, BUFF_DROP_BUFFER),
  displayColor: '#5555ff',
  boostStrength: PROWL_RAKE_DAMAGE_BONUS,
};

export const BLOODTALONS_SPEC: StaticSnapshotSpec = {
  name: 'Bloodtalons',
  spellFunc: (_) => [SPELLS.BLOODTALONS_TALENT],
  isActive: (c) => c.hasTalent(SPELLS.BLOODTALONS_TALENT),
  isPresent: (c, timestamp) => c.hasBuff(SPELLS.BLOODTALONS_BUFF.id, timestamp, BUFF_DROP_BUFFER),
  displayColor: '#dd0022',
  boostStrength: BLOODTALONS_DAMAGE_BONUS,
};

export function hasSpec(snapshots: SnapshotSpec[], sss: StaticSnapshotSpec) {
  return snapshots.find((ss) => ss.name === sss.name) !== undefined;
}

/**
 * Many Feral DoT spells 'snapshot' certain buffs on cast, benefitting from them over the DoT's
 * full duration. This abstract class can be extended to track the snapshots for a specific DoT.
 */
abstract class Snapshots extends Analyzer {
  /** The spell for the DoT cast */
  spell: Spell;
  /** The spell for the DoT debuff */
  debuff: Spell;
  /** The snapshots that could apply to this DoT */
  applicableSnapshots: SnapshotSpec[];
  /** Data on the current DoT / snapshot state per target */
  snapshotsByTarget: { [key: string]: DotUptime[] } = {};

  protected constructor(
    spell: Spell,
    debuff: Spell,
    applicableSnapshots: StaticSnapshotSpec[],
    options: Options,
  ) {
    super(options);
    this.spell = spell;
    this.debuff = debuff;
    this.applicableSnapshots = applicableSnapshots
      .filter((as) => as.isActive(this.selectedCombatant))
      .map((as) => ({
        name: as.name,
        spells: as.spellFunc(this.selectedCombatant),
        isPresent: as.isPresent,
        displayColor: as.displayColor,
        boostStrength: as.boostStrength,
      }));

    this.addEventListener(Events.applydebuff.by(SELECTED_PLAYER).spell(debuff), this.onApplyDot);
    this.addEventListener(
      Events.refreshdebuff.by(SELECTED_PLAYER).spell(debuff),
      this.onRefreshDot,
    );
    this.addEventListener(Events.removedebuff.by(SELECTED_PLAYER).spell(debuff), this.onRemoveDot);
  }

  /** DoT's expected duration, from its application */
  abstract getDotExpectedDuration(event: ApplyDebuffEvent | RefreshDebuffEvent): number;

  /** DoT's full duration */
  abstract getDotFullDuration(): number;

  /** DoT's total uptime (active on at least one target) */
  abstract getTotalDotUptime(): number;

  /**
   * Will be called when the DoT is applied or refreshed - allows for spell specific handling
   * @param application the DoT application event we're handling
   * @param snapshots the snapshots that apply to this application
   * @param prevSnapshots the snapshots that apply to the DoT we're overwriting,
   *     or null if this is a fresh application
   * @param power the power multiplier for this application, as determined by snapshots.
   *     The power of a no-snapshot application will be 1.
   * @param prevPower the power multiplier for the DoT we're overwriting,
   *     or 0 if this is a fresh application
   * @param remainingOnPrev the ms remaining on the DoT we're overwriting,
   *     or 0 if this is a fresh application
   * @param clipped the ms clipped from the DoT we're overwriting due to pandemic,
   *     or 0 if nothing is clipped or this is a fresh application
   */
  abstract handleApplication(
    application: ApplyDebuffEvent | RefreshDebuffEvent,
    snapshots: SnapshotSpec[],
    prevSnapshots: SnapshotSpec[] | null,
    power: number,
    prevPower: number,
    remainingOnPrev: number,
    clipped: number,
  ): void;

  onApplyDot(event: ApplyDebuffEvent | RefreshDebuffEvent) {
    this._startDot(event);
  }

  onRemoveDot(event: RemoveDebuffEvent | RefreshDebuffEvent) {
    this._finishDot(event);
  }

  onRefreshDot(event: RefreshDebuffEvent) {
    const prev = this._finishDot(event);
    this._startDot(event, prev);
  }

  getUptimesForTarget(event: TargettedEvent<any>): DotUptime[] {
    const targetString = encodeTargetString(event.targetID, event.targetInstance);
    if (!this.snapshotsByTarget[targetString]) {
      this.snapshotsByTarget[targetString] = [];
    }
    return this.snapshotsByTarget[targetString];
  }

  _startDot(event: ApplyDebuffEvent | RefreshDebuffEvent, previousUptime?: DotUptime) {
    const uptimes = this.getUptimesForTarget(event);

    const duration = this.getDotExpectedDuration(event);
    const remainingOnPrev =
      previousUptime && previousUptime.end !== undefined
        ? Math.max(previousUptime.expectedEnd - previousUptime.end, 0)
        : 0;

    // calculate durations
    const combinedDuration = duration + remainingOnPrev;
    const maxDuration = this.getDotFullDuration() * (1 + PANDEMIC_FRACTION);
    const clipped = Math.max(combinedDuration - maxDuration, 0);
    const newDuration = Math.min(combinedDuration, maxDuration);
    const expectedEnd = event.timestamp + newDuration;

    // call DoT specific handlers
    const snapshots = this._getActiveSnapshots(event.timestamp);
    const power = snapshots.reduce((acc, ss) => acc * (1 + ss.boostStrength), 1);
    const previousSnapshots = previousUptime ? previousUptime.snapshots : null;
    const prevPower =
      previousSnapshots === null
        ? 0
        : previousSnapshots.reduce((acc, ss) => acc * ss.boostStrength, 1);

    this.handleApplication(
      event,
      snapshots,
      previousSnapshots,
      power,
      prevPower,
      remainingOnPrev,
      clipped,
    );

    uptimes.push({
      start: event.timestamp,
      expectedEnd,
      snapshots,
      previousSnapshots,
    });
  }

  _finishDot(event: RemoveDebuffEvent | RefreshDebuffEvent): DotUptime | undefined {
    const uptimes = this.getUptimesForTarget(event);
    if (uptimes.length > 0) {
      const latestUptime = uptimes[uptimes.length - 1];
      latestUptime.end = event.timestamp;
      return latestUptime;
    } else {
      console.warn(event.type + ' on target when we have no record of an applydebuff', event);
      return undefined;
    }
  }

  _getActiveSnapshots(timestamp: number): SnapshotSpec[] {
    return this.applicableSnapshots.filter((as) => as.isPresent(this.selectedCombatant, timestamp));
  }

  get snapshotUptimes(): UptimeBarSpec[] {
    return this.applicableSnapshots.map((as) => this._getSnapshotUptimesForBuff(as));
  }

  /** Gets the specific uptime periods where at least one active DoT has the given snapshot */
  getSnapshotCombinedUptimes(snapshotName: string): ClosedTimePeriod[] {
    return union(
      Object.values(this.snapshotsByTarget)
        .flatMap((uptimes) => uptimes)
        .filter((uptime) => uptime.snapshots.find((ss) => ss.name === snapshotName) !== undefined),
      {start: this.owner.fight.start_time, end: this.owner.currentTimestamp}
    );
  }

  /** Gets the duration in ms where at least one active DoT has the given snapshot */
  getSnapshotCombinedUptimeDuration(snapshotName: string): number {
    return this.getSnapshotCombinedUptimes(snapshotName).reduce(
      (acc, up) => acc + up.end - up.start,
      0,
    );
  }

  /** Gets the percent of the DoT's total uptime that a snapshotted DoT was active on at least one target */
  getPercentUptimeWithSnapshot(snapshotName: string): number {
    const totalUptime = this.getTotalDotUptime();
    return totalUptime === 0
      ? 0
      : this.getSnapshotCombinedUptimeDuration(snapshotName) / totalUptime;
  }

  get percentWithBloodtalons() {
    return this.getPercentUptimeWithSnapshot(BLOODTALONS_SPEC.name);
  }

  get percentWithTigerFury() {
    return this.getPercentUptimeWithSnapshot(TIGERS_FURY_SPEC.name);
  }

  get percentWithProwl() {
    return this.getPercentUptimeWithSnapshot(PROWL_SPEC.name);
  }

  /** Builds an uptime bar for the given shapshot spec */
  _getSnapshotUptimesForBuff(spec: SnapshotSpec): UptimeBarSpec {
    return {
      uptimes: this.getSnapshotCombinedUptimes(spec.name),
      color: spec.displayColor,
      spells: spec.spells,
    };
  }
}

/** Static specification of a snapshotting buff */
type StaticSnapshotSpec = {
  /** The name of this snapshot */
  name: string;
  /** The spell or spells the combatant has that could cause this snapshot */
  spellFunc: (c: Combatant) => Spell[];
  /** True iff the combatant can gain this snapshot buff */
  isActive: (c: Combatant) => boolean;
  /** True iff the combatant has the snapshot buff at the given timestamp */
  isPresent: (c: Combatant, timestamp: number) => boolean;
  /** Color with which to display this snapshot on the chart */
  displayColor: string;
  /** The strength of this snapshot's boost */
  boostStrength: number;
};

/** Specification of a snapshotting buff specific to the combatant, generated from StaticSnapshotSpecs */
export type SnapshotSpec = {
  /** The name of this snapshot */
  name: string;
  /** The spell or spells that cause this snapshot */
  spells: Spell[]; // filled from StaticSnapshotSpec spellFunc
  /** True iff the combatant has the snapshot buff at the given timestamp */
  isPresent: (c: Combatant, timestamp: number) => boolean;
  /** Color with which to display this snapshot on the chart */
  displayColor: string;
  /** The strength of this snapshot's boost */
  boostStrength: number;
};

/** Data object recording a period of time that a DoT was active, and which snapshots it benfitted from */
export type DotUptime = {
  /** Timestamp when this debuff was applied or refreshed */
  start: number;
  /** Timestamp when we expect the debuff to expire */
  expectedEnd: number;
  /** Timestamp when this debuff was removed or refreshed, or undefined if it's still active */
  end?: number;
  /** Snapshots applicable to this DoT application */
  snapshots: SnapshotSpec[];
  /** Snapshots applicable to the previous DoT application, or null if this was a fresh application */
  previousSnapshots?: SnapshotSpec[] | null;
};

export default Snapshots;
