import React from 'react';
import SPELLS from 'common/SPELLS/index';

import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';

import Statistic from 'interface/statistics/Statistic';
import Events, { DamageEvent } from 'parser/core/Events';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import BoringSpellValueText
  from 'interface/statistics/components/BoringSpellValueText';
import ItemDamageDone from 'interface/ItemDamageDone';

/**
 * Crash Lightning also electrifies the ground, leaving an electrical
 * field behind which damages enemies within it for
 * [7 * (2.688% of Attack power)] Nature damage over 6 sec.
 *
 * Example Log:
 *
 */

class CrashingStorm extends Analyzer {
  protected damage = 0;

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(
      SPELLS.CRASHING_STORM_TALENT.id,
    );
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER)
        .spell(SPELLS.CRASHING_STORM_TALENT),
      this.onDamage,
    );
  }

  onDamage(event: DamageEvent) {
    this.damage += event.amount + (event.absorbed || 0);
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL()}
        size="flexible"
        category={'TALENTS'}
      >
        <BoringSpellValueText spell={SPELLS.CRASHING_STORM_TALENT}>
          <>
            <ItemDamageDone amount={this.damage} />
          </>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default CrashingStorm;