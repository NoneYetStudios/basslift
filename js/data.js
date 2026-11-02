/**
 * Bass Shoplifting Championship — Game Catalog, Fish Species, Disciplines, Divisions, Gear & Commentary
 */

export const RARITIES = {
  common: {
    id: 'common',
    label: 'Common',
    color: '#94a3b8',
    badgeBg: '#1e293b',
    borderColor: '#64748b',
    chanceWeight: 48,
    scoreBonus: 1.0,
    tensionSpeed: 1.0
  },
  uncommon: {
    id: 'uncommon',
    label: 'Uncommon',
    color: '#34d399',
    badgeBg: '#064e3b',
    borderColor: '#10b981',
    chanceWeight: 28,
    scoreBonus: 1.08,
    tensionSpeed: 1.18
  },
  rare: {
    id: 'rare',
    label: 'Rare',
    color: '#38bdf8',
    badgeBg: '#0c4a6e',
    borderColor: '#0284c7',
    chanceWeight: 14,
    scoreBonus: 1.18,
    tensionSpeed: 1.35
  },
  legendary: {
    id: 'legendary',
    label: 'Legendary',
    color: '#fbbf24',
    badgeBg: '#78350f',
    borderColor: '#f59e0b',
    chanceWeight: 7,
    scoreBonus: 1.32,
    tensionSpeed: 1.55
  },
  ridiculous: {
    id: 'ridiculous',
    label: 'Ridiculous',
    color: '#f43f5e',
    badgeBg: '#881337',
    borderColor: '#e11d48',
    chanceWeight: 3,
    scoreBonus: 1.5,
    tensionSpeed: 1.8
  }
};

export const FISH_SPECIES = [
  // Starter & Common
  {
    speciesId: 'starter_hatchery_bass',
    name: 'Standard-Issue Gym Bass',
    rarity: 'common',
    minWeight: 12,
    maxWeight: 22,
    awkwardness: 0.15,
    trait: 'Chalk-Dusted',
    bodyColor: '#4d7c5b',
    bellyColor: '#cbd5e1',
    finColor: '#2f523a',
    pattern: 'stripe',
    prop: 'wristband',
    depthZone: 'shallow',
    description: 'Issued by the registration desk to competitors who arrived without suspiciously wet cargo shorts.'
  },
  {
    speciesId: 'discount_smallmouth',
    name: 'Clearance-Rack Smallmouth',
    rarity: 'common',
    minWeight: 14,
    maxWeight: 28,
    awkwardness: 0.2,
    trait: 'Mildly Judgmental',
    bodyColor: '#6b705c',
    bellyColor: '#ddbea9',
    finColor: '#3f4238',
    pattern: 'spots',
    prop: 'pricetag',
    depthZone: 'shallow',
    description: 'Still has a laminated "DO NOT BENCH PRESS" sticker stuck to its dorsal fin.'
  },
  {
    speciesId: 'rotunda_bluegill_xl',
    name: 'Overfed Rotunda Panfish',
    rarity: 'common',
    minWeight: 18,
    maxWeight: 34,
    awkwardness: 0.28,
    trait: 'Round & Slippery',
    bodyColor: '#3b6978',
    bellyColor: '#f4a261',
    finColor: '#204051',
    pattern: 'bars',
    prop: 'none',
    depthZone: 'shallow',
    description: 'Survived entirely on soft pretzel crumbs dropped from the second-story viewing balcony.'
  },
  {
    speciesId: 'fountain_rock_bass',
    name: 'Ornamental Rock Bass',
    rarity: 'common',
    minWeight: 22,
    maxWeight: 42,
    awkwardness: 0.22,
    trait: 'Dense Bone Structure',
    bodyColor: '#52616b',
    bellyColor: '#c9d6df',
    finColor: '#1e2022',
    pattern: 'mottled',
    prop: 'coin',
    depthZone: 'shallow',
    description: 'Swallowed $4.75 in wished-upon quarters near the lobby waterfall.'
  },

  // Uncommon
  {
    speciesId: 'barbell_largemouth',
    name: 'Olympic-Grip Largemouth',
    rarity: 'uncommon',
    minWeight: 36,
    maxWeight: 68,
    awkwardness: 0.25,
    trait: 'Knurled Scales',
    bodyColor: '#2d6a4f',
    bellyColor: '#d8f3dc',
    finColor: '#1b4332',
    pattern: 'stripe',
    prop: 'belt',
    depthZone: 'mid',
    description: 'Remarkably ergonomic grip around the gill plate. Clearly bred for regulation Clean & Jerk.'
  },
  {
    speciesId: 'striped_kettlebass',
    name: 'Striped Kettlebass',
    rarity: 'uncommon',
    minWeight: 44,
    maxWeight: 82,
    awkwardness: 0.35,
    trait: 'Bottom-Heavy',
    bodyColor: '#3d5a80',
    bellyColor: '#e0fbfc',
    finColor: '#293241',
    pattern: 'stripes',
    prop: 'handle',
    depthZone: 'mid',
    description: 'Shaped suspiciously like a cast-iron kettlebell. Great for swings, terrible for hiding in a backpack.'
  },
  {
    speciesId: 'channel_cat_curl',
    name: 'Whiskered EZ-Curl Bass',
    rarity: 'uncommon',
    minWeight: 52,
    maxWeight: 95,
    awkwardness: 0.4,
    trait: 'Wiggly Camber',
    bodyColor: '#4a5759',
    bellyColor: '#b0c4b1',
    finColor: '#2b2d42',
    pattern: 'spots',
    prop: 'whiskers',
    depthZone: 'mid',
    description: 'Its natural spinal curve relieves wrist strain during heavy two-handed curls.'
  },
  {
    speciesId: 'creatine_crappie',
    name: 'Pre-Workout Spotted Bass',
    rarity: 'uncommon',
    minWeight: 60,
    maxWeight: 110,
    awkwardness: 0.45,
    trait: 'Jittery',
    bodyColor: '#1f7a8c',
    bellyColor: '#bfdbf7',
    finColor: '#022b3a',
    pattern: 'spots',
    prop: 'shaker',
    depthZone: 'mid',
    description: 'Someone spilled a tub of Blue Raspberry Pump-Max into Filter Tank #2 in 2024.'
  },

  // Rare
  {
    speciesId: 'trophy_peacock_bass',
    name: 'Neon Showroom Peacock Bass',
    rarity: 'rare',
    minWeight: 95,
    maxWeight: 165,
    awkwardness: 0.48,
    trait: 'Flashy & Aggressive',
    bodyColor: '#00a896',
    bellyColor: '#ffbe0b',
    finColor: '#fb5607',
    pattern: 'bars',
    prop: 'sunglasses',
    depthZone: 'mid',
    description: 'The star attraction of the mezzanine glass window. Management WILL notice if this one goes missing.'
  },
  {
    speciesId: 'cast_iron_sturgeon_bass',
    name: 'Armor-Plated Dip-Belt Bass',
    rarity: 'rare',
    minWeight: 120,
    maxWeight: 210,
    awkwardness: 0.52,
    trait: 'Aerodynamically Unfair',
    bodyColor: '#495057',
    bellyColor: '#adb5bd',
    finColor: '#212529',
    pattern: 'plates',
    prop: 'chain',
    depthZone: 'deep',
    description: 'Technically 40% calcified scale armor. Clanks audibly when set down on a wooden deadlift platform.'
  },
  {
    speciesId: 'boulder_grouper_bass',
    name: 'Granite-Jawed Showroom Bass',
    rarity: 'rare',
    minWeight: 145,
    maxWeight: 250,
    awkwardness: 0.56,
    trait: 'Stubborn Center of Mass',
    bodyColor: '#5c4d7d',
    bellyColor: '#d4c1ec',
    finColor: '#392f5a',
    pattern: 'mottled',
    prop: 'dumbbell',
    depthZone: 'deep',
    description: 'Likes to clamp onto a 45-pound bumper plate at the bottom of the tank and refuse to let go.'
  },

  // Legendary
  {
    speciesId: 'emperor_slab_bass',
    name: 'Big Bertha: The Sovereign Slab',
    rarity: 'legendary',
    minWeight: 220,
    maxWeight: 360,
    awkwardness: 0.62,
    trait: 'Requires Spotter',
    bodyColor: '#b5838d',
    bellyColor: '#ffcdb2',
    finColor: '#6d6875',
    pattern: 'crown',
    prop: 'crown',
    depthZone: 'deep',
    description: 'Has her own commemorative plaque on the second-floor railing and a personal attorney on retainer.'
  },
  {
    speciesId: 'hydraulic_leviathan',
    name: 'Forklift-Certified Goliath Bass',
    rarity: 'legendary',
    minWeight: 280,
    maxWeight: 440,
    awkwardness: 0.68,
    trait: 'OSHA Violation',
    bodyColor: '#d97706',
    bellyColor: '#fef08a',
    finColor: '#78350f',
    pattern: 'hazard',
    prop: 'hardhat',
    depthZone: 'deep',
    description: 'Legally classified as heavy warehouse machinery in 14 states. Binds the barbell into a visible arc.'
  },
  {
    speciesId: 'abyssal_powerlifter',
    name: 'Trench-Dwelling Sumo Bass',
    rarity: 'legendary',
    minWeight: 320,
    maxWeight: 495,
    awkwardness: 0.72,
    trait: 'Seismic Flop',
    bodyColor: '#1d3557',
    bellyColor: '#a8dadc',
    finColor: '#e63946',
    pattern: 'stripes',
    prop: 'belt',
    depthZone: 'deep',
    description: 'Lives behind the giant sunken fiberglass log. Feeds exclusively on lesser championship trophies.'
  },

  // Ridiculous
  {
    speciesId: 'submersible_bass_404',
    name: 'Three-Man Submersible in a Bass Suit',
    rarity: 'ridiculous',
    minWeight: 480,
    maxWeight: 720,
    awkwardness: 0.78,
    trait: 'Periscope Equipped',
    bodyColor: '#e11d48',
    bellyColor: '#fecdd3',
    finColor: '#881337',
    pattern: 'rivets',
    prop: 'periscope',
    depthZone: 'deep',
    description: 'Has riveted steel seams, a tiny brass propeller on its tail, and occasional muffled sonar pings.'
  },
  {
    speciesId: 'tectonic_megabass',
    name: 'Sir Reginald Von Slab (Structural Load-Bearing Bass)',
    rarity: 'ridiculous',
    minWeight: 600,
    maxWeight: 950,
    awkwardness: 0.84,
    trait: 'Gravitational Anomaly',
    bodyColor: '#7c3aed',
    bellyColor: '#ddd6fe',
    finColor: '#fbbf24',
    pattern: 'lightning',
    prop: 'monocle',
    depthZone: 'deep',
    description: 'Removing this specimen from the aquarium lowers the water level by four feet and voids the building insurance.'
  },
  {
    speciesId: 'continental_shelf_bass',
    name: 'The Entire Deep-End Filtration Unit (With Fins)',
    rarity: 'ridiculous',
    minWeight: 750,
    maxWeight: 1200,
    awkwardness: 0.9,
    trait: 'Bends Space-Time',
    bodyColor: '#0f172a',
    bellyColor: '#38bdf8',
    finColor: '#f43f5e',
    pattern: 'galaxy',
    prop: 'trophy',
    depthZone: 'deep',
    description: 'Judges aren’t sure if you lifted the fish or pushed the planet downward by thirty-six inches.'
  }
];

export const DISCIPLINES = [
  {
    id: 'clean_jerk',
    name: 'Clean & Jerk',
    shortName: 'Clean & Jerk',
    icon: '🏋️',
    multiplier: 1.15,
    mechanicTag: 'Two-Stage Catch & Split Jerk',
    summary: 'Two distinct stages: pull & rack the bass onto your shoulders, then time the converging split-jerk overhead!',
    instructions: [
      'STAGE 1 (THE CLEAN): Hold or press [SPACE / ACTION] to launch the pull meter upward, then click/press when the bar hits the green SHOULDER RACK zone.',
      'STAGE 2 (THE JERK): With the bass flopping on your shoulders, wait for the two horizontal split-stance markers to converge in the center bullseye and hit [SPACE / ACTION]!'
    ]
  },
  {
    id: 'snatch',
    name: 'Snatch',
    shortName: 'Snatch',
    icon: '⚡',
    multiplier: 1.25,
    mechanicTag: 'Continuous Velocity Curve Trace',
    summary: 'One continuous explosive sweep from floor to overhead! Keep your upward thrust inside the moving S-curve channel.',
    instructions: [
      'Hold [SPACE / UP / THRUST BUTTON] to accelerate the bar upward; release to let it coast.',
      'Keep the Fish Marker inside the sweeping Momentum Window as it rises from 0% to 100% height in one uninterrupted motion!'
    ]
  },
  {
    id: 'dumbbell',
    name: 'Dumbbell Lift',
    shortName: 'Twin-Bass Curl',
    icon: '💪',
    multiplier: 1.2,
    mechanicTag: 'Dual-Hand Independent Balance',
    summary: 'One fish in EACH hand! Pump Left and Right arms independently while keeping both bass level and synchronized.',
    instructions: [
      'Use [A / LEFT] to curl your Left-hand fish and [D / RIGHT] (or the L/R buttons) to curl your Right-hand fish.',
      'Both fish fight back at different speeds! Keep the tilt angle under 25° while raising both arms to 100% lockout.'
    ]
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    shortName: 'Deadlift',
    icon: '🦍',
    multiplier: 1.1,
    mechanicTag: 'Hydraulic Drive & Lockout Window',
    summary: 'Build raw pulling torque against gravity to haul the bass past your knees, then nail the upright lockout!',
    instructions: [
      'Rapidly tap [SPACE / PULL] to build upward bar height against the fish’s heavy downward gravity.',
      'Once the bar enters the top LOCKOUT ZONE (85%–96%), hit the [LOCK OUT!] button or hold steady—do NOT over-pull past 100% (hitching fault)!'
    ]
  },
  {
    id: 'bench',
    name: 'Bench Press',
    shortName: 'Bench Press',
    icon: '🛋️',
    multiplier: 1.18,
    mechanicTag: 'Controlled Descent, Pause & Drive',
    summary: 'Feather the brake as you lower the bass to your chest, wait for the referee’s PRESS command, then drive it up!',
    instructions: [
      'PHASE 1 (LOWERING): Hold [SPACE / BRAKE] intermittently to keep descent speed in the green SAFE CONTROL zone until the fish touches your chest.',
      'PHASE 2 (PAUSE & PRESS): Wait for the Judge’s green "PRESS!" signal (don’t jump the command!), then hit the sweet-spot drive meter!'
    ]
  },
  {
    id: 'overhead',
    name: 'Overhead Press',
    shortName: 'Strict Overhead',
    icon: '🗽',
    multiplier: 1.3,
    mechanicTag: 'Sustained Overhead Pendulum Stability',
    summary: 'Press the slippery bass overhead and counter-steer its wild shifting center of gravity for 4 full seconds!',
    instructions: [
      'Steer Left [A / ◀] and Right [D / ▶] to counteract the thrashing bass’s torque overhead.',
      'Keep the balance indicator inside the central Stability Cone until all 3 White Referee Lights illuminate!'
    ]
  }
];

export const DIVISIONS = [
  {
    id: 'lightweight',
    name: 'Lightweight Division',
    shortName: 'Lightweight',
    badge: '🥉',
    prerequisiteDivisionId: null,
    prerequisiteDivisionName: null,
    minRecommendedWeight: 12,
    qualifyingScore: 0,
    targetChampionshipScore: 450,
    multiplier: 1.0,
    difficultyScale: 0.85,
    rewardTitle: 'Puddle-Weight Champion',
    trophyName: 'Bronze Crappie Chalice',
    description: 'Entry-level amateur division. Ideal for hatchery bass and slightly damp gym bags.'
  },
  {
    id: 'middleweight',
    name: 'Middleweight Division',
    shortName: 'Middleweight',
    badge: '🥈',
    prerequisiteDivisionId: 'lightweight',
    prerequisiteDivisionName: 'Lightweight',
    minRecommendedWeight: 35,
    qualifyingScore: 450,
    targetChampionshipScore: 1150,
    multiplier: 1.25,
    difficultyScale: 1.0,
    rewardTitle: 'Varsity Bass Handler',
    trophyName: 'Silver Gill-Plate Goblet',
    description: 'Requires 450+ pts in Lightweight. The fish are heavier, wetter, and significantly less cooperative.'
  },
  {
    id: 'heavyweight',
    name: 'Heavyweight Division',
    shortName: 'Heavyweight',
    badge: '🥇',
    prerequisiteDivisionId: 'middleweight',
    prerequisiteDivisionName: 'Middleweight',
    minRecommendedWeight: 85,
    qualifyingScore: 1150,
    targetChampionshipScore: 2600,
    multiplier: 1.55,
    difficultyScale: 1.16,
    rewardTitle: 'Heavyweight Bass Monarch',
    trophyName: 'Golden Largemouth Obelisk',
    description: 'Requires 1,150+ pts in Middleweight. Serious aquatic iron. Reinforcement bolts required on the platform.'
  },
  {
    id: 'super_heavyweight',
    name: 'Super Heavyweight',
    shortName: 'Super Heavy',
    badge: '💎',
    prerequisiteDivisionId: 'heavyweight',
    prerequisiteDivisionName: 'Heavyweight',
    minRecommendedWeight: 180,
    qualifyingScore: 2600,
    targetChampionshipScore: 5200,
    multiplier: 1.9,
    difficultyScale: 1.32,
    rewardTitle: 'Grandmaster of Gill & Iron',
    trophyName: 'Platinum Leviathan Kettlebell',
    description: 'Requires 2,600+ pts in Heavyweight. Only deep-tank contraband and structural anomalies can compete here.'
  },
  {
    id: 'unlimited',
    name: 'Unlimited Open Class',
    shortName: 'Unlimited',
    badge: '👑',
    prerequisiteDivisionId: 'super_heavyweight',
    prerequisiteDivisionName: 'Super Heavyweight',
    minRecommendedWeight: 350,
    qualifyingScore: 5200,
    targetChampionshipScore: 9500,
    multiplier: 2.4,
    difficultyScale: 1.48,
    rewardTitle: 'Supreme Aquarium Shoplifter & Sovereign of Slab',
    trophyName: 'The Two-Story Acrylic Crown',
    description: 'Requires 5,200+ pts in Super Heavyweight. Zero weight limits. Zero explanations to store security.'
  }
];

export const EQUIPMENT_ITEMS = [
  {
    id: 'gear_chalk_bucket',
    name: 'Tartar-Sauce Magnesia Chalk',
    slot: 'gloves',
    icon: '🧤',
    unlockCondition: 'Starter Equipment',
    unlockCheck: () => true,
    stabilityBonus: 0.04,
    scoreBonus: 1.0,
    description: 'Standard gym chalk mixed with lemon zest. Reduces gill-slime slippage by 4%.'
  },
  {
    id: 'gear_neoprene_gloves',
    name: 'Kevlar Noodle-Grippers',
    slot: 'gloves',
    icon: '🥊',
    unlockCondition: 'Catch 3 fish from the aquarium',
    unlockCheck: (state) => (state.stats?.totalFishCaught || 0) >= 3,
    stabilityBonus: 0.1,
    scoreBonus: 1.04,
    description: 'Vulcanized rubber palms designed for hoisting uncooperative 200-lb river monsters.'
  },
  {
    id: 'gear_leather_belt',
    name: '4-Inch Tacklebox Lifting Belt',
    slot: 'belt',
    icon: 'ベルト',
    displayIcon: '🧷',
    unlockCondition: 'Win the Lightweight Division Championship',
    unlockCheck: (state) => Boolean(state.divisionsWon?.lightweight),
    stabilityBonus: 0.08,
    scoreBonus: 1.06,
    description: 'Genuine weight belt with built-in compartments for plastic worms and lumbar support.'
  },
  {
    id: 'gear_championship_belt',
    name: '24-Karat Bass Buckle Belt',
    slot: 'belt',
    icon: '🏆',
    displayIcon: '👑',
    unlockCondition: 'Win the Heavyweight Division Championship',
    unlockCheck: (state) => Boolean(state.divisionsWon?.heavyweight),
    stabilityBonus: 0.14,
    scoreBonus: 1.12,
    description: 'Features a spinning solid-brass largemouth buckle that intimidates both judges and gravity.'
  },
  {
    id: 'gear_oak_platform',
    name: 'Reinforced Dock-Timber Platform',
    slot: 'platform',
    icon: '🪵',
    unlockCondition: 'Lift a fish weighing at least 100 lbs',
    unlockCheck: (state) => (state.records?.heaviestFishLifted || 0) >= 100,
    stabilityBonus: 0.08,
    scoreBonus: 1.05,
    description: 'Reclaimed marina planks capable of absorbing catastrophic fish-drop shockwaves.'
  },
  {
    id: 'gear_trench_coat',
    name: 'Suspiciously Bulky Trench Coat',
    slot: 'accessory',
    icon: '🧥',
    unlockCondition: 'Get cited by Aquarium Security once',
    unlockCheck: (state) => (state.stats?.timesCaughtByGuard || 0) >= 1,
    stabilityBonus: 0.06,
    scoreBonus: 1.08,
    description: 'Waterproof inner pockets rated up to 400 lbs. Drips slightly during the national anthem.'
  }
];

export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    name: 'First Blood (Slightly Fishy)',
    icon: '🏋️',
    description: 'Complete your first valid lift in any discipline.'
  },
  {
    id: 'gone_fishing',
    name: 'Gone Fishing',
    icon: '🎣',
    description: 'Click the prominent NO FISHING sign and successfully poach a fish from the indoor aquarium.'
  },
  {
    id: 'big_bass',
    name: "That's a Big Bass",
    icon: '🐟',
    description: 'Catch or own a fish weighing 100 lbs or more.'
  },
  {
    id: 'the_heavyweight',
    name: 'The Heavyweight',
    icon: '🥇',
    description: 'Win the Heavyweight Division Championship.'
  },
  {
    id: 'fish_whisperer',
    name: 'Fish Whisperer',
    icon: '✨',
    description: 'Catch a Rare, Legendary, or Ridiculous rarity fish from the aquarium.'
  },
  {
    id: 'aquarium_menace',
    name: 'Aquarium Menace',
    icon: '🚨',
    description: 'Get caught red-handed by Officer Barnaby while fishing in the aquarium.'
  },
  {
    id: 'unreasonably_strong',
    name: 'Unreasonably Strong',
    icon: '🦍',
    description: 'Successfully lift a fish weighing 250 lbs or more.'
  },
  {
    id: 'whole_aquarium',
    name: 'The Whole Aquarium',
    icon: '🪣',
    description: 'Accumulate 8 or more fish in your personal collection.'
  },
  {
    id: 'surgical_precision',
    name: 'Textbook Form (For a Fish)',
    icon: '🎯',
    description: 'Achieve 92% or higher execution quality on any valid lift.'
  },
  {
    id: 'all_around_lifter',
    name: 'Six-Tool Aqualifter',
    icon: '🎖️',
    description: 'Record a valid personal best in all 6 lifting disciplines.'
  },
  {
    id: 'ridiculous_catch',
    name: 'Structural Engineering Hazard',
    icon: '🛸',
    description: 'Acquire a fish of RIDICULOUS rarity.'
  },
  {
    id: 'unlimited_champion',
    name: 'Sovereign of Slab',
    icon: '👑',
    description: 'Win the Unlimited Open Class Championship.'
  }
];

export const COMMENTARY = {
  successHigh: [
    'Three white lights! The bass barely even had time to file a union grievance!',
    'Flawless lockout! The head judge just wiped away a single, deeply confused tear.',
    'Clinical precision! That fish went up like it owed you rent money.',
    'Textbook biomechanics! Even the aquarium security guard stopped patrolling to applaud.',
    'Supreme control! Not a single drop of tank water spilled outside the chalk circle.',
    'Magnificent! The International Federation of Questionable Fish Lifting salutes your lumbar spine.'
  ],
  successNormal: [
    'Technically, that was a lift. Two out of three judges nodded reluctantly.',
    'The fish would like to speak to management, but the lift stands!',
    'Shaky at the top, slightly damp in the middle, yet completely legal under Rule 14-B!',
    'The bass gave you a stern sideways look at lockout, but the green light is on!',
    'Valid lift! Your orthopedic surgeon just bought a second boat, but the points count.',
    'A rugged grind! The tail fin grazed your eyebrows, yet the judges allow it!'
  ],
  failure: [
    'That fish has filed a formal complaint with Human Resources.',
    'The bass was not impressed. Frankly, neither were the three judges.',
    'Your form has been reported to the Aquarium Ethics & Structural Integrity Board.',
    'No lift! The fish out-leveraged you at the sticking point and flopped back to safety.',
    'Red lights across the board! Even the plastic castle in Tank #3 winced at that attempt.',
    'Disqualified on attempt! You cannot let the bass spot you on the way up.'
  ],
  guardWarnings: [
    'Sir, this is an indoor decorative ecosystem, not a bass tournament.',
    'That four-foot aluminum NO FISHING sign is not an abstract art installation.',
    'We have 4K security footage of you tying a jighead behind the potted fern.',
    'Attention shopper: please stop making casting motions near the mezzanine glass.',
    'Security Alert: Officer Barnaby has adjusted his mustache with extreme suspicion.'
  ],
  guardBusted: [
    'BUSTED! "Sir, please return the bass to its assigned habitat and step away from the dip net."',
    'CITATION ISSUED! "You are now on the Aquarium Watchlist right between the otter incidents."',
    'CONFISCATED! "That sign is not decorative! Drop the telescopic rod and walk toward the gift shop."'
  ]
};

/**
 * Generates an inline SVG illustration of any fish specimen with custom colors, patterns, and comedic props.
 */
export function renderFishSvg(fish, options = {}) {
  const width = options.width || 220;
  const height = options.height || 110;
  const bodyColor = fish.bodyColor || '#2d6a4f';
  const bellyColor = fish.bellyColor || '#d8f3dc';
  const finColor = fish.finColor || '#1b4332';
  const rarity = RARITIES[fish.rarity] || RARITIES.common;
  const uid = (fish.id || fish.speciesId || 'fish').replace(/[^a-zA-Z0-9_-]/g, '');
  const gradId = `fish_grad_${Math.random().toString(36).slice(2, 9)}_${uid}`;

  let patternMarkup = '';
  if (fish.pattern === 'stripe' || fish.pattern === 'stripes') {
    patternMarkup = `
      <path d="M45 55 Q105 46 168 55" stroke="#112a1e" stroke-width="5" stroke-linecap="round" opacity="0.45" fill="none"/>
      <path d="M55 43 Q105 36 155 44" stroke="#112a1e" stroke-width="3" stroke-linecap="round" opacity="0.3" fill="none"/>
    `;
  } else if (fish.pattern === 'spots' || fish.pattern === 'mottled') {
    patternMarkup = `
      <circle cx="75" cy="48" r="4" fill="#0f172a" opacity="0.38"/>
      <circle cx="95" cy="42" r="5" fill="#0f172a" opacity="0.35"/>
      <circle cx="115" cy="50" r="4.5" fill="#0f172a" opacity="0.38"/>
      <circle cx="135" cy="44" r="3.8" fill="#0f172a" opacity="0.35"/>
      <circle cx="105" cy="58" r="3.5" fill="#0f172a" opacity="0.3"/>
    `;
  } else if (fish.pattern === 'bars' || fish.pattern === 'hazard') {
    const barColor = fish.pattern === 'hazard' ? '#111827' : '#0f172a';
    patternMarkup = `
      <path d="M72 30 L68 72" stroke="${barColor}" stroke-width="6" opacity="0.4" stroke-linecap="round"/>
      <path d="M98 27 L94 74" stroke="${barColor}" stroke-width="6" opacity="0.4" stroke-linecap="round"/>
      <path d="M124 29 L120 72" stroke="${barColor}" stroke-width="6" opacity="0.4" stroke-linecap="round"/>
      <path d="M148 34 L144 68" stroke="${barColor}" stroke-width="5" opacity="0.4" stroke-linecap="round"/>
    `;
  } else if (fish.pattern === 'plates' || fish.pattern === 'rivets') {
    patternMarkup = `
      <rect x="68" y="38" width="18" height="26" rx="3" fill="none" stroke="#e2e8f0" stroke-width="1.8" opacity="0.55"/>
      <rect x="92" y="36" width="20" height="28" rx="3" fill="none" stroke="#e2e8f0" stroke-width="1.8" opacity="0.55"/>
      <rect x="118" y="38" width="18" height="26" rx="3" fill="none" stroke="#e2e8f0" stroke-width="1.8" opacity="0.55"/>
      <circle cx="64" cy="42" r="2" fill="#f8fafc"/>
      <circle cx="144" cy="42" r="2" fill="#f8fafc"/>
    `;
  } else if (fish.pattern === 'lightning' || fish.pattern === 'galaxy' || fish.pattern === 'crown') {
    patternMarkup = `
      <path d="M62 48 L88 38 L84 52 L118 40 L112 55 L148 44" stroke="${rarity.color}" stroke-width="3" fill="none" opacity="0.85"/>
      <circle cx="78" cy="60" r="2.2" fill="#fff" opacity="0.8"/>
      <circle cx="128" cy="36" r="2.5" fill="#fff" opacity="0.8"/>
    `;
  }

  let propMarkup = '';
  if (fish.prop === 'crown') {
    propMarkup = `<polygon points="128,22 134,8 142,17 150,7 157,17 164,9 166,24" fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>`;
  } else if (fish.prop === 'hardhat') {
    propMarkup = `
      <path d="M132 24 C132 9, 166 9, 166 24 Z" fill="#facc15" stroke="#713f12" stroke-width="1.8"/>
      <line x1="127" y1="24" x2="171" y2="24" stroke="#eab308" stroke-width="3" stroke-linecap="round"/>
    `;
  } else if (fish.prop === 'periscope') {
    propMarkup = `
      <path d="M112 26 L112 6 L128 6" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="130" cy="6" r="3.5" fill="#38bdf8" stroke="#1e293b" stroke-width="1.5"/>
    `;
  } else if (fish.prop === 'belt') {
    // Tail-cuff championship belt: wrapped around caudal peduncle so it never bisects or obscures the fish body
    propMarkup = `
      <g class="fish-championship-belt">
        <rect x="36" y="44" width="8" height="16" rx="2" fill="#451a03" stroke="#fbbf24" stroke-width="1.4"/>
        <rect x="34" y="48" width="12" height="8" rx="1.5" fill="#fbbf24" stroke="#78350f" stroke-width="1.2"/>
      </g>
    `;
  } else if (fish.prop === 'pricetag') {
    propMarkup = `
      <line x1="88" y1="22" x2="72" y2="10" stroke="#cbd5e1" stroke-width="1.5"/>
      <rect x="50" y="3" width="26" height="14" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>
      <text x="63" y="13" font-size="7" font-family="monospace" text-anchor="middle" fill="#713f12" font-weight="bold">SALE</text>
    `;
  } else if (fish.prop === 'sunglasses') {
    propMarkup = `
      <rect x="150" y="36" width="14" height="9" rx="2" fill="#0f172a" stroke="#f8fafc" stroke-width="1.2"/>
      <line x1="136" y1="39" x2="150" y2="39" stroke="#f8fafc" stroke-width="1.5"/>
    `;
  } else if (fish.prop === 'monocle') {
    propMarkup = `
      <circle cx="158" cy="42" r="7.5" fill="rgba(56,189,248,0.25)" stroke="#fbbf24" stroke-width="2"/>
      <path d="M158 49 Q154 65 146 72" stroke="#fbbf24" stroke-width="1.2" fill="none"/>
    `;
  }

  // Athletic Competition Weight Stencil (unobtrusive, crisp, preserves full fish silhouette and surface)
  const roundedWeight = Math.round(Number(fish.weight) || 20);
  const weightStampMarkup = `
    <!-- Athletic Competition Weight Stencil -->
    <g class="fish-weight-stamp" opacity="0.88">
      <text x="102" y="55" font-family="'Impact', 'Arial Black', sans-serif" font-size="9.5" fill="#f8fafc" stroke="#0f172a" stroke-width="0.8" text-anchor="middle" font-weight="900" letter-spacing="0.5">${roundedWeight} LB</text>
    </g>
  `;

  // Visual Worldbuilding & Rarity Accents (clean silhouettes that do not break the body outline)
  let rarityFlairs = '';
  if (fish.rarity === 'rare') {
    rarityFlairs = `
      <!-- IFA-IRON Official Competition Certification Fin Tag -->
      <g transform="translate(112, 16)" class="competition-tag">
        <polygon points="0,0 16,0 12,10 0,10" fill="#fbbf24" stroke="#78350f" stroke-width="0.8"/>
        <text x="7.5" y="7" font-size="3.5" font-weight="900" fill="#78350f" text-anchor="middle" font-family="monospace">IFA</text>
      </g>
    `;
  } else if (fish.rarity === 'legendary') {
    rarityFlairs = `
      <!-- Golden Shimmer Sparkles outside main body -->
      <polygon points="46,30 48,24 50,30 56,32 50,34 48,40 46,34 40,32" fill="#fde047" opacity="0.9"/>
      <polygon points="165,22 166.5,17 168,22 173,23.5 168,25 166.5,30 165,25 160,23.5" fill="#fde047" opacity="0.9"/>
    `;
  } else if (fish.rarity === 'ridiculous') {
    const beltAlreadyPresent = fish.prop === 'belt';
    rarityFlairs = `
      ${!beltAlreadyPresent ? `
        <!-- Heavyweight Championship Golden Tail Cuff -->
        <g class="fish-championship-belt">
          <rect x="36" y="44" width="8" height="16" rx="2" fill="#18181b" stroke="#fbbf24" stroke-width="1.4"/>
          <ellipse cx="40" cy="52" rx="4" ry="4" fill="#f59e0b" stroke="#78350f" stroke-width="1"/>
          <text x="40" y="54" font-size="3.5" font-weight="bold" fill="#fff" text-anchor="middle">👑</text>
        </g>
      ` : ''}
      <!-- Celestial Sparkles for Ridiculous Contraband outside body -->
      <polygon points="34,22 36,16 38,22 44,24 38,26 36,32 34,26 28,24" fill="#fbbf24" opacity="0.95"/>
      <polygon points="175,32 177,26 179,32 185,34 179,36 177,42 175,36 169,34" fill="#fbbf24" opacity="0.95"/>
      <polygon points="135,12 136.5,7 138,12 143,13.5 138,15 136.5,20 135,15 130,13.5" fill="#f43f5e" opacity="0.95"/>
      <polygon points="58,68 59.5,63 61,68 66,69.5 61,71 59.5,76 58,71 53,69.5" fill="#38bdf8" opacity="0.9"/>
    `;
  }

  return `
    <svg viewBox="0 0 210 100" width="${width}" height="${height}" class="fish-svg" role="img" aria-label="${fish.name}">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bodyColor}"/>
          <stop offset="65%" stop-color="${bodyColor}"/>
          <stop offset="100%" stop-color="${bellyColor}"/>
        </linearGradient>
      </defs>

      <!-- 1. 100% OPAQUE SOLID MASS UNDERLAY (blocks athlete, mats, and background objects behind the fish) -->
      <g class="fish-solid-mass">
        <!-- Solid Tail Base -->
        <path d="M42 52 L12 24 C18 42, 18 62, 12 80 Z" fill="${finColor}"/>
        <!-- Solid Dorsal Fin Base -->
        <path d="M68 29 Q95 10 128 27 Z" fill="${finColor}"/>
        <path d="M52 34 Q60 18 72 29 Z" fill="${finColor}"/>
        <!-- Solid Ventral Fin Base -->
        <path d="M72 74 Q88 92 108 76 Z" fill="${finColor}"/>
        <!-- Solid Torso Foundation (Opaque Heavy Core) -->
        <path d="M36 52 C52 20, 142 18, 178 46 C188 54, 184 65, 170 72 C136 86, 56 84, 36 52 Z" fill="${bodyColor}" stroke="${bodyColor}" stroke-width="3"/>
      </g>

      <!-- 2. ANATOMICAL FINS WITH INTERNAL RAYS -->
      <!-- Tail Fin -->
      <path d="M42 52 L12 24 C18 42, 18 62, 12 80 Z" fill="${finColor}" stroke="#0f172a" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M40 52 L16 34 M38 52 L15 52 M40 52 L16 70" stroke="#0f172a" stroke-width="1.4" opacity="0.4" stroke-linecap="round"/>
      <!-- Dorsal Spines & Fin -->
      <path d="M68 29 Q95 10 128 27 Z" fill="${finColor}" stroke="#0f172a" stroke-width="2.4"/>
      <path d="M78 26 L84 18 M94 24 L102 16 M110 25 L118 20" stroke="#0f172a" stroke-width="1.3" opacity="0.4" stroke-linecap="round"/>
      <path d="M52 34 Q60 18 72 29 Z" fill="${finColor}" stroke="#0f172a" stroke-width="2.2"/>
      <!-- Ventral Fin -->
      <path d="M72 74 Q88 92 108 76 Z" fill="${finColor}" stroke="#0f172a" stroke-width="2.2"/>

      <!-- 3. SOLID MAIN TORSO (Opaque Body Fill + Volume Shading) -->
      <path d="M36 52 C52 20, 142 18, 178 46 C188 54, 184 65, 170 72 C136 86, 56 84, 36 52 Z" fill="${bodyColor}"/>
      <path d="M36 52 C52 20, 142 18, 178 46 C188 54, 184 65, 170 72 C136 86, 56 84, 36 52 Z" fill="url(#${gradId})" stroke="#0f172a" stroke-width="3"/>

      <!-- 4. HEAVY DORSAL MASS & OPAQUE UNDERBELLY (Tangible, substantial fish flesh) -->
      <!-- Muscular Dorsal Arch (top-heavy bulk) -->
      <path d="M38 50 C54 24, 136 22, 172 47 C152 38, 106 36, 62 43 C46 46, 40 48, 38 50 Z" fill="${finColor}" opacity="0.45"/>
      <!-- Solid Opaque Underbelly Slab -->
      <path d="M40 54 C62 76, 134 82, 172 68 C158 75, 108 79, 58 68 C46 64, 40 59, 40 54 Z" fill="${bellyColor}"/>
      <path d="M54 62 C80 78, 126 80, 156 71 C132 77, 88 77, 54 62 Z" fill="${bellyColor}" opacity="0.9"/>
      <!-- Heavy Lateral Muscle Line -->
      <path d="M48 53 Q108 47 166 54" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>

      ${patternMarkup}

      <!-- 5. GILL PLATE, JAW & EXPRESSIVE EYE -->
      <path d="M142 36 Q134 54 144 70" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M178 52 L162 57 Q170 64 176 64" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Pectoral Fin (in front of gill) -->
      <path d="M132 58 Q114 68 120 79 Q136 74 138 62 Z" fill="${finColor}" stroke="#0f172a" stroke-width="2"/>
      <path d="M134 60 L122 74 M132 63 L126 77" stroke="#0f172a" stroke-width="1.2" opacity="0.4" stroke-linecap="round"/>
      <!-- Eye: Large, expressive, bold contrast -->
      <circle cx="158" cy="42" r="6" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
      <circle cx="160" cy="42" r="3" fill="#0f172a"/>
      <circle cx="161.5" cy="40.5" r="1.2" fill="#ffffff"/>

      ${weightStampMarkup}
      ${rarityFlairs}
      ${propMarkup}
    </svg>
  `.trim();
}

/**
 * Creates a concrete fish instance from a species template.
 */
export function instantiateFish(species, options = {}) {
  const sp = typeof species === 'string'
    ? FISH_SPECIES.find((s) => s.speciesId === species) || FISH_SPECIES[0]
    : species;

  const weightRatio = typeof options.weightRatio === 'number'
    ? Math.max(0, Math.min(1, options.weightRatio))
    : Math.random();

  const rawWeight = sp.minWeight + weightRatio * (sp.maxWeight - sp.minWeight);
  const weight = Math.round(rawWeight * 10) / 10;

  return {
    id: options.id || `fish_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    speciesId: sp.speciesId,
    name: sp.name,
    rarity: sp.rarity,
    weight,
    awkwardness: sp.awkwardness,
    trait: sp.trait,
    bodyColor: sp.bodyColor,
    bellyColor: sp.bellyColor,
    finColor: sp.finColor,
    pattern: sp.pattern,
    prop: sp.prop,
    depthZone: sp.depthZone,
    description: sp.description,
    caughtAt: options.caughtAt || new Date().toISOString(),
    isNew: Boolean(options.isNew)
  };
}
