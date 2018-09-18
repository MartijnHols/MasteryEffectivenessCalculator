import React from 'react';
import SPELLS from 'common/SPELLS';
import Analyzer from 'Parser/Core/Analyzer';

class HolyWordSanctify extends Analyzer {
  healing = 0;
  overhealing = 0;
  totalCasts = 0;
  totalHits = 0;

  reductionBySpell = {};
  apotheosisReductionBySpell = {};
  wastedCooldown = 0;

  get hitsPerCast() {
    return this.totalHits / this.totalCasts;
  }

  get totalCooldownReduction() {

  }

  get apotheosisCooldownReduction() {

  }
}

export default HolyWordSanctify;
