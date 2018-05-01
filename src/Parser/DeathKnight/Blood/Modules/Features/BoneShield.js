import React from 'react';
import Analyzer from 'Parser/Core/Analyzer';
import Combatants from 'Parser/Core/Modules/Combatants';
import SPELLS from 'common/SPELLS';
import SpellIcon from 'common/SpellIcon';
import { formatPercentage, formatDuration } from 'common/format';
import { STATISTIC_ORDER } from 'Main/StatisticBox';
import ExpandableStatisticBox from 'Main/ExpandableStatisticBox';
import BoneShieldStacksBySeconds from './BoneShieldStacksBySeconds';

const MAX_BONE_SHIELD_STACKS = 10;
const MAX_BONE_SHIELD_STACKS_OSSUARY = 15;
class BoneShield extends Analyzer {

  static dependencies = {
    combatants: Combatants,
    boneShieldStacksBySeconds: BoneShieldStacksBySeconds,
  };

  maxStacks = MAX_BONE_SHIELD_STACKS;

  on_initialized() {
    //just in case blizzard decides to move talents around or add a legendary-ring in BfA
    this.maxStacks = this.combatants.selected.hasTalent(SPELLS.OSSUARY_TALENT.id) ? MAX_BONE_SHIELD_STACKS_OSSUARY : MAX_BONE_SHIELD_STACKS;
  }

  get uptime() {
    return this.combatants.selected.getBuffUptime(SPELLS.BONE_SHIELD.id) / this.owner.fightDuration;
  }

  get boneShieldStacks() {
    return this.boneShieldStacksBySeconds.boneShieldStacksBySeconds;
  }

  get uptimeSuggestionThresholds() {
    return {
      actual: this.uptime,
      isLessThan: {
        minor: 0.95,
        average: 0.9,
        major: .8,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    when(this.uptimeSuggestionThresholds)
      .addSuggestion((suggest, actual, recommended) => {
        return suggest('Your Bone Shield uptime can be improved. Try to keep it up at all times.')
          .icon(SPELLS.BONE_SHIELD.icon)
          .actual(`${formatPercentage(actual)}% Bone Shield uptime`)
          .recommended(`>${formatPercentage(recommended)}% is recommended`);
      });
  }

  statistic() {
    return (
      <ExpandableStatisticBox
        icon={<SpellIcon id={SPELLS.BONE_SHIELD.id} />}
        value={`${formatPercentage(this.uptime)} %`}
        label="Bone Shield Uptime"
      >
        <table className="table table-condensed">
          <thead>
            <tr>
              <th>Stacks</th>
              <th>Time (s)</th>
              <th>Time (%)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length: this.maxStacks + 1}, (x, i) => i).map((e, i) =>
              <tr key={i}>
                <th>{i}</th>
                <td>{formatDuration(this.boneShieldStacks.filter(e => e === i).length)}</td>
                <td>{formatPercentage(this.boneShieldStacks.filter(e => e === i).length / Math.ceil(this.owner.fightDuration / 1000))}%</td>
              </tr>
            )}
          </tbody>
        </table>
      </ExpandableStatisticBox>
    );
  }
  statisticOrder = STATISTIC_ORDER.CORE(2);
}

export default BoneShield;
