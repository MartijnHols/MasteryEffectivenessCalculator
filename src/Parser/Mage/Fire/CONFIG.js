import React from 'react';

import { Sharrq } from 'MAINTAINERS';
import SPECS from 'common/SPECS';
import SPEC_ANALYSIS_COMPLETENESS from 'common/SPEC_ANALYSIS_COMPLETENESS';

import CombatLogParser from './CombatLogParser';
import CHANGELOG from './CHANGELOG';

export default {
  spec: SPECS.FIRE_MAGE,
  maintainers: [Sharrq],
  completeness: SPEC_ANALYSIS_COMPLETENESS.NEEDS_MORE_WORK, // good = it matches most common manual reviews in class discords, great = it support all important class features
  changelog: CHANGELOG,
  compatibility: '7.3.5',
  description: (
    <div>
      Hello Everyone! We are always looking to improve the Fire Mage Analyzers and Modules; so if you find any issues or if there is something missing that you would like to see added, please open an Issue on GitHub or send a message to Sharrq on Discord (Sharrq#7530) <br /> <br />
	    Additionally, if you need further assistance in improving your gameplay as a Fire Mage, you can refer to the following resources:<br />
      <a href="https://discord.gg/0gLMHikX2aZ23VdA" target="_blank" rel="noopener noreferrer">Mage Class Discord</a> <br />
      <a href="https://www.altered-time.com/forum/" target="_blank" rel="noopener noreferrer">Altered Time (Mage Forums/Guides)</a> <br />
      <a href="https://www.icy-veins.com/wow/fire-mage-pve-dps-guide" target="_blank" rel="noopener noreferrer">Icy Veins (Fire Mage Guide)</a> <br/>
    </div>
  ),
  specDiscussionUrl: 'https://github.com/WoWAnalyzer/WoWAnalyzer/issues/519',
  parser: CombatLogParser,
  path: __dirname, // used for generating a GitHub link directly to your spec
};
