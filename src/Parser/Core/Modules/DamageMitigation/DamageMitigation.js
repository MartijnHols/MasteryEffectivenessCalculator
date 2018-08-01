import { formatPercentage, formatMilliseconds } from 'common/format';
import Analyzer from 'Parser/Core/Analyzer';
import StatTracker from 'Parser/Core/Modules/StatTracker';
import EnemyInstances from 'Parser/Core/Modules/EnemyInstances';

import Reduction from './Reduction';
import { BUFFS, DEBUFFS, PASSIVES, UNKNOWN } from './Constants';

const debug = true;

const BUFFER_PERCENT = 0.01;
const ADDITIVE = (accumulator, reduction) => accumulator + reduction.mitigation;
const MULTIPLICATIVE = (accumulator, reduction) => accumulator * (1 - reduction.mitigation);

class DamageMitigation extends Analyzer {
  static dependencies = {
    statTracker: StatTracker,
    enemies: EnemyInstances,
  };

  static REDUCTION_CLASS = Reduction;

  buffs = [];
  debuffs = [];
  passives = [];
  unknownReduction = null;
  totalMitigated = {};
  checkSum = 0;

  constructor(...args) {
    super(...args);
    this.addReductions();
  }

  on_finished() {
    if (!debug) {
      return;
    }
    console.log(this.totalMitigated);
    let sum = 0;
    Object.keys(this.totalMitigated).forEach(key => {
      sum += this.totalMitigated[key].amount;
    });
    console.log('Total: ' + sum + ', Checksum: ' + this.checkSum);
  }

  addReductions() {
    // Buffs
    this.buffs = BUFFS.map(options => new this.constructor.REDUCTION_CLASS(this, options))
    .filter(e => e.enabled);
    // Debuffs
    this.debuffs = DEBUFFS.map(options => new this.constructor.REDUCTION_CLASS(this, options))
    .filter(e => e.enabled);
    // Passives
    this.unknownReduction = new this.constructor.REDUCTION_CLASS(this, UNKNOWN);
    this.passives = PASSIVES.map(options => new this.constructor.REDUCTION_CLASS(this, options))
    .filter(e => e.enabled);
  }

  initReduction(reduction) {
    this.totalMitigated[reduction.id] = {
      name: reduction.name,
      amount: 0,
    };
  }

  on_toPlayer_damage(event) {
    if (event.hitType === 10) { // Hit was immuned.
      debug && console.log(formatMilliseconds(event.timestamp - this.owner.fight.start_time) + ' - Damage was immuned. Ability: ' + event.ability.name);
      return;
    }
    if (!event.mitigated ) { // No damage was mitigated. Usually direct HP removal, or parry/dodge.
      debug && console.log(formatMilliseconds(event.timestamp - this.owner.fight.start_time) + ' - No damage was mitigated. Ability: ' + event.ability.name);
      return;
    }
    debug && console.log(formatMilliseconds(event.timestamp - this.owner.fight.start_time) + ' - Ability: ' + event.ability.name + ', Amount: ' + event.amount + ', Raw: ' + event.unmitigatedAmount + ', Mitigated: ' + event.mitigated + ', ' + formatPercentage(event.mitigated/event.unmitigatedAmount) + '%');
    this.handleEvent(event);
  }

  handleEvent(event) {
    debug && (this.checkSum += event.mitigated);
    // Add passives.
    let mitigations = this.passives.slice();

    // Check for active buffs.
    this.buffs.forEach(buff => {
      if (this.selectedCombatant.hasBuff(buff.id)){
        mitigations.push(buff);
      }
    });

    // Check for active debuffs.
    const enemy = this.enemies.getEntity(event);
    if (enemy) {
      this.debuffs.forEach(debuff => {
        if (enemy.hasBuff(debuff.id)){
          mitigations.push(debuff);
        }
      });
    }

    // Filter by spell school.
    mitigations = mitigations.filter(e => {
      // If none is set it affects all schools.
      if (e.school === undefined || e.school === null) {
        return true;
      }
      // If it has 0 it includes all magical spell schools (everything except physical).
      if (e.school.includes(0) && event.ability.type !== 1) {
        return true;
      }
      return e.school.includes(event.ability.type);
    });

    if (debug) {
      let names = '';
      mitigations.forEach(e => {
        names += e.name + ', ';
      });
      console.log('Reductions: ' + names);
    }

    if (mitigations.length === 0) { // No active mitigations.
      if (!this.totalMitigated[this.unknownReduction.id]) {
        this.initReduction(this.unknownReduction);
      }
      this.totalMitigated[this.unknownReduction.id].amount += event.mitigated;
      return;
    }

    const percentMitigated = event.mitigated/event.unmitigatedAmount;
    const multiplicative = 1 - mitigations.reduce(MULTIPLICATIVE, 1);

    if (percentMitigated + BUFFER_PERCENT < multiplicative) {
      console.warn('The actual percent mitigated was lower than expected given the mitigations active at the time. Actual: ' + formatPercentage(percentMitigated) + '%, Expected: ' + formatPercentage(multiplicative) + '%');
    }
    if (percentMitigated - BUFFER_PERCENT > multiplicative) {
      console.warn('The actual percent mitigated was much higher than expected given the mitigations active at the time. Actual: ' + formatPercentage(percentMitigated) + '%, Expected: ' + formatPercentage(multiplicative) + '%');
    }

    const unknown = 1 - (1 - percentMitigated) / (1 - multiplicative);
    if (!this.totalMitigated[this.unknownReduction.id]) {
      this.initReduction(this.unknownReduction);
    }
    const additive = mitigations.reduce(ADDITIVE, unknown);
    this.totalMitigated[this.unknownReduction.id].amount += unknown / additive * event.mitigated;
    
    mitigations.forEach(reduction => {
      if (!this.totalMitigated[reduction.id]) {
        this.initReduction(reduction);
      }
      this.totalMitigated[reduction.id].amount += (reduction.mitigation / additive * event.mitigated);
    });
  }
}

export default DamageMitigation;
