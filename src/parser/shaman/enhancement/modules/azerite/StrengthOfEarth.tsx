import React from 'react';
import SPELLS from 'common/SPELLS/index';

import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';

import Statistic from 'interface/statistics/Statistic';
import Events, { DamageEvent } from 'parser/core/Events';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import BoringSpellValueText
  from 'interface/statistics/components/BoringSpellValueText';
import ItemDamageDone from 'interface/ItemDamageDone';

class StrengthOfEarth extends Analyzer {
  /**
   *
   * Rockbiter causes your next melee ability, other than Rockbiter, to deal an
   * additional Nature damage.
   *
   * TODO: Check how often the buff runs out and make suggestion based on it.
   *
   * Example Log:
   * https://www.warcraftlogs.com/reports/dfwVtKmnC4RYXr6h#fight=5&type=summary&source=18&view=events
   *
   */

  protected damageGained = 0;

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasTrait(SPELLS.STRENGTH_OF_EARTH_TRAIT.id);

    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER)
        .spell(SPELLS.STRENGTH_OF_EARTH_DAMAGE),
      this.onStrengthOfEarthDamage,
    );
  }

  onStrengthOfEarthDamage(event: DamageEvent) {
    this.damageGained += event.amount;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL()}
        size="flexible"
        category={'ITEMS'}
      >
        <BoringSpellValueText spell={SPELLS.STRENGTH_OF_EARTH_TRAIT}>
          <ItemDamageDone amount={this.damageGained} />
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default StrengthOfEarth;