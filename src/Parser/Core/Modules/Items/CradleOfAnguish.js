import React from 'react';

import SPELLS from 'common/SPELLS';
import ITEMS from 'common/ITEMS';
import { formatPercentage } from 'common/format';

import Analyzer from 'Parser/Core/Analyzer';
import Combatants from 'Parser/Core/Modules/Combatants';

class CradeOfAnguish extends Analyzer{
  static dependencies = {
    combatants: Combatants,
  }

  on_initialized() {
    this.active = this.combatants.selected.hasTrinket(ITEMS.CRADLE_OF_ANGUISH.id);
  }

  item() {
    // If the buff never fell off then getBuffUptime will report 0 due to WCL not tracking precombat buffs that don't drop/reapply
    // setting uptimePercent to 1 gets around this
    const uptimePercent = (this.combatants.selected.getBuffUptime(SPELLS.STRENGTH_OF_WILL.id) / this.owner.fightDuration) || 1;
    return {
      item: ITEMS.CRADLE_OF_ANGUISH,
      result: (
        <span>
          <dfn
            data-tip={`Buff was active for ${formatPercentage(uptimePercent)}% of the fight.`}
          >
            {formatPercentage(uptimePercent)} % uptime
          </dfn>
        </span>
      ),
    };
  }
}

export default CradeOfAnguish;