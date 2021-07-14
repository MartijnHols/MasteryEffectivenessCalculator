import { formatDuration, formatNumber, formatPercentage } from 'common/format';
import { Boss, findByBossId } from 'game/raids';
import CharacterProfile from 'parser/core/CharacterProfile';
import {
  AnyEvent,
  CombatantInfoEvent,
  Event,
  EventType,
  HasSource,
  HasTarget,
  MappedEvent,
} from 'parser/core/Events';
import ModuleError from 'parser/core/ModuleError';
import DeathRecapTracker from 'parser/shared/modules/DeathRecapTracker';
import Haste from 'parser/shared/modules/Haste';
import StatTracker from 'parser/shared/modules/StatTracker';
import React, { ComponentType } from 'react';

import Config from '../Config';
import SpellTimeWaitingOnGlobalCooldown from '../shared/enhancers/SpellTimeWaitingOnGlobalCooldown';
import AbilitiesMissing from '../shared/modules/AbilitiesMissing';
import AbilityTracker from '../shared/modules/AbilityTracker';
import AlwaysBeCasting from '../shared/modules/AlwaysBeCasting';
import CastEfficiency from '../shared/modules/CastEfficiency';
import Channeling from '../shared/modules/Channeling';
import Combatants from '../shared/modules/Combatants';
import DeathTracker from '../shared/modules/DeathTracker';
import DispelTracker from '../shared/modules/DispelTracker';
import DistanceMoved from '../shared/modules/DistanceMoved';
import DeathDowntime from '../shared/modules/downtime/DeathDowntime';
import TotalDowntime from '../shared/modules/downtime/TotalDowntime';
import Enemies from '../shared/modules/Enemies';
import EnemyInstances from '../shared/modules/EnemyInstances';
import EventHistory from '../shared/modules/EventHistory';
import PreparationRuleAnalyzer from '../shared/modules/features/Checklist/PreparationRuleAnalyzer';
import RaidHealthTab from '../shared/modules/features/RaidHealthTab';
import FilteredActiveTime from '../shared/modules/FilteredActiveTime';
import GlobalCooldown from '../shared/modules/GlobalCooldown';
import CritEffectBonus from '../shared/modules/helpers/CritEffectBonus';
import AugmentRuneChecker from '../shared/modules/items/AugmentRuneChecker';
import CombatPotion from '../shared/modules/items/CombatPotion';
import EnchantChecker from '../shared/modules/items/EnchantChecker';
import FlaskChecker from '../shared/modules/items/FlaskChecker';
import FoodChecker from '../shared/modules/items/FoodChecker';
import HealthPotion from '../shared/modules/items/HealthPotion';
import Healthstone from '../shared/modules/items/Healthstone';
import PotionChecker from '../shared/modules/items/PotionChecker';
import DarkmoonDeckVoracity from '../shared/modules/items/shadowlands/crafted/DarkmoonDeckVoracity';
import OverchargedAnimaBattery from '../shared/modules/items/shadowlands/dungeons/OverchargedAnimaBattery';
import WeaponEnhancementChecker from '../shared/modules/items/WeaponEnhancementChecker';
import ManaValues from '../shared/modules/ManaValues';
import Pets from '../shared/modules/Pets';
import ArcaneTorrent from '../shared/modules/racials/bloodelf/ArcaneTorrent';
import GiftOfTheNaaru from '../shared/modules/racials/draenei/GiftOfTheNaaru';
import MightOfTheMountain from '../shared/modules/racials/dwarf/MightOfTheMountain';
import Stoneform from '../shared/modules/racials/dwarf/Stoneform';
import BloodFury from '../shared/modules/racials/orc/BloodFury';
import Berserking from '../shared/modules/racials/troll/Berserking';
import SpellHistory from '../shared/modules/SpellHistory';
import SpellManaCost from '../shared/modules/SpellManaCost';
import SoulInfusion from '../shared/modules/spells/SoulInfusion';
import VantusRune from '../shared/modules/spells/VantusRune';
import SpellUsable from '../shared/modules/SpellUsable';
import DamageDone from '../shared/modules/throughput/DamageDone';
import DamageTaken from '../shared/modules/throughput/DamageTaken';
import HealingDone from '../shared/modules/throughput/HealingDone';
import ThroughputStatisticGroup from '../shared/modules/throughput/ThroughputStatisticGroup';
import ApplyBuffNormalizer from '../shared/normalizers/ApplyBuff';
import CancelledCastsNormalizer from '../shared/normalizers/CancelledCasts';
import FightEndNormalizer from '../shared/normalizers/FightEnd';
import MissingCastsNormalizer from '../shared/normalizers/MissingCasts';
import PhaseChangesNormalizer from '../shared/normalizers/PhaseChanges';
import PrePullCooldownsNormalizer from '../shared/normalizers/PrePullCooldowns';
import Analyzer from './Analyzer';
import Combatant from './Combatant';
import EventFilter from './EventFilter';
import EventsNormalizer from './EventsNormalizer';
import { EventListener } from './EventSubscriber';
import Fight from './Fight';
import { Info } from './metric';
import Module, { Options } from './Module';
import Abilities from './modules/Abilities';
import Buffs from './modules/Buffs';
import EventEmitter from './modules/EventEmitter';
import SpellInfo from './modules/SpellInfo';
import ParseResults from './ParseResults';
import { PetInfo } from './Pet';
import { PlayerInfo } from './Player';
import Report from './Report';

// This prints to console anything that the DI has to do
const debugDependencyInjection = false;
const MAX_DI_ITERATIONS = 100;
const isMinified = process.env.NODE_ENV === 'production';

type DependencyDefinition = typeof Module | readonly [typeof Module, { [option: string]: any }];
export type DependenciesDefinition = { [desiredName: string]: DependencyDefinition };

export enum SuggestionImportance {
  Major = 'major',
  Regular = 'regular',
  Minor = 'minor',
}
export interface Suggestion {
  text: React.ReactNode;
  importance: SuggestionImportance;
  icon?: string;
  actual?: React.ReactNode;
  recommended?: React.ReactNode;
}
// ALPHA - The parameters may still change
export type WIPSuggestionFactory = (events: AnyEvent[], info: Info) => Suggestion | Suggestion[];

interface Talent {
  id: number;
}
export interface Player {
  id: number;
  name: string;
  talents: Talent[];
  artifact: unknown;
  gear: unknown;
  auras: unknown;
}

class CombatLogParser {
  /** @deprecated Move this kind of info to the Abilities config */
  static abilitiesAffectedByHealingIncreases: number[] = [];
  /** @deprecated Move this kind of info to the Abilities config */
  static abilitiesAffectedByDamageIncreases: number[] = [];

  static internalModules: DependenciesDefinition = {
    fightEndNormalizer: FightEndNormalizer,
    eventEmitter: EventEmitter,
    combatants: Combatants,
    deathDowntime: DeathDowntime,
    totalDowntime: TotalDowntime,
    spellInfo: SpellInfo,
  };
  static defaultModules: DependenciesDefinition = {
    // Normalizers
    applyBuffNormalizer: ApplyBuffNormalizer,
    cancelledCastsNormalizer: CancelledCastsNormalizer,
    prepullNormalizer: PrePullCooldownsNormalizer,
    phaseChangesNormalizer: PhaseChangesNormalizer,
    missingCastsNormalize: MissingCastsNormalizer,

    // Enhancers
    spellTimeWaitingOnGlobalCooldown: SpellTimeWaitingOnGlobalCooldown,

    // Analyzers
    healingDone: HealingDone,
    damageDone: DamageDone,
    damageTaken: DamageTaken,
    throughputStatisticGroup: ThroughputStatisticGroup,
    deathTracker: DeathTracker,

    enemies: Enemies,
    enemyInstances: EnemyInstances,
    pets: Pets,
    spellManaCost: SpellManaCost,
    channeling: Channeling,
    eventHistory: EventHistory,
    abilityTracker: AbilityTracker,
    haste: Haste,
    statTracker: StatTracker,
    alwaysBeCasting: AlwaysBeCasting,
    filteredActiveTime: FilteredActiveTime,
    abilities: Abilities,
    buffs: Buffs,
    abilitiesMissing: AbilitiesMissing,
    CastEfficiency: CastEfficiency,
    spellUsable: SpellUsable,
    spellHistory: SpellHistory,
    globalCooldown: GlobalCooldown,
    manaValues: ManaValues,
    vantusRune: VantusRune,
    distanceMoved: DistanceMoved,
    deathRecapTracker: DeathRecapTracker,
    dispels: DispelTracker,

    critEffectBonus: CritEffectBonus,

    // Tabs
    raidHealthTab: RaidHealthTab,

    potionChecker: PotionChecker,
    enchantChecker: EnchantChecker,
    flaskChecker: FlaskChecker,
    foodChecker: FoodChecker,
    augmentRuneChecker: AugmentRuneChecker,
    healthstone: Healthstone,
    healthPotion: HealthPotion,
    combatPotion: CombatPotion,
    weaponEnhancementChecker: WeaponEnhancementChecker,
    preparationRuleAnalyzer: PreparationRuleAnalyzer,

    // Racials
    arcaneTorrent: ArcaneTorrent,
    giftOfTheNaaru: GiftOfTheNaaru,
    mightOfTheMountain: MightOfTheMountain,
    stoneform: Stoneform,
    berserking: Berserking,
    bloodFury: BloodFury,

    // Items:

    // Legendaries

    // Crafted
    darkmoonDeckVoracity: DarkmoonDeckVoracity,

    // Shadowlands

    // Castle Nathria
    soulInfusion: SoulInfusion,

    // Dungeons
    overchargedAnimaBattery: OverchargedAnimaBattery,
  };
  // Override this with spec specific modules when extending
  static specModules: DependenciesDefinition = {};

  static suggestions: WIPSuggestionFactory[] = [];
  static statistics: Array<ComponentType<{ events: AnyEvent[]; info: Info }>> = [];

  applyTimeFilter = (start: number, end: number) => null; //dummy function gets filled in by event parser
  applyPhaseFilter = (phase: string, instance: any) => null; //dummy function gets filled in by event parser

  config: Config;
  report: Report;
  characterProfile: CharacterProfile;

  // Player info from WCL - required
  player: PlayerInfo;
  playerPets: PetInfo[];
  fight: Fight;
  build?: string;
  boss: Boss | null;
  combatantInfoEvents: CombatantInfoEvent[];

  // Info object for Functional Analyzers - populated from above player / encounter info
  functionalInfo: Info;

  //Disabled Modules
  disabledModules!: { [state in ModuleError]: any[] };

  adjustForDowntime = false;
  get hasDowntime() {
    return this.getModule(TotalDowntime).totalBaseDowntime > 0;
  }

  _modules: { [name: string]: Module } = {};
  get activeModules() {
    return Object.values(this._modules).filter((module) => module.active);
  }

  get playerId() {
    return this.player.id;
  }
  get fightId() {
    return this.fight.id;
  }

  _timestamp: number;
  get currentTimestamp() {
    return this.finished ? this.fight.end_time : this._timestamp;
  }
  get fightDuration() {
    return (
      this.currentTimestamp -
      this.fight.start_time -
      (this.adjustForDowntime ? this.getModule(TotalDowntime).totalBaseDowntime : 0)
    );
  }
  finished = false;

  get players(): PlayerInfo[] {
    return this.report.friendlies;
  }
  get selectedCombatant(): Combatant {
    return this.getModule(Combatants).selected;
  }

  constructor(
    config: Config,
    report: Report,
    selectedPlayer: PlayerInfo,
    selectedFight: Fight,
    combatantInfoEvents: CombatantInfoEvent[],
    characterProfile: CharacterProfile,
    build?: string,
  ) {
    this.config = config;
    this.report = report;
    this.player = selectedPlayer;
    this.playerPets = report.friendlyPets.filter((pet) => pet.petOwner === selectedPlayer.id);
    this.fight = selectedFight;
    this.build = build;
    this.combatantInfoEvents = combatantInfoEvents;
    // combatantinfo events aren't included in the regular events, but they're still used to analysis. We should have them show in the history to make it complete.
    combatantInfoEvents.forEach((event) => this.eventHistory.push(event));
    this.characterProfile = characterProfile;
    this._timestamp = selectedFight.start_time;
    this.boss = findByBossId(selectedFight.boss);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore populated dynamically but object keys still strongly typed
    this.disabledModules = {};
    //initialize disabled modules for each state
    Object.values(ModuleError).forEach((key) => {
      this.disabledModules[key] = [];
    });
    const ctor = this.constructor as typeof CombatLogParser;
    this.initializeModules({
      ...ctor.internalModules,
      ...ctor.defaultModules,
      ...ctor.specModules,
    });
    // init functional info obj
    const combatants: {[playerId: number]: CombatantInfoEvent} = [];
    this.combatantInfoEvents.forEach(ci => combatants[ci.sourceID] = ci);
    const selectedCombatant = combatants[this.playerId];
    this.functionalInfo = {
      abilities: this.getModule(Abilities).abilities,
      playerId: this.selectedCombatant.id,
      fightStart: this.fight.start_time,
      fightEnd: this.fight.end_time,
      selectedCombatant,
      combatants,
    };
  }
  finish() {
    this.finished = true;
    /** @var {EventEmitter} */
    const emitter = this.getModule(EventEmitter);
    console.log(
      'Events triggered:',
      emitter.numTriggeredEvents,
      'Event listeners added:',
      emitter.numEventListeners,
      'Listeners called:',
      emitter.numListenersCalled,
      'Listeners called (after filters):',
      emitter.numActualExecutions,
      'Listeners filtered away:',
      emitter.numListenersCalled - emitter.numActualExecutions,
    );
  }

  _getModuleClass(config: DependencyDefinition): [typeof Module, any] {
    let moduleClass;
    let options;
    if (config instanceof Array) {
      moduleClass = config[0];
      options = config[1];
    } else {
      moduleClass = config;
      options = {};
    }
    return [moduleClass, options];
  }
  _resolveDependencies(dependencies: { [desiredName: string]: typeof Module }) {
    const availableDependencies: { [name: string]: Module } = {};
    const missingDependencies: Array<typeof Module> = [];
    if (dependencies) {
      Object.keys(dependencies).forEach((desiredDependencyName) => {
        const dependencyClass = dependencies[desiredDependencyName];

        const dependencyModule = this.getOptionalModule(dependencyClass);
        if (dependencyModule) {
          availableDependencies[desiredDependencyName] = dependencyModule;
        } else {
          missingDependencies.push(dependencyClass);
        }
      });
    }
    return [availableDependencies, missingDependencies] as const;
  }
  /**
   * @param {Module} moduleClass
   * @param {object} [options]
   * @param {string} [desiredModuleName]  Deprecated: will be removed Soon™.
   */
  loadModule<T extends typeof Module>(
    moduleClass: T,
    options: { [prop: string]: any; priority: number },
    desiredModuleName = `module${Object.keys(this._modules).length}`,
  ) {
    // eslint-disable-next-line new-cap
    const module = new moduleClass({
      ...options,
      owner: this,
    });
    if (options) {
      // We can't set the options via the constructor since a parent constructor can't override the values of a child's class properties.
      // See https://github.com/Microsoft/TypeScript/issues/6110 for more info
      Object.keys(options).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        module[key] = options[key];
      });
    }
    // TODO: Remove module naming
    module.key = desiredModuleName;
    this._modules[desiredModuleName] = module;
    return module;
  }
  initializeModules(modules: DependenciesDefinition, iteration = 1) {
    // TODO: Refactor and test, this dependency injection thing works really well but it's hard to understand or change.
    const failedModules: string[] = [];
    Object.keys(modules).forEach((desiredModuleName) => {
      const moduleConfig = modules[desiredModuleName];
      if (!moduleConfig) {
        return;
      }
      const [moduleClass, options] = this._getModuleClass(moduleConfig);
      const [availableDependencies, missingDependencies] = this._resolveDependencies(
        moduleClass.dependencies,
      );
      const hasMissingDependency = missingDependencies.length === 0;

      if (hasMissingDependency) {
        if (debugDependencyInjection) {
          if (Object.keys(availableDependencies).length === 0) {
            console.log('Loading', moduleClass.name);
          } else {
            console.log(
              'Loading',
              moduleClass.name,
              'with dependencies:',
              Object.keys(availableDependencies),
            );
          }
        }
        // The priority goes from lowest (most important) to highest, seeing as modules are loaded after their dependencies are loaded, just using the count of loaded modules is sufficient.
        const priority = Object.keys(this._modules).length;
        try {
          this.loadModule(
            moduleClass,
            {
              ...options,
              ...availableDependencies,
              priority,
            },
            desiredModuleName,
          );
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            throw e;
          }
          this.disabledModules[ModuleError.INITIALIZATION].push({
            key: isMinified ? desiredModuleName : moduleClass.name,
            module: moduleClass,
            error: e,
          });
          debugDependencyInjection &&
            console.warn(moduleClass.name, 'disabled due to error during initialization: ', e);
        }
      } else {
        const disabledDependencies = missingDependencies
          .map((d) => d.name)
          .filter((x) =>
            this.disabledModules[ModuleError.INITIALIZATION].map((d) => d.module.name).includes(x),
          ); // see if a dependency was previously disabled due to an error
        if (disabledDependencies.length !== 0) {
          // if a dependency was already marked as disabled due to an error, mark this module as disabled
          this.disabledModules[ModuleError.DEPENDENCY].push({
            key: isMinified ? desiredModuleName : moduleClass.name,
            module: moduleClass,
          });
          debugDependencyInjection &&
            console.warn(
              moduleClass.name,
              'disabled due to error during initialization of a dependency.',
            );
        } else {
          debugDependencyInjection &&
            console.warn(
              moduleClass.name,
              'could not be loaded, missing dependencies:',
              missingDependencies.map((d) => d.name),
            );
          failedModules.push(desiredModuleName);
        }
      }
    });

    if (failedModules.length !== 0) {
      debugDependencyInjection &&
        console.warn(
          `${failedModules.length} modules failed to load, trying again:`,
          failedModules.map((key) => {
            const def = modules[key];
            if (def instanceof Array) {
              return def[0].name;
            } else {
              return (def as typeof Module).name;
            }
          }),
        );
      const newBatch: DependenciesDefinition = {};
      failedModules.forEach((key) => {
        newBatch[key] = modules[key];
      });
      if (iteration > MAX_DI_ITERATIONS) {
        // Sometimes modules can't be imported at all because they depend on modules not enabled or have a circular dependency. Stop trying after a while.
        // eslint-disable-next-line no-debugger
        debugger;
        throw new Error(`Failed to load modules: ${Object.keys(newBatch).join(', ')}`);
      }
      this.initializeModules(newBatch, iteration + 1);
    } else {
      this.allModulesInitialized();
    }
  }
  allModulesInitialized() {
    // Executed when module initialization is complete
  }
  _moduleCache = new Map();
  getOptionalModule<T extends Module>(type: { new (options: Options): T }): T | undefined {
    // We need to use a cache and can't just set this on initialization because we sometimes search by the inheritance chain.
    const cacheEntry = this._moduleCache.get(type);
    if (cacheEntry !== undefined) {
      return cacheEntry;
    }
    // Search for a specific module by its type, accepting any modules that have the type somewhere in the inheritance chain
    const module = Object.values(this._modules).find((module) => module instanceof type);
    this._moduleCache.set(type, module);
    return module as T;
  }
  getModule<T extends Module>(type: { new (options: Options): T }): T {
    const module = this.getOptionalModule(type);
    if (module === undefined) {
      throw new Error(`Module not found: ${type.name}`);
    }
    return module;
  }
  normalize(events: AnyEvent[]) {
    this.activeModules
      .filter((module) => module instanceof EventsNormalizer)
      .map((module) => module as EventsNormalizer)
      .sort((a, b) => a.priority - b.priority) // lowest should go first, as `priority = 0` will have highest prio
      .forEach((normalizer) => {
        if (normalizer.normalize) {
          events = normalizer.normalize(events);
        }
      });
    return events;
  }

  /** The amount of events parsed. This can reliably be used to determine if something should re-render. */
  eventCount = 0;
  eventHistory: AnyEvent[] = [];
  addEventListener<ET extends EventType, E extends MappedEvent<ET>>(
    eventFilter: ET | EventFilter<ET>,
    listener: EventListener<ET, E>,
    module: Module,
  ) {
    this.getModule(EventEmitter).addEventListener(eventFilter, listener, module);
  }

  deepDisable(module: Module, state: ModuleError, error: Error | undefined = undefined) {
    if (!module.active) {
      return; //return early
    }
    console.error('Disabling', isMinified ? module.key : module.constructor.name);
    this.disabledModules[state].push({
      key: isMinified ? module.key : module.constructor.name,
      module: module.constructor,
      ...(error && { error: error }),
    });
    module.active = false;
    this.activeModules.forEach((active) => {
      const ctor = active.constructor as typeof Module;
      const deps = ctor.dependencies;
      // Inspectors may light up `module instanceof depClass` because of the constructor cast
      if (deps && Object.values(deps).find((depClass) => module instanceof depClass)) {
        this.deepDisable(active, ModuleError.DEPENDENCY);
      }
    });
  }

  byPlayer<ET extends EventType>(event: Event<ET>, playerId = this.player.id) {
    return HasSource(event) && event.sourceID === playerId;
  }
  toPlayer<ET extends EventType>(event: Event<ET>, playerId = this.player.id) {
    return HasTarget(event) && event.targetID === playerId;
  }
  byPlayerPet<ET extends EventType>(event: Event<ET>) {
    return HasSource(event) && this.playerPets.some((pet) => pet.id === event.sourceID);
  }
  toPlayerPet<ET extends EventType>(event: Event<ET>) {
    return HasTarget(event) && this.playerPets.some((pet) => pet.id === event.targetID);
  }

  getPerSecond(totalAmount: number): number {
    return (totalAmount / this.fightDuration) * 1000;
  }
  getPerMinute(totalAmount: number): number {
    return (totalAmount / this.fightDuration) * 1000 * 60;
  }
  getPercentageOfTotalHealingDone(healingDone: number) {
    return healingDone / this.getModule(HealingDone).total.effective;
  }
  formatItemHealingDone(healingDone: number) {
    return `${formatPercentage(
      this.getPercentageOfTotalHealingDone(healingDone),
    )} % / ${formatNumber(this.getPerSecond(healingDone))} HPS`;
  }
  formatItemAbsorbDone(absorbDone: number) {
    return `${formatNumber(absorbDone)}`;
  }
  getPercentageOfTotalDamageDone(damageDone: number) {
    return damageDone / this.getModule(DamageDone).total.effective;
  }
  formatItemDamageDone(damageDone: number) {
    return `${formatPercentage(this.getPercentageOfTotalDamageDone(damageDone))} % / ${formatNumber(
      this.getPerSecond(damageDone),
    )} DPS`;
  }
  getPercentageOfTotalDamageTaken(damageTaken: number) {
    return damageTaken / this.getModule(DamageTaken).total.effective;
  }
  formatTimestamp(timestamp: number, precision = 0) {
    return formatDuration(timestamp - this.fight.start_time, precision);
  }

  generateResults(adjustForDowntime: boolean): ParseResults {
    this.adjustForDowntime = adjustForDowntime;

    let results: ParseResults = new ParseResults();

    const addStatistic = (statistic: any, basePosition: number, key: string) => {
      if (!statistic) {
        return;
      }
      const position =
        statistic.props.position !== undefined ? statistic.props.position : basePosition;
      results.statistics.push(
        React.cloneElement(statistic, {
          key,
          position,
        }),
      );
    };

    const attemptResultGeneration = () =>
      Object.keys(this._modules)
        .filter((key) => this._modules[key].active)
        .sort((a, b) => this._modules[b].priority - this._modules[a].priority)
        .every((key, index) => {
          const module = this._modules[key];

          try {
            if (module instanceof Analyzer) {
              const analyzer = module as Analyzer;
              if (analyzer.statistic) {
                let basePosition = index;
                if (analyzer.statisticOrder !== undefined) {
                  basePosition = analyzer.statisticOrder;
                  console.warn(
                    'DEPRECATED',
                    "Setting the position of a statistic via a module's `statisticOrder` prop is deprecated. Set the `position` prop on the `StatisticBox` instead. Example commit: https://github.com/WoWAnalyzer/WoWAnalyzer/commit/ece1bbeca0d3721ede078d256a30576faacb803d",
                    module,
                  );
                }

                // TODO - confirm removing i18n doesn't actually change anything here
                const statistic = analyzer.statistic();
                if (statistic) {
                  if (Array.isArray(statistic)) {
                    statistic.forEach((statistic, statisticIndex) => {
                      addStatistic(statistic, basePosition, `${key}-statistic-${statisticIndex}`);
                    });
                  } else {
                    addStatistic(statistic, basePosition, `${key}-statistic`);
                  }
                }
              }
              if (analyzer.tab) {
                const tab = analyzer.tab();
                if (tab) {
                  results.tabs.push(tab);
                }
              }
              if (analyzer.suggestions) {
                analyzer.suggestions(results.suggestions.when);
              }
            }
          } catch (e) {
            //error occured during results generation of module, disable module and all modules depending on it
            if (process.env.NODE_ENV !== 'production') {
              throw e;
            }
            this.deepDisable(module, ModuleError.RESULTS, e);
            //break loop and start again with inaccurate modules now disabled (in case of modules being rendered before their dependencies' errors are encountered)
            return false;
          }
          return true;
        });

    //keep trying to generate results until no "new" errors are found anymore to weed out all the inaccurate / errored modules
    let generated = false;
    while (!generated) {
      results = new ParseResults();

      results.tabs = [];
      generated = attemptResultGeneration();
    }

    console.time('functional');
    const ctor = this.constructor as typeof CombatLogParser;

    console.time('functional suggestions');
    ctor.suggestions.forEach((suggestionFactory) => {
      const suggestions = suggestionFactory(this.eventHistory, this.functionalInfo);
      if (Array.isArray(suggestions)) {
        suggestions.forEach((suggestion) => results.addIssue(suggestion));
      } else {
        results.addIssue(suggestions);
      }
    });
    console.timeEnd('functional suggestions');
    console.time('functional statistics');
    ctor.statistics.forEach((Component) => {
      results.statistics.push(<Component events={this.eventHistory} info={this.functionalInfo} />);
    });
    console.timeEnd('functional statistics');
    console.timeEnd('functional');

    return results;
  }
}

export default CombatLogParser;
