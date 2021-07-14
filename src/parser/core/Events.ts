import Spell from 'common/SPELLS/Spell';
import { PhaseConfig } from 'game/raids';
import React from 'react';

import EventFilter from './EventFilter';
import { PetInfo } from './Pet';
import { PlayerInfo } from './Player';

export enum EventType {
  Heal = 'heal',
  HealAbsorbed = 'healabsorbed',
  Absorbed = 'absorbed',
  Damage = 'damage',
  BeginCast = 'begincast',
  Cast = 'cast',
  Drain = 'drain',
  ApplyBuff = 'applybuff',
  ApplyDebuff = 'applydebuff',
  ApplyBuffStack = 'applybuffstack',
  ApplyDebuffStack = 'applydebuffstack',
  RemoveBuffStack = 'removebuffstack',
  RemoveDebuffStack = 'removedebuffstack',
  ChangeBuffStack = 'changebuffstack',
  ChangeDebuffStack = 'changedebuffstack',
  RefreshBuff = 'refreshbuff',
  RefreshDebuff = 'refreshdebuff',
  RemoveBuff = 'removebuff',
  RemoveDebuff = 'removedebuff',
  Summon = 'summon',
  Energize = 'energize',
  Interrupt = 'interrupt',
  Death = 'death',
  Resurrect = 'resurrect',
  CombatantInfo = 'combatantinfo',
  Instakill = 'instakill',
  AuraBroken = 'aurabroken',

  // Fabricated:
  Event = 'event', // everything
  FightEnd = 'fightend',
  GlobalCooldown = 'globalcooldown',
  AutoAttackCooldown = 'autoattackcooldown',
  BeginChannel = 'beginchannel',
  EndChannel = 'endchannel',
  CancelChannel = 'cancelchannel',
  UpdateSpellUsable = 'updatespellusable',
  BeaconTransfer = 'beacontransfer',
  BeaconTransferFailed = 'beacontransferfailed',
  ChangeStats = 'changestats',
  ChangeHaste = 'changehaste',
  BeginCooldown = 'begincooldown',
  AddCooldownCharge = 'addcooldowncharge',
  RefreshCooldown = 'refreshcooldown',
  EndCooldown = 'endcooldown',
  RestoreCharge = 'restorecharge',
  Health = 'health',
  Adds = 'adds',
  Dispel = 'dispel',
  Time = 'time',
  Test = 'test',
  SpendResource = 'spendresource',

  // Monk
  AddStagger = 'addstagger',
  RemoveStagger = 'removestagger',

  // Priest
  Atonement = 'atonement',
  AtonementDamage = 'atonementDamageSource',
  AtonementApplied = 'atonement_applied',
  AtonementFaded = 'atonement_faded',
  AtonementRefresh = 'atonement_refresh',
  AtonementRefreshImproper = 'atonement_refresh_improper',
  SpiritShell = 'spirit_shell',

  //Shaman
  FeedHeal = 'feed_heal',

  // Warlock
  FullShardGained = 'fullshardgained',

  // Phases:
  PhaseStart = 'phasestart',
  PhaseEnd = 'phaseend',

  // Time Filtering:
  FilterCooldownInfo = 'filtercooldowninfo',
  FilterBuffInfo = 'filterbuffinfo',
}

type MappedEventTypes = {
  [EventType.Event]: Event<EventType.Event>;
  [EventType.Heal]: HealEvent;
  [EventType.Absorbed]: AbsorbedEvent;
  [EventType.Damage]: DamageEvent;
  [EventType.BeginCast]: BeginCastEvent;
  [EventType.Cast]: CastEvent;
  [EventType.ApplyBuff]: ApplyBuffEvent;
  [EventType.ApplyDebuff]: ApplyDebuffEvent;
  [EventType.ApplyBuffStack]: ApplyBuffStackEvent;
  [EventType.ApplyDebuffStack]: ApplyDebuffStackEvent;
  [EventType.RemoveBuffStack]: RemoveBuffStackEvent;
  [EventType.RemoveDebuffStack]: RemoveDebuffStackEvent;
  [EventType.ChangeBuffStack]: ChangeBuffStackEvent;
  [EventType.ChangeDebuffStack]: ChangeDebuffStackEvent;
  [EventType.RefreshBuff]: RefreshBuffEvent;
  [EventType.RefreshDebuff]: RefreshDebuffEvent;
  [EventType.RemoveBuff]: RemoveBuffEvent;
  [EventType.RemoveDebuff]: RemoveDebuffEvent;
  [EventType.Summon]: SummonEvent;
  [EventType.Energize]: EnergizeEvent;
  [EventType.Drain]: DrainEvent;
  [EventType.Death]: DeathEvent;
  [EventType.CombatantInfo]: CombatantInfoEvent;
  [EventType.Dispel]: DispelEvent;
  [EventType.AuraBroken]: AuraBrokenEvent;

  // Fabricated:
  [EventType.FightEnd]: FightEndEvent;
  [EventType.GlobalCooldown]: GlobalCooldownEvent;
  [EventType.AutoAttackCooldown]: AutoAttackCooldownEvent;
  [EventType.BeginChannel]: BeginChannelEvent;
  [EventType.EndChannel]: EndChannelEvent;
  [EventType.UpdateSpellUsable]: UpdateSpellUsableEvent;
  [EventType.ChangeStats]: ChangeStatsEvent;
  [EventType.SpendResource]: SpendResourceEvent;
  [EventType.FeedHeal]: FeedHealEvent;
  // Phases:
  [EventType.PhaseStart]: PhaseStartEvent;
  [EventType.PhaseEnd]: PhaseEndEvent;

  // Time Filtering:
  [EventType.FilterCooldownInfo]: FilterCooldownInfoEvent;
  [EventType.FilterBuffInfo]: FilterBuffInfoEvent;
};

export type AnyEvent<
  ET extends keyof MappedEventTypes = keyof MappedEventTypes
> = MappedEventTypes[ET];

export interface Ability {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
}

export interface ClassResources {
  amount: number;
  max: number;
  type: number;
  cost?: number;
}

// TODO: Find a good place for this
export enum Class {
  DemonHunter = 'Demon Hunter',
  DeathKnight = 'Death Knight',
  Druid = 'Druid',
  Hunter = 'Hunter',
  Mage = 'Mage',
  Monk = 'Monk',
  Paladin = 'Paladin',
  Priest = 'Priest',
  Rogue = 'Rogue',
  Shaman = 'Shaman',
  Warrior = 'Warrior',
  Warlock = 'Warlock',
}

export type AbilityEvent<T extends string> = Event<T> & { ability: Ability };
export type SourcedEvent<T extends string> = Event<T> & {
  sourceID: number;
  sourceIsFriendly: boolean;
};
export type TargettedEvent<T extends string> = Event<T> & {
  targetID: number;
  targetInstance?: number;
  targetIsFriendly: boolean;
};

export function HasAbility<T extends EventType>(event: Event<T>): event is AbilityEvent<T> {
  return (event as AbilityEvent<T>).ability !== undefined;
}

export function HasSource<T extends EventType>(event: Event<T>): event is SourcedEvent<T> {
  return (event as SourcedEvent<T>).sourceID !== undefined;
}

export function HasTarget<T extends EventType>(event: Event<T>): event is TargettedEvent<T> {
  return (event as TargettedEvent<T>).targetID !== undefined;
}

export function GetRelatedEvents(event: AnyEvent, relation: string): AnyEvent[] {
  return event._linkedEvents === undefined
    ? []
    : event._linkedEvents.filter((le) => le.relation === relation).map((le) => le.event);
}

export function HasRelatedEvent(event: AnyEvent, relation: string): boolean {
  return (
    event._linkedEvents !== undefined &&
    event._linkedEvents.find((le) => le.relation === relation) !== undefined
  );
}

export function AddRelatedEvent(event: AnyEvent, relation: string, relatedEvent: AnyEvent): void {
  if (event._linkedEvents === undefined) {
    event._linkedEvents = [];
  }
  event._linkedEvents.push({ relation, event: relatedEvent });
  event.__modified = true;
}

export type MappedEvent<T extends EventType> = T extends keyof MappedEventTypes
  ? MappedEventTypes[T]
  : Event<T>;

// TODO Eventually convert this back from string to EventType (once the edge cases of raw string filters are removed)
export interface Event<T extends string> {
  /** Event type string */
  type: T;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** True iff the event happened before the pull. Added by WoWA */
  prepull?: boolean;
  /** Other events associated with this event. Added by WoWA normalizers. Meaning is context sensitive */
  _linkedEvents?: LinkedEvent[];
  /** True iff the event was created by WoWA */
  __fabricated?: boolean;
  /** True iff the event's content was modified by WoWA */
  __modified?: boolean;
  /** True iff a WoWA normalizer reordered this event */
  __reordered?: boolean;
}

// TODO way to specify specific expected event type?
export interface LinkedEvent {
  /** A string specifying the relationship of the linked event. Will be used as a key during lookup */
  relation: string;
  /** The linked event */
  event: AnyEvent;
}

export interface BeginCastEvent extends Event<EventType.BeginCast> {
  ability: Ability;
  castEvent: CastEvent | null;
  channel: {
    type: EventType.BeginChannel;
    timestamp: number;
    ability: Ability;
    sourceID: number;
    isCancelled: boolean;
  };
  isCancelled: boolean;
  sourceID: number;
  sourceIsFriendly: boolean;
  target: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
  targetIsFriendly: boolean;
}

export interface BeginChannelEvent extends Event<EventType.BeginChannel> {
  ability: Ability;
  sourceID: number;
  isCancelled: boolean;
  // Added by any module, used in the timeline
  meta?: {
    isInefficientCast?: boolean;
    inefficientCastReason?: React.ReactNode;
    isEnhancedCast?: boolean;
    enhancedCastReason?: React.ReactNode;
  };
  trigger?: {
    timestamp: number;
    type: EventType;
    castEvent: CastEvent;
    meta?: {
      isInefficientCast?: boolean;
      inefficientCastReason?: React.ReactNode;
      isEnhancedCast?: boolean;
      enhancedCastReason?: React.ReactNode;
    };
  };
}

export interface EndChannelEvent extends Event<EventType.EndChannel> {
  ability: Ability;
  sourceID: number;
  start: number;
  duration: number;
  beginChannel: BeginChannelEvent;
  trigger?: {
    timestamp: number;
  };
}

export interface BaseCastEvent<T extends string> extends Event<T> {
  ability: Ability;
  absorb?: number;
  armor?: number;
  attackPower?: number;
  channel?: {
    type: EventType.BeginChannel;
    timestamp: number;
    duration: number;
    ability: Ability;
    sourceID: number;
    isCancelled: boolean;
    start: number;
    beginChannel?: {
      isCancelled: boolean;
      sourceID: number;
      timestamp: number;
      type: string;
    };
  };
  classResources?: Array<ClassResources & { cost: number }>;
  facing?: number;
  hitPoints?: number;
  itemLevel?: number;
  mapID?: number;
  maxHitPoints?: number;
  resourceActor?: number;
  sourceID: number;
  sourceIsFriendly: boolean;
  spellPower?: number;
  target?: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
  targetID?: number;
  targetInstance?: number;
  targetIsFriendly: boolean;
  x?: number;
  y?: number;

  // Added by the SpellResourceCost module if active
  rawResourceCost?: {
    [resourceType: number]: number;
  };
  resourceCost?: {
    [resourceType: number]: number;
  };
  // Added by the GlobalCooldown module
  globalCooldown?: GlobalCooldownEvent;
  // Added by any module, used in the timeline
  meta?: {
    isInefficientCast?: boolean;
    inefficientCastReason?: React.ReactNode;
    isEnhancedCast?: boolean;
    enhancedCastReason?: React.ReactNode;
  };
}

export type CastEvent = BaseCastEvent<EventType.Cast>;

export interface FilterCooldownInfoEvent extends BaseCastEvent<EventType.FilterCooldownInfo> {
  trigger: EventType;
}

export interface FilterBuffInfoEvent extends BuffEvent<EventType.FilterBuffInfo> {
  trigger: EventType;
}

export interface HealEvent extends Event<EventType.Heal> {
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetInstance?: number;
  targetIsFriendly: boolean;
  ability: Ability;
  hitType: number;
  amount: number;
  overheal?: number;
  tick?: boolean;
  resourceActor: number;
  classResources: ClassResources[];
  hitPoints: number;
  maxHitPoints: number;
  attackPower: number;
  spellPower: number;
  armor: number;
  /** The current total absorb shields on the target I think? */
  absorb: number;
  /** The amount of healing absorbed by a healing taken-debuff. */
  absorbed?: number;
  x: number;
  y: number;
  facing: number;
  mapID: number;
  itemLevel: number;
}

export interface BeaconHealEvent extends Omit<HealEvent, 'type'> {
  type: EventType.BeaconTransfer;
  originalHeal: HealEvent;
}

export interface FeedHealEvent extends Omit<HealEvent, 'type'> {
  type: EventType.FeedHeal;
  feed: number;
}

export interface AbsorbedEvent extends Event<EventType.Absorbed> {
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetIsFriendly: boolean;
  ability: Ability;
  attacker?: {
    name: 'Environment';
    id: -1;
    guid: 0;
    type: 'NPC';
    icon: 'NPC';
  };
  attackerID?: number;
  attackerIsFriendly: boolean;
  amount: number;
  extraAbility: Ability;
}

export interface DamageEvent extends Event<EventType.Damage> {
  source?: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
  sourceID?: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetInstance: number;
  targetIsFriendly: boolean;
  ability: Ability;
  hitType: number;
  amount: number;
  absorbed?: number;
  resourceActor?: number;
  classResources?: ClassResources[];
  hitPoints?: number;
  maxHitPoints?: number;
  attackPower?: number;
  spellPower: number;
  armor?: number;
  absorb?: number;
  x?: number;
  y?: number;
  facing?: number;
  mapID?: number;
  itemLevel?: number;
  mitigated?: number;
  unmitigatedAmount?: number;
  tick?: boolean;
  overkill?: number;
  blocked?: number; // does this exist?
}

export interface BuffEvent<T extends string> extends Event<T> {
  ability: Ability;
  targetID: number;
  targetInstance?: number;
  targetIsFriendly: boolean;
  sourceID?: number;
  sourceIsFriendly: boolean;
}

export interface ApplyBuffEvent extends BuffEvent<EventType.ApplyBuff> {
  // confirmed that not all applybuff events contain a sourceID; e.g. wind rush from totem
  absorb?: number;
  __fromCombatantinfo?: boolean;
}

export interface ApplyDebuffEvent extends BuffEvent<EventType.ApplyDebuff> {
  source?: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
  absorb?: number;
  __fromCombatantinfo?: boolean;
}

export interface RemoveBuffEvent extends BuffEvent<EventType.RemoveBuff> {
  sourceID: number;
  absorb?: number;
}

export interface RemoveDebuffEvent extends BuffEvent<EventType.RemoveDebuff> {
  source?: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
  absorb?: number;
}

export interface ApplyBuffStackEvent extends BuffEvent<EventType.ApplyBuffStack> {
  sourceID: number;
  stack: number;
}

export interface ApplyDebuffStackEvent extends BuffEvent<EventType.ApplyDebuffStack> {
  sourceID: number;
  stack: number;
}

export interface RemoveBuffStackEvent extends BuffEvent<EventType.RemoveBuffStack> {
  sourceID: number;
  stack: number;
}

export interface ChangeBuffStackEvent extends BuffEvent<EventType.ChangeBuffStack> {
  end?: number;
  isDebuff?: boolean;
  newStacks: number;
  oldStacks: number;
  sourceID: number;
  stack?: number;
  stackHistory: {
    stacks: number;
    timestamp: number;
  };
  stacks: number;
  stacksGained: number;
  start: number;
  trigger: {
    end?: number;
    isDebuff?: boolean;
    prepull: boolean;
    sourceID: number;
    sourceIsFriendly: boolean;
    stacks: number;
    start: number;
    targetID: number;
    targetIsFriendly: boolean;
    timestamp: number;
    type: string;
  };
}

export interface ChangeDebuffStackEvent extends Omit<ChangeBuffStackEvent, 'type'> {
  type: EventType.ChangeDebuffStack;
}

export interface RemoveDebuffStackEvent extends BuffEvent<EventType.RemoveDebuffStack> {
  sourceID: number;
  stack: number;
}

export interface RefreshBuffEvent extends BuffEvent<EventType.RefreshBuff> {
  source?: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
}

export interface RefreshDebuffEvent extends BuffEvent<EventType.RefreshDebuff> {
  source?: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
}

export interface EnergizeEvent extends Event<EventType.Energize> {
  ability: Ability;
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetIsFriendly: boolean;
  /** The id for the resource. See the RESOURCE_TYPES file for all available resource types. */
  resourceChangeType: number;
  /** The amount of resource gained. This includes any wasted gain, see `waste`. */
  resourceChange: number;
  /** The amount of wasted resource gain (overcapped). */
  waste: number;
  otherResourceChange: number; // defaults to 0?
  resourceActor: number; // 1 = source, 2 = target? used for classResources/hitpoints/etc, not resourceChange fields I think
  classResources: ClassResources[];
  hitPoints: number;
  maxHitPoints: number;
  attackPower: number;
  spellPower: number;
  armor: number;
  x: number;
  y: number;
  facing: number;
  mapID: number;
  itemLevel: number;
}

export interface DrainEvent extends Event<EventType.Drain> {
  ability: Ability;
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetIsFriendly: boolean;
  resourceChange: number;
  resourceChangeType: number;
  otherResourceChange: number;
  resourceActor: number;
  classResources: ClassResources[];
  hitPoints: number;
  maxHitPoints: number;
  attackPower: number;
  spellPower: number;
  armor: number;
  absorb: number;
  x: number;
  y: number;
  facing: number;
  mapID: number;
  itemLevel: number;
}

export interface InterruptEvent extends Event<EventType.Interrupt> {
  ability: Ability;
  extraAbility: Ability;
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetInstance: number;
  targetIsFriendly: boolean;
}

export interface DeathEvent extends Event<EventType.Death> {
  killingAbility?: Ability;
  source: { name: 'Environment'; id: -1; guid: 0; type: 'NPC'; icon: 'NPC' };
  sourceIsFriendly: boolean;
  targetID: number;
  targetIsFriendly: boolean;
  ability: Ability;
}

export interface AuraBrokenEvent extends Event<EventType.AuraBroken> {
  ability: Ability;
  extraAbility: Ability;
  isBuff: boolean;
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetInstance: number;
  targetIsFriendly: boolean;
}

export interface ResurrectEvent extends Event<EventType.Resurrect> {
  ability?: Ability;
  sourceID: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetIsFriendly: boolean;
}

export interface SummonEvent extends Event<EventType.Summon> {
  sourceID: number;
  sourceIsFriendly: boolean;
  target: PetInfo;
  targetID: number;
  targetInstance: number;
  targetIsFriendly: boolean;
  ability: Ability;
}

export interface GlobalCooldownEvent extends Event<EventType.GlobalCooldown> {
  ability: Ability;
  duration: number;
  sourceID: number;
  targetID: number;
  targetIsFriendly: boolean;
  timestamp: number;
  trigger: CastEvent | BeginChannelEvent;
  __fabricated: true;
}

export interface AutoAttackCooldownEvent extends Event<EventType.AutoAttackCooldown> {
  ability: Ability;
  duration: number;
  haste: number;
  sourceID: number;
  targetID: number;
  timestamp: number;
  trigger: CastEvent | BeginChannelEvent;
  __fabricated: true;
}

export interface FightEndEvent extends Event<EventType.FightEnd> {
  timestamp: number;
  __fabricated: true;
}

export interface UpdateSpellUsableEvent extends Event<EventType.UpdateSpellUsable> {
  ability: Omit<Ability, 'type'>;
  name?: string;
  trigger:
    | EventType.BeginCooldown
    | EventType.EndCooldown
    | EventType.RefreshCooldown
    | EventType.AddCooldownCharge
    | EventType.RestoreCharge;
  isOnCooldown: boolean;
  isAvailable: boolean;
  chargesAvailable: number;
  maxCharges: number;
  timePassed?: number;
  sourceID: number;
  targetID: number;
  targetIsFriendly: boolean;
  start: number;
  end?: number;
  expectedDuration: number;
  totalReductionTime: number;

  // Added by SpellHistory
  timeWaitingOnGCD?: number;

  __fabricated: true;
}

export interface Stats {
  agility: number;
  armor: number;
  avoidance: number;
  crit: number;
  haste: number;
  intellect: number;
  leech: number;
  mastery: number;
  speed: number;
  stamina: number;
  strength: number;
  versatility: number;
}

export interface ChangeStatsEvent extends Event<EventType.ChangeStats> {
  sourceID: number;
  targetID: number;
  targetIsFriendly: true;
  trigger: AnyEvent;
  after: Stats;
  before: Stats;
  delta: Stats;
}

export interface ChangeHasteEvent extends Event<EventType.ChangeHaste> {
  oldHaste: number;
  newHaste: number;
}

export interface DispelEvent extends Event<EventType.Dispel> {
  ability: Ability; // The ability used to dispel
  extraAbility: Ability; // The ability that was dispelled
  isBuff: number;
  sourceID?: number;
  sourceIsFriendly: boolean;
  targetID: number;
  targetInstance: number;
  targetIsFriendly: boolean;
}

export interface BasePhaseEvent<T extends string> extends Event<T> {
  phase: PhaseConfig;
  __fabricated: true;
}

export interface SpendResourceEvent extends Event<EventType.SpendResource> {
  sourceID: number;
  targetID?: number;
  resourceChange: number;
  resourceChangeType: number;
  ability: Ability;
  __fabricated: true;
}

export type PhaseEvent = BasePhaseEvent<EventType.PhaseStart | EventType.PhaseEnd>;

export type PhaseStartEvent = BasePhaseEvent<EventType.PhaseStart>;

export type PhaseEndEvent = BasePhaseEvent<EventType.PhaseEnd>;

export interface Item {
  id: number;
  quality: number;
  icon: string;
  itemLevel: number;
  bonusIDs?: number | number[];
  permanentEnchant?: number;
  temporaryEnchant?: number;
  gems?: Gem[];
}

export interface Gem {
  id: number;
  itemLevel: number;
  icon: string;
}

export interface Buff {
  source: number;
  ability: number;
  stacks: number;
  icon: string;
  name?: string;
}

export interface Covenant {
  name: string;
  description: string;
  id: number;
  spellID: number;
  icon: string;
}

export interface Soulbind {
  name: string;
  id: number;
  covenantID: number;
  garrisonTalentTreeId: number;
}

export interface SoulbindTrait {
  traitID: number;
  rank: number;
  spellID: number;
  icon: string;
}

export interface Conduit {
  traitID: number;
  rank: number;
  itemLevel?: number;
  spellID: number;
  icon: string;
}

export interface CombatantInfoEvent extends Event<EventType.CombatantInfo> {
  player: PlayerInfo;
  expansion: 'tbc' | 'shadowlands' | string;
  pin: string;
  sourceID: number;
  gear: Item[];
  auras: Buff[];
  faction: number;
  specID: number;
  strength: number;
  agility: number;
  stamina: number;
  intellect: number;
  dodge: number;
  parry: number;
  block: number;
  armor: number;
  critMelee: number;
  critRanged: number;
  critSpell: number;
  speed: number;
  leech: number;
  hasteMelee: number;
  hasteRanged: number;
  hasteSpell: number;
  avoidance: number;
  mastery: number;
  versatilityDamageDone: number;
  versatilityHealingDone: number;
  versatilityDamageReduction: number;
  talents: [Spell, Spell, Spell, Spell, Spell, Spell, Spell];
  pvpTalents: Spell[];
  covenantID: number;
  soulbindID: number;
  /**
   * Represents expansion specific traits
   * Legion: Artifact Traits
   * BFA: Azerite
   * Shadowlands: Soulbinds
   */
  customPowerSet?: any[]; // will be copied into field with better name / type depending on expansion
  /**
   * Represents expansion specific traits
   * BFA: Essences
   * Shadowlands: Conduits
   */
  secondaryCustomPowerSet?: any[]; // will be copied into field with better name / type depending on expansion
  /**
   * Represents expansion specific traits
   * Shadowlands: Anima Powers
   */
  tertiaryCustomPowerSet?: any[]; // will be copied into field with better name / type depending on expansion
  /** Filled from customPowerSet for Shadowlands logs */
  soulbindTraits?: SoulbindTrait[];
  /** Filled from secondaryCustomPowerSet for Shadowlands logs */
  conduits?: Conduit[];
  error?: any; //TODO: Verify, is this a bool? string?
}

const Events = {
  /**
   * BEWARE: These events/properties are NOT COMPLETE. See the Event log for a
   * full list of available props and events.
   *
   * Generic props:
   * - timestamp: the timestamp of the event, relative to log start
   * - type: the event type, you should generally not use this and properly
   * separate event listeners.
   * - sourceID: who initiated the event
   * - sourceIsFriendly: whether the source was friendly to the selected player
   * - targetID: who was affected by the event
   * - targetIsFriendly: whether the target was friendly to the selected
   * player. BEWARE: @Any dps classes: make sure if you do a damage statistic
   * that you do NOT include friendly fire to other players (such as from Aura
   * of Sacrifice). This does not gain any damage bonuses.
   * - ability: object of the ability/spell involved. Shape: { name, guid,
   * type: I believe this is the magic school type, abilityIcon }
   * - resourceActor:
   * - classResources: array of resources (mana, energy, etc)
   * - hitPoints: for healing these are the hitpoints AFTER the event's
   * modifications are applied, for other events it might be before? you should
   * check to make sure for damage, energize and such events
   * - maxHitPoints: this max amount of hitpoints of the target
   * - attackPower:
   * - spellPower:
   * - x: x location on the map. See
   * paladin/holy/modules/features/MasteryEffectiveness for an example module
   * that uses this data.
   * - y: y location on the map
   * - facing: the direction the player is facing
   * - sourceMarker:
   * - targetMarker:
   * - mapID:
   * - itemLevel:
   */

  /**
   * This event is called for events where the player, a player pet or a target
   * of the player/player pet dealt or took damage. Event specific props:
   * - amount: effective damage
   * - absorbed: damage absorbed by a buff on the target (e.g.
   * https://www.wowhead.com/spell=269279/resounding-protection). This should
   * generally be considered effective damage.
   * - overkill: if the target died, this is the amount of damage that exceeded
   * their remaining health
   * - hitType:
   * - mitigated:
   * - unmitigatedAmount:
   * - tick:
   *
   * NOTE: Do not use this event to track absorb-healing (e.g. by a spell such
   * as Resounding Protection). Use the `absorbed` event instead.
   * @returns {EventFilter}
   */
  get damage() {
    return new EventFilter(EventType.Damage);
  },
  /**
   * This event is called for events where the player, a player pet or a target
   * of the player/player pet was healed. Event specific props:
   * - amount: effective healing
   * - absorbed: healing absorbed by a debuff on the target (e.g.
   * https://www.wowhead.com/spell=233263/embrace-of-the-eclipse). This should
   * generally be considered effective healing.
   * - overheal: overhealing
   * @returns {EventFilter}
   */
  get heal() {
    return new EventFilter(EventType.Heal);
  },
  /**
   * Triggered in addition to the regular heal event whenever a heal is
   * absorbed. Can be used to determine what buff or debuff was absorbing the
   * healing. NOTE: This should only be used if you need to know **which
   * ability soaked the healing**. If you want to track the amount of absorbed
   * healing by a spell, use the `absorb` prop of the `heal` event.
   * @returns {EventFilter}
   */
  get healabsorbed() {
    return new EventFilter(EventType.HealAbsorbed);
  },
  /**
   * This event is called for events where the player, a player pet or a target
   * of the player/player pet was healed. Event specific props:
   * - ability: The ability responsible for absorbed damage (i.e. the shield)
   * - amount: effective damage absorbed
   * - attackerID:
   * - attackerIsFriendly:
   * - extraAbility: The damage ability that was absorbed
   * @returns {EventFilter}
   */
  get absorbed() {
    return new EventFilter(EventType.Absorbed);
  },
  /**
   * This event is called when the player begins casting an ability that has a
   * cast time. This is also called for some channeled abilities, but not
   * everyone. This is NOT cast for most instant abilities.
   * @returns {EventFilter}
   */
  get begincast() {
    return new EventFilter(EventType.BeginCast);
  },
  /**
   * This event is called when the player successfully cast an ability.
   * BEWARE: Blizzard also sometimes uses this event type for mechanics and
   * spell ticks or bolts. This can even occur in between a begincast and cast
   * finish!
   * @returns {EventFilter}
   */
  get cast() {
    return new EventFilter(EventType.Cast);
  },
  /**
   * Event specific props:
   * - absorb: If the buff can absorb damage, the size of the shield.
   * @returns {EventFilter}
   */
  get applybuff() {
    return new EventFilter(EventType.ApplyBuff);
  },
  /**
   * Event specific props:
   * - absorb: If the buff can absorb healing (maybe there are debuffs that
   * absorb damage too?), this reflects the size of the (healing) absorb.
   * @returns {EventFilter}
   */
  get applydebuff() {
    return new EventFilter(EventType.ApplyDebuff);
  },
  get applybuffstack() {
    return new EventFilter(EventType.ApplyBuffStack);
  },
  get changebuffstack() {
    return new EventFilter(EventType.ChangeBuffStack);
  },
  get changedebuffstack() {
    return new EventFilter(EventType.ChangeDebuffStack);
  },
  get applydebuffstack() {
    return new EventFilter(EventType.ApplyDebuffStack);
  },
  /**
   * Event specific props:
   * - stack
   * @returns {EventFilter}
   */
  get removebuffstack() {
    return new EventFilter(EventType.RemoveBuffStack);
  },
  /**
   * Event specific props:
   * - stack
   * @returns {EventFilter}
   */
  get removedebuffstack() {
    return new EventFilter(EventType.RemoveDebuffStack);
  },
  get refreshbuff() {
    return new EventFilter(EventType.RefreshBuff);
  },
  get refreshdebuff() {
    return new EventFilter(EventType.RefreshDebuff);
  },
  /**
   * Event specific props:
   * - absorb: If the buff could absorb damage, the size of the shield
   * remaining. This is UNUSED/WASTED damage absorb.
   * @returns {EventFilter}
   */
  get removebuff() {
    return new EventFilter(EventType.RemoveBuff);
  },
  /**
   * Event specific props:
   * - absorb: If the buff could absorb healing (maybe there are debuffs that
   * absorb damage too?), this reflects the size of the (healing) absorb.
   * @returns {EventFilter}
   */
  get removedebuff() {
    return new EventFilter(EventType.RemoveDebuff);
  },
  get dispel() {
    return new EventFilter(EventType.Dispel);
  },
  get summon() {
    return new EventFilter(EventType.Summon);
  },
  get energize() {
    return new EventFilter(EventType.Energize);
  },
  get drain() {
    return new EventFilter(EventType.Drain);
  },
  get interrupt() {
    return new EventFilter(EventType.Interrupt);
  },
  get death() {
    return new EventFilter(EventType.Death);
  },
  get resurrect() {
    return new EventFilter(EventType.Resurrect);
  },
  get fightend() {
    return new EventFilter(EventType.FightEnd);
  },
  get phasestart() {
    return new EventFilter(EventType.PhaseStart);
  },
  get phaseend() {
    return new EventFilter(EventType.PhaseEnd);
  },
  get instakill() {
    return new EventFilter(EventType.Instakill);
  },
  get prefiltercd() {
    return new EventFilter(EventType.FilterCooldownInfo);
  },
  get prefilterbuff() {
    return new EventFilter(EventType.FilterBuffInfo);
  },
  get GlobalCooldown() {
    return new EventFilter(EventType.GlobalCooldown);
  },
  get UpdateSpellUsable() {
    return new EventFilter(EventType.UpdateSpellUsable);
  },
  get BeginChannel() {
    return new EventFilter(EventType.BeginChannel);
  },
  get EndChannel() {
    return new EventFilter(EventType.EndChannel);
  },
  get ChangeStats() {
    return new EventFilter(EventType.ChangeStats);
  },
  get ChangeHaste() {
    return new EventFilter(EventType.ChangeHaste);
  },
  get SpendResource() {
    return new EventFilter(EventType.SpendResource);
  },
  get beacontransfer() {
    return new EventFilter(EventType.BeaconTransfer);
  },
  get feedheal() {
    return new EventFilter(EventType.FeedHeal);
  },
  get any() {
    return new EventFilter(EventType.Event);
  },
  get test() {
    return new EventFilter(EventType.Test);
  },
};

export default Events;
