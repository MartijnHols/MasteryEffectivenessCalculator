import SPELLS from 'common/SPELLS/index';
import { formatMilliseconds } from 'common/format';
import SPECS from 'game/SPECS';
import RACES from 'game/RACES';
import Analyzer from 'parser/core/Analyzer';
import EventEmitter from 'parser/core/modules/EventEmitter';
import { EventType } from 'parser/core/Events';

import { DEFAULT_BUFFS, STAT_MULTIPLIER, STAT_MULTIPLIER_BUFFS } from './StatTrackerBuffs';

const ARMOR_INT_BONUS = .05;

const debug = false;

// TODO: stat constants somewhere else? they're largely copied from combatant
class StatTracker extends Analyzer {
  static dependencies = {
    eventEmitter: EventEmitter,
  };

  // These are multipliers to the stats applied *on pull* that are not
  // included in the stats reported by WCL. These are *baked in* and do
  // not multiply temporary buffs.
  //
  // In general, it looks like armor is the only one that isn't applied
  // by WCL.
  static SPEC_MULTIPLIERS = {
    [SPECS.BREWMASTER_MONK.id]: { armor: 1.25 },
  };

  statBuffs = {};

  _pullStats = {};
  _currentStats = {};

  statMultiplier = { ...STAT_MULTIPLIER };

  statMultiplierBuffs = { ...STAT_MULTIPLIER_BUFFS };

  constructor(...args) {
    super(...args);
    // TODO: Use combatantinfo event directly
    this._pullStats = {
      strength: this.selectedCombatant._combatantInfo.strength,
      agility: this.selectedCombatant._combatantInfo.agility,
      intellect: this.selectedCombatant._combatantInfo.intellect,
      stamina: this.selectedCombatant._combatantInfo.stamina,
      crit: this.selectedCombatant._combatantInfo.critSpell,
      haste: this.selectedCombatant._combatantInfo.hasteSpell,
      mastery: this.selectedCombatant._combatantInfo.mastery,
      versatility: this.selectedCombatant._combatantInfo.versatilityHealingDone,
      avoidance: this.selectedCombatant._combatantInfo.avoidance,
      leech: this.selectedCombatant._combatantInfo.leech,
      speed: this.selectedCombatant._combatantInfo.speed,
      armor: this.selectedCombatant._combatantInfo.armor,
    };

    this.applySpecModifiers();

    this.statBuffs = {
      ...DEFAULT_BUFFS,
    };

    this._currentStats = {
      ...this._pullStats,
    };

    // Really hoping people don't run around with wrong armor types
    this.addStatMultiplier({
      intellect: 1 + ARMOR_INT_BONUS,
      strength: 1 + ARMOR_INT_BONUS,
      agility: 1 + ARMOR_INT_BONUS,
    });

    debug && this._debugPrintStats(this._currentStats);
  }

  /**
   * Adds a stat buff to StatTracker.
   * @param buffId ID of the stat buff
   * @param stats Object with stats (intellect, mastery, haste, crit etc.) and their respective bonus (either fixed value or a function (combatant, item) => value). If it's from item, provide also an itemId (item in the stat callback is taken from this itemId).
   */
  add(buffId, stats) {
    if (!buffId || !stats) {
      throw new Error(`StatTracker.add() called with invalid buffId ${buffId} or stats`);
    }
    if (typeof buffId === 'object') {
      buffId = buffId.id;
    }
    if (this.statBuffs[buffId]) {
      throw new Error(`Stat buff with ID ${buffId} already exists`);
    }
    // if any stat's function uses the item argument, validate that itemId property exists
    debug && this.log(`StatTracker.add(), buffId: ${buffId}, stats:`, stats);
    const usesItemArgument = Object.values(stats).some(value => typeof value === 'function' && value.length === 2);
    if (usesItemArgument && !stats.itemId) {
      throw new Error(`Stat buff ${buffId} uses item argument, but does not provide item ID`);
    }
    this.statBuffs[buffId] = stats;
  }

  addStatMultiplier(stats, changeCurrentStats = false) {
    const delta = {};
    for (const stat in stats) {
      const before = this.statMultiplier[stat];
      this.statMultiplier[stat] *= stats[stat];

      debug && console.log(`StatTracker: ${stat} multiplier change (${before.toFixed(2)} -> ${this.statMultiplier[stat].toFixed(2)}) @ ${formatMilliseconds(this.owner.fightDuration)}`);

      if (changeCurrentStats) {
        delta[stat] = Math.round(this._currentStats[stat] * stats[stat] - this._currentStats[stat]);
      }
    }

    changeCurrentStats && this.forceChangeStats(delta, null, true);
  }

  removeStatMultiplier(stats, changeCurrentStats = false) {
    const delta = {};
    for (const stat in stats) {
      const before = this.statMultiplier[stat];
      this.statMultiplier[stat] /= stats[stat];

      debug && console.log(`StatTracker: ${stat} multiplier change (${before.toFixed(2)} -> ${this.statMultiplier[stat].toFixed(2)}) @ ${formatMilliseconds(this.owner.fightDuration)}`);

      if (changeCurrentStats) {
        delta[stat] = Math.round(this._currentStats[stat] / stats[stat] - this._currentStats[stat]);
      }
    }

    changeCurrentStats && this.forceChangeStats(delta, null, true);
  }

  applySpecModifiers() {
    const modifiers = this.constructor.SPEC_MULTIPLIERS[this.selectedCombatant.spec.id] || {};
    Object.entries(modifiers).forEach(([stat, multiplier]) => {
      this._pullStats[stat] *= multiplier;
    });
  }

  /*
   * Stat rating at pull.
   * Should be identical to what you get from Combatant.
   */
  get startingStrengthRating() {
    return this._pullStats.strength;
  }
  get startingAgilityRating() {
    return this._pullStats.agility;
  }
  get startingIntellectRating() {
    return this._pullStats.intellect;
  }
  get startingStaminaRating() {
    return this._pullStats.stamina;
  }
  get startingCritRating() {
    return this._pullStats.crit;
  }
  get startingHasteRating() {
    return this._pullStats.haste;
  }
  get startingMasteryRating() {
    return this._pullStats.mastery;
  }
  get startingVersatilityRating() {
    return this._pullStats.versatility;
  }
  get startingAvoidanceRating() {
    return this._pullStats.avoidance;
  }
  get startingLeechRating() {
    return this._pullStats.leech;
  }
  get startingSpeedRating() {
    return this._pullStats.speed;
  }
  get startingArmorRating() {
    return this._pullStats.armor;
  }

  /*
   * Current stat rating, as tracked by this module.
   */
  get currentStrengthRating() {
    return this._currentStats.strength;
  }
  get currentAgilityRating() {
    return this._currentStats.agility;
  }
  get currentIntellectRating() {
    return this._currentStats.intellect;
  }
  get currentStaminaRating() {
    return this._currentStats.stamina;
  }
  get currentCritRating() {
    return this._currentStats.crit;
  }
  get currentHasteRating() {
    return this._currentStats.haste;
  }
  get currentMasteryRating() {
    return this._currentStats.mastery;
  }
  get currentVersatilityRating() {
    return this._currentStats.versatility;
  }
  get currentAvoidanceRating() {
    return this._currentStats.avoidance;
  }
  get currentLeechRating() {
    return this._currentStats.leech;
  }
  get currentSpeedRating() {
    return this._currentStats.speed;
  }
  get currentArmorRating() {
    return this._currentStats.armor;
  }

  // TODO: I think these should be ratings. They behave like ratings and I think the only reason they're percentages here is because that's how they're **displayed** in-game, but not because it's more correct.
  /*
   * For percentage stats, the percentage you'd have with zero rating.
   * These values don't change.
   */
  get baseCritPercentage() {
    let critChance = 0.05;
    if (this.selectedCombatant.race === RACES.BloodElf) {
      critChance += 0.01;
    } else if (this.selectedCombatant.hasBuff(SPELLS.OPULENCE_BRILLAINT_AURA.id)) {
      critChance += 1.0;
    }
    switch (this.selectedCombatant.spec) {
      case SPECS.FIRE_MAGE:
        return critChance + 0.15; // an additional 15% is gained from the passive Critical Mass
      case SPECS.BEAST_MASTERY_HUNTER:
        return critChance + 0.05; //baseline +5%
      case SPECS.MARKSMANSHIP_HUNTER:
        return critChance + 0.05; //baseline +5%
      case SPECS.SURVIVAL_HUNTER:
        return critChance + 0.06; //baseline +6%
      case SPECS.BREWMASTER_MONK:
        return critChance + 0.05; //baseline +5%
      case SPECS.WINDWALKER_MONK:
        return critChance + 0.05; //baseline +5%
      case SPECS.HAVOC_DEMON_HUNTER:
        return critChance + 0.06; //baseline +6%
      case SPECS.SUBTLETY_ROGUE:
        return critChance + 0.05; //baseline +5%
      case SPECS.ASSASSINATION_ROGUE:
        return critChance + 0.05; //baseline +5%
      case SPECS.OUTLAW_ROGUE:
        return critChance + 0.05; //baseline +5%
      default:
        return critChance;
    }
  }
  get baseHastePercentage() {
    return 0;
  }
  get baseMasteryPercentage() {
    const spellPoints = 8; // Spellpoint is a unit of mastery, each class has 8 base Spellpoints
    return spellPoints * this.selectedCombatant.spec.masteryCoefficient / 100;
  }
  get baseVersatilityPercentage() {
    return 0;
  }
  get baseAvoidancePercentage() {
    return 0;
  }
  get baseLeechPercentage() {
    return 0;
  }
  get baseSpeedPercentage() {
    return 0;
  }

  /*
   * For percentage stats, this is the divider to go from rating to percent (expressed from 0 to 1)
   * These values don't change.
   * TODO: Verify these values at Shadowlands launch (33 haste, 35 crit, 35 mastery, 40 versatility)
   * TODO: Account for DR in the rating to percent functions
   */
  get critRatingPerPercent() {
    return 72 * 100;
  }
  critPercentage(rating, withBase = false) {
    return (withBase ? this.baseCritPercentage : 0) + rating / this.critRatingPerPercent;
  }
  get hasteRatingPerPercent() {
    return 68 * 100;
  }
  hastePercentage(rating, withBase = false) {
    return (withBase ? this.baseHastePercentage : 0) + rating / this.hasteRatingPerPercent;
  }
  get masteryRatingPerPercent() {
    return 72 * 100 / this.selectedCombatant.spec.masteryCoefficient;
  }
  masteryPercentage(rating, withBase = false) {
    return (withBase ? this.baseMasteryPercentage : 0) + rating / this.masteryRatingPerPercent;
  }
  get versatilityRatingPerPercent() {
    return 85 * 100;
  }
  versatilityPercentage(rating, withBase = false) {
    return (withBase ? this.baseVersatilityPercentage : 0) + rating / this.versatilityRatingPerPercent;
  }
  get avoidanceRatingPerPercent() {
    return 28 * 100;
  }
  avoidancePercentage(rating, withBase = false) {
    return (withBase ? this.baseAvoidancePercentage : 0) + rating / this.avoidanceRatingPerPercent;
  }
  get leechRatingPerPercent() {
    return 40 * 100;
  }
  leechPercentage(rating, withBase = false) {
    return (withBase ? this.baseLeechPercentage : 0) + rating / this.leechRatingPerPercent;
  }
  get speedRatingPerPercent() {
    return 20 * 100;
  }
  speedPercentage(rating, withBase = false) {
    return (withBase ? this.baseSpeedPercentage : 0) + rating / this.speedRatingPerPercent;
  }

  /*
   * For percentage stats, the current stat percentage as tracked by this module.
   */
  get currentCritPercentage() {
    return this.critPercentage(this.currentCritRating, true);
  }
  // This is only the percentage from BASE + RATING.
  // If you're looking for current haste percentage including buffs like Bloodlust, check the Haste module.
  get currentHastePercentage() {
    return this.hastePercentage(this.currentHasteRating, true);
  }
  get currentMasteryPercentage() {
    return this.masteryPercentage(this.currentMasteryRating, true);
  }
  get currentVersatilityPercentage() {
    return this.versatilityPercentage(this.currentVersatilityRating, true);
  }
  get currentAvoidancePercentage() {
    return this.avoidancePercentage(this.currentAvoidanceRating, true);
  }
  get currentLeechPercentage() {
    return this.leechPercentage(this.currentLeechRating, true);
  }
  get currentSpeedPercentage() {
    return this.speedPercentage(this.currentSpeedRating, true);
  }

  on_toPlayer_changebuffstack(event) {
    this._changeBuffStack(event);
  }

  on_toPlayer_changedebuffstack(event) {
    this._changeBuffStack(event);
  }

  on_byPlayer_cast(event) {
    this._updateIntellect(event);
  }

  on_toPlayer_heal(event) {
    this._updateIntellect(event);
  }

  _updateIntellect(event) {
    // updates intellect values directly from game events
    if (!event.spellPower) {
      return;
    }
    const currentIntellect = this.currentIntellectRating;
    const actualIntellect = event.spellPower;
    if (currentIntellect !== actualIntellect) {
      debug && this.error(`Intellect rating calculated with StatTracker is different from actual Intellect from events! StatTracker: ${currentIntellect}, actual: ${actualIntellect}`);
      const delta = actualIntellect - currentIntellect;
      this.forceChangeStats({ intellect: delta }, null, true);
    }
  }

  /**
   * This interface allows an external analyzer to force a stat change.
   * It should ONLY be used if a stat buff is so non-standard that it can't be handled by the buff format in this module.
   * change is a stat buff object just like those in the DEFAULT_BUFFS structure above, it is required.
   * eventReason is the WCL event object that caused this change, it is not required.
   */
  // For an example of how / why this function would be used, see the CharmOfTheRisingTide module.
  forceChangeStats(change, eventReason, withoutMultipliers = false) {
    const before = Object.assign({}, this._currentStats);
    const delta = this._changeStats(change, 1, withoutMultipliers);
    const after = Object.assign({}, this._currentStats);
    if (debug) {
      const spellName = eventReason && eventReason.ability ? eventReason.ability.name : 'unspecified';
      console.log(`StatTracker: FORCED CHANGE from ${spellName} - Change: ${this._statPrint(delta)}`);
      debug && this._debugPrintStats(this._currentStats);
    }
    this._triggerChangeStats(eventReason, before, delta, after);
  }

  _changeBuffStack(event) {
    const spellId = event.ability.guid;
    const statBuff = this.statBuffs[spellId];
    const statMult = this.statMultiplierBuffs[spellId];
    if (statBuff) {
      // ignore prepull buff application, as they're already accounted for in combatantinfo
      // we have to check the stacks count because Entities incorrectly copies the prepull property onto changes and removal following the application
      if (event.prepull && event.oldStacks === 0) {
        debug && console.log(`StatTracker prepull application IGNORED for ${SPELLS[spellId] ? SPELLS[spellId].name : spellId}`);
        return;
      }

      const before = Object.assign({}, this._currentStats);
      const delta = this._changeStats(statBuff, event.newStacks - event.oldStacks);
      const after = Object.assign({}, this._currentStats);
      debug && console.log(`StatTracker: (${event.oldStacks} -> ${event.newStacks}) ${SPELLS[spellId] ? SPELLS[spellId].name : spellId} @ ${formatMilliseconds(this.owner.fightDuration)} - Change: ${this._statPrint(delta)}`);
      debug && this._debugPrintStats(this._currentStats);
      this._triggerChangeStats(event, before, delta, after);
    }
    if (statMult) {
      // ignore prepull buff application, as they're already accounted for in combatantinfo
      // we have to check the stacks count because Entities incorrectly copies the prepull property onto changes and removal following the application
      if (event.prepull && event.oldStacks === 0) {
        debug && console.log(`StatTracker prepull application IGNORED for ${SPELLS[spellId] ? SPELLS[spellId].name : spellId}`);
        this.addStatMultiplier(statMult);
        return;
      }
      if (event.newStacks > event.oldStacks) {
        this.addStatMultiplier(statMult, true);
      } else if (event.newStacks < event.oldStacks) {
        this.removeStatMultiplier(statMult, true);
      }
    }
  }

  // withoutMultipliers should be a rare exception where you have already buffed values
  _changeStats(change, factor, withoutMultipliers = false) {
    const delta = {
      strength: this._getBuffValue(change, change.strength) * factor,
      agility: this._getBuffValue(change, change.agility) * factor,
      intellect: this._getBuffValue(change, change.intellect) * factor,
      stamina: this._getBuffValue(change, change.stamina) * factor,
      crit: this._getBuffValue(change, change.crit) * factor,
      haste: this._getBuffValue(change, change.haste) * factor,
      mastery: this._getBuffValue(change, change.mastery) * factor,
      versatility: this._getBuffValue(change, change.versatility) * factor,
      avoidance: this._getBuffValue(change, change.avoidance) * factor,
      leech: this._getBuffValue(change, change.leech) * factor,
      speed: this._getBuffValue(change, change.speed) * factor,
      armor: this._getBuffValue(change, change.armor) * factor,
    };

    Object.keys(this._currentStats).forEach(key => {
      this._currentStats[key] += withoutMultipliers ? delta[key] : Math.round(delta[key] * this.statMultiplier[key]);
    });

    return delta;
  }

  /**
   * Fabricates an event indicating when stats change
   */
  _triggerChangeStats(event, before, delta, after) {
    this.eventEmitter.fabricateEvent({
      type: EventType.ChangeStats,
      sourceID: event ? event.sourceID : this.owner.playerId,
      targetID: this.owner.playerId,
      before,
      delta,
      after,
    }, event);
  }

  /**
   * Gets the actual stat value in whatever format it is.
   * a number value will be returned as is
   * a function value will be called with (selectedCombatant, itemDetails) and the result returned
   * an undefined stat will default to 0.
   */
  _getBuffValue(buffObj, statVal) {
    if (statVal === undefined) {
      return 0;
    } else if (typeof statVal === 'function') {
      const selectedCombatant = this.selectedCombatant;
      let itemDetails;
      if (buffObj.itemId) {
        itemDetails = this.selectedCombatant.getItem(buffObj.itemId);
        if (!itemDetails) {
          console.warn('Failed to retrieve item information for item with ID:', buffObj.itemId,
            ' ...unable to handle stats buff, making no stat change.');
          return 0;
        }
      }
      return statVal(selectedCombatant, itemDetails);
    } else {
      return statVal;
    }
  }

  _debugPrintStats(stats) {
    console.log(`StatTracker: ${formatMilliseconds(this.owner.fightDuration)} - ${this._statPrint(stats)}`);
  }

  _statPrint(stats) {
    return `STR=${stats.strength} AGI=${stats.agility} INT=${stats.intellect} STM=${stats.stamina} CRT=${stats.crit} HST=${stats.haste} MST=${stats.mastery} VRS=${stats.versatility} AVD=${this._currentStats.avoidance} LCH=${stats.leech} SPD=${stats.speed} ARMOR=${this._currentStats.armor}`;
  }
}

export default StatTracker;

