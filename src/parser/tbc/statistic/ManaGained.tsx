import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import { FunctionalStatisticProps } from 'parser/core/metric';
import resourceGained, {
  sumResourceGainedByPlayerPerSpell,
} from 'parser/shared/metrics/resourceGained';
import BoringSpellValueText from 'parser/ui/BoringSpellValueText';
import ItemManaGained from 'parser/ui/ItemManaGained';
import Statistic from 'parser/ui/Statistic';
import React from 'react';

const ManaGained = ({ events, info }: FunctionalStatisticProps) => {
  const manaGainedBySpell = sumResourceGainedByPlayerPerSpell(
    resourceGained(events),
    RESOURCE_TYPES.MANA.id,
    info.playerId,
  );

  if (!manaGainedBySpell) {
    return null;
  }

  return (
    <Statistic size="flexible">
      {Object.keys(manaGainedBySpell)
        .map(Number)
        .map((spellId) => (
          <BoringSpellValueText key={spellId} spellId={spellId}>
            <ItemManaGained amount={manaGainedBySpell[spellId]} />
          </BoringSpellValueText>
        ))}
    </Statistic>
  );
};

export default ManaGained;
