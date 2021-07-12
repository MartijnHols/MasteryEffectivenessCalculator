import indexById from 'common/indexById';
import { ClassResources } from 'parser/core/Events';

export interface Resource {
  id: number;
  name: string;
  icon: string;
  url: string;
}

const RESOURCE_TYPES: { [key: string]: Resource } = {
  MANA: {
    // Paladin, Priest, Shaman, Mage, Warlock, Monk, Druid
    id: 0,
    name: 'Mana',
    icon: 'inv_elemental_mote_mana',
    url: 'mana',
  },
  RAGE: {
    // Warrior, Druid
    id: 1,
    name: 'Rage',
    icon: 'spell_misc_emotionangry',
    url: 'rage',
  },
  FOCUS: {
    // Hunter and Hunter pet
    id: 2,
    name: 'Focus',
    icon: 'ability_hunter_focusfire',
    url: 'focus',
  },
  ENERGY: {
    // Rogue, Monk, Druid
    id: 3,
    name: 'Energy',
    icon: 'spell_shadow_shadowworddominate',
    url: 'energy',
  },
  COMBO_POINTS: {
    // Rogue, Druid
    id: 4,
    name: 'Combo Points',
    icon: 'inv_mace_2h_pvp410_c_01',
    url: 'combo-points',
  },
  RUNES: {
    // Death Knight
    id: 5,
    name: 'Runes',
    icon: 'spell_deathknight_frozenruneweapon',
    url: 'runes',
  },
  RUNIC_POWER: {
    // Death Knight
    id: 6,
    name: 'Runic Power',
    icon: 'inv_sword_62',
    url: 'runic-power',
  },
  SOUL_SHARDS: {
    // Warlock
    id: 7,
    name: 'Soul Shards',
    icon: 'inv_misc_gem_amethyst_02',
    url: 'soul-shards',
  },
  ASTRAL_POWER: {
    // Druid
    id: 8,
    name: 'Astral Power',
    icon: 'ability_druid_eclipseorange',
    url: 'astral-power',
  },
  HOLY_POWER: {
    // Paladin
    id: 9,
    name: 'Holy Power',
    icon: 'achievement_bg_winsoa',
    url: 'holy-power',
  },
  ALTERNATE_POWER: {
    // Used for encounter-specific resources like Torment on Demonic Inqusition
    id: 10,
    name: 'Alternate Power',
    icon: 'trade_engineering',
    url: '',
  },
  MAELSTROM: {
    // Shaman
    id: 11,
    name: 'Maelstrom',
    icon: 'spell_fire_masterofelements',
    url: 'maelstrom',
  },
  CHI: {
    // Monk
    id: 12,
    name: 'Chi',
    icon: 'ability_monk_healthsphere',
    url: 'chi',
  },
  INSANITY: {
    // Priest
    id: 13,
    name: 'Insanity',
    icon: 'spell_priest_shadoworbs',
    url: 'insanity',
  },
  // 14 is obsolete
  // 15 is obsolete
  ARCANE_CHARGES: {
    // Mage
    id: 16,
    name: 'Arcane Charges',
    icon: 'spell_arcane_arcane01',
    url: 'arcane-charges',
  },
  FURY: {
    // Demon Hunter
    id: 17,
    name: 'Fury',
    icon: 'ability_demonhunter_eyebeam',
    url: 'fury',
  },
  PAIN: {
    // Demon Hunter
    id: 18,
    name: 'Pain',
    icon: 'ability_demonhunter_demonspikes',
    url: 'pain',
  },
};
export default indexById(RESOURCE_TYPES);

export function getResource(classResources: ClassResources[] | undefined, type: number) {
  if (!classResources) {
    return undefined;
  }
  return classResources.find((resource) => resource.type === type);
}
