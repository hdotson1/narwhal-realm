const W=800,H=600;
const CANVAS_SCALE=Math.max(Math.ceil(window.devicePixelRatio||1),2);

// ── ART ASSETS ────────────────────────────────────────────────────────────────
// Display dimensions in canvas pixels (independent of source PNG resolution)
const NARWHAL_SIZE=80;  // square bounding box at scale=1; companions drawn at 0.55×
const ENEMY_SIZE=48;    // square
const BOSS_W=140,BOSS_H=100;
const PROJ_IMG_SIZE=36; // enemy projectile sprite display size (px)

// ── UNLOCK ────────────────────────────────────────────────────────────────────
const UNLOCK_CHAIN={water:null,fire:'water',earth:'fire',air:'earth'};

// ── REALMS ────────────────────────────────────────────────────────────────────
const REALMS={
  hub:  {name:'Hub Realm',   bg:['#003366','#001833'],accent:'#00aaff'},
  water:{name:'Water Realm', bg:['#001428','#000a18'],accent:'#00aaff'},
  fire: {name:'Fire Realm',  bg:['#220800','#110300'],accent:'#ff5500'},
  earth:{name:'Earth Realm', bg:['#071400','#030a00'],accent:'#44bb00'},
  air:  {name:'Air Realm',   bg:['#0a0a22','#060614'],accent:'#88aaff'},
  void: {name:'Void Realm',  bg:['#0e000e','#060006'],accent:'#aa00ff'},
  boss: {name:'Boss Arena',  bg:['#120004','#080002'],accent:'#ff0044'},
};

// ── NARWHAL DEFS ──────────────────────────────────────────────────────────────
const NARWHAL_DEFS=[
  {id:'water',idx:0,emoji:'💧',name:'Squirt',element:'water',realm:'water',
   color:'#0088ff',damage:10,cooldown:1000,autoColor:'#00bbff',
   fact:'Narwhals live in Arctic waters and can dive over 5,000 feet deep — deeper than most submarines!',
   factTitle:'Squirt the Water Narwhal!'},
  {id:'fire', idx:1,emoji:'🔥',name:'Spark', element:'fire', realm:'fire',
   color:'#ff5511',damage:12,cooldown:1200,autoColor:'#ff6600',
   fact:'Narwhals are called the "unicorns of the sea"! Their spiral tusk is actually a tooth that can grow up to 10 feet long.',
   factTitle:'Spark the Fire Narwhal!'},
  {id:'earth',idx:2,emoji:'🍃',name:'Root',  element:'earth',realm:'earth',
   color:'#44aa00',damage:11,cooldown:1100,autoColor:'#66cc22',
   fact:'A narwhal\'s tusk has millions of tiny nerve channels that may sense water temperature, pressure, and salinity!',
   factTitle:'Root the Earth Narwhal!'},
  {id:'air',  idx:3,emoji:'💨',name:'Breeze',element:'air',  realm:'air',
   color:'#88aaff',damage:0, cooldown:3500,autoColor:'#aaccff',
   fact:'Narwhals are mammals! They use cracks in Arctic ice as breathing holes, sometimes sharing them with beluga whales.',
   factTitle:'Breeze the Air Narwhal!'},
  {id:'void', idx:4,emoji:'🌑',name:'Luma',  element:'void', realm:'void',
   color:'#8800ff',damage:60,cooldown:10000,autoColor:'#aa22ff',
   fact:'There are only about 123,000 narwhals left in the world. Climate change is melting their Arctic home!',
   factTitle:'Luma the Void Narwhal!'},
];

// ── COMPANION HP ──────────────────────────────────────────────────────────────
const COMPANION_MAX_HP=60;

// ── PLAYER ────────────────────────────────────────────────────────────────────
const PLAYER_COLOR='#c9a0ff';

// ── PORTALS ───────────────────────────────────────────────────────────────────
const PORTALS=[
  {id:'water',x:680,y:130,emoji:'💧'},
  {id:'fire', x:680,y:320,emoji:'🔥'},
  {id:'earth',x:120,y:320,emoji:'🍃'},
  {id:'air',  x:120,y:130,emoji:'💨'},
  {id:'void', x:W/2,y:H/2,emoji:'🌑'}, // center — large and menacing
];
const HUB_PORTAL={id:'hub',x:60,y:H-60,emoji:'🏠'};

// ── VOID SHOPKEEPER ───────────────────────────────────────────────────────────
const SHOPKEEPER={x:400,y:H-100}; // near the bottom of void realm (entry area)

// ── CAPTIVE NARWHALS ──────────────────────────────────────────────────────────
const CAPTIVE_POSITIONS={
  water:{x:130,y:90},fire:{x:670,y:90},
  earth:{x:100,y:110},air:{x:700,y:100},void:{x:400,y:100},
};

// ── ELEMENT COLORS / WEAKNESSES ───────────────────────────────────────────────
const ELEM_COLORS={fire:'#ff4400',water:'#0088ff',air:'#88aaff',earth:'#44aa00',void:'#8800ff'};
const BOSS_HOMING_FACTOR=0.08; // 0=no homing, 1=instant lock-on
const ELEM_WEAKNESSES={fire:'water',water:'earth',earth:'fire',air:'earth'}; // void has no weakness
const REALM_ENEMY_ELEMENT={water:'water',fire:'fire',earth:'earth',air:'air',void:'void'};
const ALL_ELEMENTS=['fire','water','air','earth','void'];

// ── CANVAS FONT TIERS ─────────────────────────────────────────────────────────
const CANVAS_FONT={
  xs:       '20px sans-serif',
  sm:       '22px Nunito,sans-serif',
  sm_bold:  'bold 23px Nunito,sans-serif',
  md:       '26px Nunito,sans-serif',
  md_bold:  'bold 26px Nunito,sans-serif',
  lg_bold:  'bold 30px Nunito,sans-serif',
  emoji_sm: '27px serif',
  emoji_md: '33px serif',
  emoji_lg: '46px serif',
};
const CANVAS_FONT_BASE_ANIM=42;
