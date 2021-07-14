import { t } from '@lingui/macro';
import { formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import Spell from 'common/SPELLS/Spell';
import { SpellLink } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, { ApplyBuffEvent, RemoveBuffEvent } from 'parser/core/Events';
import { union, OpenTimePeriod } from 'parser/core/timePeriods';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import Combatants from 'parser/shared/modules/Combatants';
import uptimeBarSubStatistic, { SubPercentageStyle } from 'parser/ui/UptimeBarSubStatistic';
import React from 'react';

const LIFEBLOOM_HOTS: Spell[] = [SPELLS.LIFEBLOOM_HOT_HEAL, SPELLS.LIFEBLOOM_DTL_HOT_HEAL];
const LB_COLOR = '#00bb44';
const DTL_COLOR = '#dd5500';

class Lifebloom extends Analyzer {
  static dependencies = {
    combatants: Combatants,
  };

  protected combatants!: Combatants;

  /** true iff player has Dark Titan's Lesson legendary equipped */
  hasDTL = false;
  /** the number of lifeblooms the player currently has active */
  activeLifeblooms: number = 0;
  /** list of time periods when at least one lifebloom was active */
  lifebloomUptimes: OpenTimePeriod[] = [];
  /** list of time periods when at least two lifeblooms were active */
  dtlUptimes: OpenTimePeriod[] = [];

  constructor(options: Options) {
    super(options);
    this.hasDTL = this.selectedCombatant.hasLegendaryByBonusID(
      SPELLS.LIFEBLOOM_DTL_HOT_HEAL.bonusID,
    );

    this.addEventListener(
      Events.applybuff.by(SELECTED_PLAYER).spell(LIFEBLOOM_HOTS),
      this.onApplyLifebloom,
    );
    this.addEventListener(
      Events.removebuff.by(SELECTED_PLAYER).spell(LIFEBLOOM_HOTS),
      this.onRemoveLifebloom,
    );
  }

  onApplyLifebloom(event: ApplyBuffEvent) {
    if (this.activeLifeblooms === 0) {
      // LBS 0 -> 1
      this.lifebloomUptimes.push({ start: event.timestamp });
    } else if (this.activeLifeblooms === 1) {
      // LBS 1 -> 2
      this.dtlUptimes.push({ start: event.timestamp });
    }
    this.activeLifeblooms += 1;
  }

  onRemoveLifebloom(event: RemoveBuffEvent) {
    if (this.activeLifeblooms === 1) {
      // LBS 1 -> 0
      if (this.lifebloomUptimes.length > 0) {
        this.lifebloomUptimes[this.lifebloomUptimes.length - 1].end = event.timestamp;
      }
    } else if (this.activeLifeblooms === 2) {
      // LBS 2 -> 1
      if (this.dtlUptimes.length > 0) {
        this.dtlUptimes[this.dtlUptimes.length - 1].end = event.timestamp;
      }
    }
    this.activeLifeblooms -= 1;
  }

  get oneLifebloomUptime() {
    return this._getTotalUptime(this.lifebloomUptimes);
  }

  get oneLifebloomUptimePercent() {
    return this.oneLifebloomUptime / this.owner.fightDuration;
  }

  get twoLifebloomUptime() {
    return this._getTotalUptime(this.dtlUptimes);
  }

  _getTotalUptime(uptimes: OpenTimePeriod[]) {
    return uptimes.reduce(
      // we know ut.start will always be defined here, hence the cast
      (acc, ut) => acc + (ut.end === undefined ? this.owner.currentTimestamp : ut.end) - (ut.start as number),
      0,
    );
  }

  // TODO suggestion for two lifebloom uptime with DTL

  get suggestionThresholds() {
    return {
      actual: this.oneLifebloomUptimePercent,
      isLessThan: {
        minor: 0.8,
        average: 0.6,
        major: 0.4,
      },
      style: ThresholdStyle.PERCENTAGE,
    };
  }

  suggestions(when: When) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <>
          Your <SpellLink id={SPELLS.LIFEBLOOM_HOT_HEAL.id} /> uptime can be improved.{' '}
          {this.hasDTL ? (
            <>
              High uptime is particularly important for taking advantage of your equipped{' '}
              <SpellLink id={SPELLS.THE_DARK_TITANS_LESSON.id} />
            </>
          ) : (
            ''
          )}
        </>,
      )
        .icon(SPELLS.LIFEBLOOM_HOT_HEAL.icon)
        .actual(
          t({
            id: 'druid.restoration.suggestions.lifebloom.uptime',
            message: `${formatPercentage(this.oneLifebloomUptimePercent)}% uptime`,
          }),
        )
        .recommended(`>${formatPercentage(recommended)}% is recommended`),
    );
  }

  subStatistic() {
    const subBars = [];
    if (this.hasDTL) {
      subBars.push({
        spells: [SPELLS.THE_DARK_TITANS_LESSON],
        uptimes: union(this.dtlUptimes, {start: this.owner.fight.start_time, end: this.owner.currentTimestamp}),
        color: DTL_COLOR,
      });
    }

    return uptimeBarSubStatistic(
      this.owner.fight,
      {
        spells: [SPELLS.LIFEBLOOM_HOT_HEAL],
        uptimes: union(this.lifebloomUptimes, {start: this.owner.fight.start_time, end: this.owner.currentTimestamp}),
        color: LB_COLOR,
      },
      subBars,
      SubPercentageStyle.ABSOLUTE,
    );
  }
}

export default Lifebloom;
