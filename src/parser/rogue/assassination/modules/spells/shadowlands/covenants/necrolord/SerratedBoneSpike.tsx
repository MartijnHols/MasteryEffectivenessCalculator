import React from 'react';
import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';
import Abilities from 'parser/core/modules/Abilities';
import SPELLS from 'common/SPELLS';
import Events, { DamageEvent, EnergizeEvent } from 'parser/core/Events';
import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import Statistic from 'interface/statistics/Statistic';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';
import STATISTIC_CATEGORY from 'interface/others/STATISTIC_CATEGORY';
import COVENANTS from 'game/shadowlands/COVENANTS';
import ItemDamageDone from 'interface/ItemDamageDone';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import ResourceIcon from 'common/ResourceIcon';

class SerratedBoneSpike extends Analyzer {
  static dependencies = {
    abilities: Abilities,
  };
  damage: number = 0;
  comboPointsGained: number = 0;
  comboPointsWasted: number = 0;
  protected abilities!: Abilities;

  constructor(options: any) {
    super(options);
    this.active = this.selectedCombatant.hasCovenant(COVENANTS.NECROLORD.id);
    this.addEventListener(
      Events.damage.by(SELECTED_PLAYER).spell(SPELLS.SERRATED_BONE_SPIKE),
      this.onDamage,
    );
    this.addEventListener(
      Events.energize.by(SELECTED_PLAYER).spell(SPELLS.SERRATED_BONE_SPIKE_ENERGIZE),
      this.onEnergize,
    );
  }

  onDamage(event: DamageEvent) {
    this.damage += event.amount + (event.absorbed | 0);
  }

  onEnergize(event: EnergizeEvent) {
    if (event.resourceChangeType === RESOURCE_TYPES.COMBO_POINTS.id) {
      this.comboPointsGained += event.resourceChange;
      this.comboPointsWasted += event.waste;
    }
  }

  statistic() {
    return (
      <>
        <Statistic
          position={STATISTIC_ORDER.CORE()}
          size="flexible"
          category={STATISTIC_CATEGORY.COVENANTS}
        >
          <BoringSpellValueText spell={SPELLS.SERRATED_BONE_SPIKE}>
            <>
              <ItemDamageDone amount={this.damage} />
              <br />
              <ResourceIcon id={RESOURCE_TYPES.COMBO_POINTS.id} noLink />
              {this.comboPointsGained}/{this.comboPointsWasted + this.comboPointsGained}
              <small> gained Combo Points</small>
            </>
          </BoringSpellValueText>
        </Statistic>
      </>
    );
  }
}

export default SerratedBoneSpike;