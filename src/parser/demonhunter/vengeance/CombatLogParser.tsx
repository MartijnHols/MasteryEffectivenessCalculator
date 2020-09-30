import React from 'react';

import Panel from 'interface/others/Panel';

import CoreCombatLogParser from 'parser/core/CombatLogParser';

import PainChart from './modules/painchart/Pain';
import PainTracker from './modules/pain/PainTracker';
import PainDetails from './modules/pain/PainDetails';

import AlwaysBeCasting from './modules/features/AlwaysBeCasting';
import Abilities from './modules/Abilities';
import CooldownThroughputTracker from './modules/features/CooldownThroughputTracker';
import MitigationCheck from './modules/features/MitigationCheck';

import Checklist from './modules/features/Checklist/Module';

import SoulFragmentsConsume from './modules/statistics/SoulFragmentsConsume';
import SoulFragmentsTracker from './modules/features/SoulFragmentsTracker';
import SoulsOvercap from './modules/statistics/SoulsOvercap';

import SpiritBombFrailtyDebuff from './modules/talents/SpiritBombFrailtyDebuff';
import SoulBarrier from './modules/talents/SoulBarrier';
import SpiritBombSoulsConsume from './modules/talents/SpiritBombSoulsConsume';
import VoidReaverDebuff from './modules/talents/VoidReaverDebuff';
import FeedTheDemon from './modules/talents/FeedTheDemon';
import BurningAlive from './modules/talents/BurningAlive';
import FeastOfSouls from './modules/talents/FeastOfSouls';
import AgonizingFlames from './modules/talents/AgonizingFlames';

import ImmolationAura from './modules/spells/ImmolationAura';
import DemonSpikes from './modules/spells/DemonSpikes';
import SigilOfFlame from './modules/spells/SigilOfFlame';
import SoulCleaveSoulsConsumed from './modules/spells/SoulCleaveSoulsConsumed';

class CombatLogParser extends CoreCombatLogParser {
  static specModules = {
    // Core Statistics
    mitigationCheck: MitigationCheck,

    // Features
    alwaysBeCasting: AlwaysBeCasting,
    abilities: Abilities,
    cooldownThroughputTracker: CooldownThroughputTracker,
    soulFragmentsTracker: SoulFragmentsTracker,
    checklist: Checklist,

    // Resource Tracker
    painTracker: PainTracker,
    painDetails: PainDetails,

    // region Talents
    // 15
    agonizingFlames: AgonizingFlames,

    // 25
    feastOfSouls: FeastOfSouls,
    burningAlive: BurningAlive,

    // 30
    SpiritBombFrailtyDebuff: SpiritBombFrailtyDebuff,
    spiritBombSoulsConsume: SpiritBombSoulsConsume,

    // 35
    feedTheDemon: FeedTheDemon,

    // 40
    // 45
    soulBarrier: SoulBarrier,

    // 50
    // endregion

    // Spell
    immolationAura: ImmolationAura,
    demonSpikes: DemonSpikes,
    sigilOfFlame: SigilOfFlame,
    soulCleaveSoulsConsumed: SoulCleaveSoulsConsumed,
    voidReaverDebuff: VoidReaverDebuff,

    // Stats
    soulsOvercap: SoulsOvercap,
    soulFragmentsConsume: SoulFragmentsConsume,

  };

  generateResults(adjustForDowntime: boolean) {
    const results = super.generateResults(adjustForDowntime);

    results.tabs = [
      ...results.tabs,
      { // TODO: Move this to an Analyzer module
        title: 'Pain Chart',
        url: 'pain',
        render: () => (
          <Panel style={{ padding: '15px 22px' }}>
            <PainChart
              reportCode={this.report.code}
              actorId={this.playerId}
              start={this.fight.start_time}
              end={this.fight.end_time}
            />
          </Panel>
        ),
      },
    ];

    return results;
  }
}

export default CombatLogParser;
