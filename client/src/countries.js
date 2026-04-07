const COUNTRIES = [
  { id: 'france', name: 'France', flag: '🇫🇷', characteristics: [
    { id: 'france_eiffel', label: 'Eiffel Tower', emoji: '🗼' },
    { id: 'france_baguette', label: 'Baguette', emoji: '🥖' },
    { id: 'france_louvre', label: 'The Louvre', emoji: '🏛️' },
    { id: 'france_croissant', label: 'Croissant', emoji: '🥐' },
  ]},
  { id: 'japan', name: 'Japan', flag: '🇯🇵', characteristics: [
    { id: 'japan_fuji', label: 'Mt. Fuji', emoji: '🗻' },
    { id: 'japan_sushi', label: 'Sushi', emoji: '🍣' },
    { id: 'japan_cherry', label: 'Cherry Blossom', emoji: '🌸' },
    { id: 'japan_torii', label: 'Torii Gate', emoji: '⛩️' },
  ]},
  { id: 'brazil', name: 'Brazil', flag: '🇧🇷', characteristics: [
    { id: 'brazil_amazon', label: 'Amazon River', emoji: '🌿' },
    { id: 'brazil_carnival', label: 'Carnival', emoji: '🎭' },
    { id: 'brazil_christ', label: 'Christ the Redeemer', emoji: '✝️' },
    { id: 'brazil_football', label: 'Football', emoji: '⚽' },
  ]},
  { id: 'egypt', name: 'Egypt', flag: '🇪🇬', characteristics: [
    { id: 'egypt_pyramid', label: 'Pyramids', emoji: '🔺' },
    { id: 'egypt_sphinx', label: 'Sphinx', emoji: '🦁' },
    { id: 'egypt_nile', label: 'Nile River', emoji: '🏞️' },
    { id: 'egypt_pharaoh', label: 'Pharaoh', emoji: '👑' },
  ]},
  { id: 'india', name: 'India', flag: '🇮🇳', characteristics: [
    { id: 'india_taj', label: 'Taj Mahal', emoji: '🕌' },
    { id: 'india_curry', label: 'Curry', emoji: '🍛' },
    { id: 'india_yoga', label: 'Yoga', emoji: '🧘' },
    { id: 'india_elephant', label: 'Elephant', emoji: '🐘' },
  ]},
  { id: 'australia', name: 'Australia', flag: '🇦🇺', characteristics: [
    { id: 'australia_kangaroo', label: 'Kangaroo', emoji: '🦘' },
    { id: 'australia_opera', label: 'Opera House', emoji: '🏛️' },
    { id: 'australia_reef', label: 'Great Barrier Reef', emoji: '🐠' },
    { id: 'australia_boomerang', label: 'Boomerang', emoji: '🪃' },
  ]},
  { id: 'italy', name: 'Italy', flag: '🇮🇹', characteristics: [
    { id: 'italy_colosseum', label: 'Colosseum', emoji: '🏟️' },
    { id: 'italy_pizza', label: 'Pizza', emoji: '🍕' },
    { id: 'italy_venice', label: 'Venice', emoji: '🚣' },
    { id: 'italy_gelato', label: 'Gelato', emoji: '🍦' },
  ]},
  { id: 'mexico', name: 'Mexico', flag: '🇲🇽', characteristics: [
    { id: 'mexico_tacos', label: 'Tacos', emoji: '🌮' },
    { id: 'mexico_chichen', label: 'Chichen Itza', emoji: '🏛️' },
    { id: 'mexico_mariachi', label: 'Mariachi', emoji: '🎺' },
    { id: 'mexico_cactus', label: 'Cactus', emoji: '🌵' },
  ]},
  { id: 'china', name: 'China', flag: '🇨🇳', characteristics: [
    { id: 'china_wall', label: 'Great Wall', emoji: '🧱' },
    { id: 'china_panda', label: 'Panda', emoji: '🐼' },
    { id: 'china_dragon', label: 'Dragon', emoji: '🐉' },
    { id: 'china_dumpling', label: 'Dumplings', emoji: '🥟' },
  ]},
  { id: 'usa', name: 'USA', flag: '🇺🇸', characteristics: [
    { id: 'usa_statue', label: 'Statue of Liberty', emoji: '🗽' },
    { id: 'usa_hotdog', label: 'Hot Dog', emoji: '🌭' },
    { id: 'usa_canyon', label: 'Grand Canyon', emoji: '🏜️' },
    { id: 'usa_baseball', label: 'Baseball', emoji: '⚾' },
  ]},
  { id: 'kenya', name: 'Kenya', flag: '🇰🇪', characteristics: [
    { id: 'kenya_savanna', label: 'Savanna', emoji: '🌾' },
    { id: 'kenya_lion', label: 'Lion', emoji: '🦁' },
    { id: 'kenya_kilimanjaro', label: 'Kilimanjaro', emoji: '🏔️' },
    { id: 'kenya_giraffe', label: 'Giraffe', emoji: '🦒' },
  ]},
  { id: 'russia', name: 'Russia', flag: '🇷🇺', characteristics: [
    { id: 'russia_matryoshka', label: 'Matryoshka', emoji: '🪆' },
    { id: 'russia_kremlin', label: 'Kremlin', emoji: '🏰' },
    { id: 'russia_ballet', label: 'Ballet', emoji: '🩰' },
    { id: 'russia_bear', label: 'Brown Bear', emoji: '🐻' },
  ]},
  { id: 'peru', name: 'Peru', flag: '🇵🇪', characteristics: [
    { id: 'peru_machu', label: 'Machu Picchu', emoji: '🏔️' },
    { id: 'peru_llama', label: 'Llama', emoji: '🦙' },
    { id: 'peru_inca', label: 'Inca Gold', emoji: '💰' },
    { id: 'peru_quinoa', label: 'Quinoa', emoji: '🌾' },
  ]},
];

export const COUNTRIES_MAP = Object.fromEntries(COUNTRIES.map(c => [c.id, c]));
export default COUNTRIES;
