/**
 * Fictional clubs and players. This is clean-room prototype data, not original
 * Hupu game data, NBA trademarks, or the source game's artwork.
 * You can edit prices, salaries, ratings and names here.
 */
export const CLUBS = [
  { id: 'CHI', name: '芝加哥彗星', en: 'Chicago Comets', city: '芝加哥', conference: '东部', color: '#d45245', price: 45000000, fanBase: 92 },
  { id: 'NYC', name: '纽约皇冠', en: 'New York Crowns', city: '纽约', conference: '东部', color: '#e3a947', price: 41000000, fanBase: 86 },
  { id: 'BOS', name: '波士顿橡树', en: 'Boston Oaks', city: '波士顿', conference: '东部', color: '#4a9b78', price: 35000000, fanBase: 81 },
  { id: 'MIA', name: '迈阿密浪潮', en: 'Miami Tide', city: '迈阿密', conference: '东部', color: '#30a7b0', price: 33000000, fanBase: 79 },
  { id: 'ORL', name: '奥兰多星火', en: 'Orlando Sparks', city: '奥兰多', conference: '东部', color: '#7869cd', price: 29000000, fanBase: 71 },
  { id: 'ATL', name: '亚特兰大飞鹰', en: 'Atlanta Flyers', city: '亚特兰大', conference: '东部', color: '#bd7544', price: 22000000, fanBase: 65 },
  { id: 'LAX', name: '洛杉矶群星', en: 'Los Angeles Stars', city: '洛杉矶', conference: '西部', color: '#b38dca', price: 49000000, fanBase: 94 },
  { id: 'SEA', name: '西雅图高峰', en: 'Seattle Peaks', city: '西雅图', conference: '西部', color: '#478b80', price: 34000000, fanBase: 83 },
  { id: 'HOU', name: '休斯敦火箭城', en: 'Houston Orbit', city: '休斯敦', conference: '西部', color: '#d76e4d', price: 39000000, fanBase: 84 },
  { id: 'POR', name: '波特兰松林', en: 'Portland Pines', city: '波特兰', conference: '西部', color: '#6e8f5a', price: 25000000, fanBase: 69 },
  { id: 'DEN', name: '丹佛淘金者', en: 'Denver Prospectors', city: '丹佛', conference: '西部', color: '#d4a34d', price: 18000000, fanBase: 62 },
  { id: 'VAN', name: '温哥华北境', en: 'Vancouver North', city: '温哥华', conference: '西部', color: '#668fb5', price: 13000000, fanBase: 54 }
];

const FIRST_NAMES = ['Marcus', 'Andre', 'Darius', 'Jason', 'Malik', 'Victor', 'Thomas', 'Eddie', 'Damon', 'Chris', 'Aaron', 'Grant', 'Reggie', 'Isaiah', 'Cedric', 'Terry', 'Devin', 'Patrick', 'Kevin', 'Jamal', 'Derrick', 'Antoine', 'Cameron', 'Tony'];
const LAST_NAMES = ['Bennett', 'Porter', 'Coleman', 'Hayes', 'Mitchell', 'Ross', 'Brooks', 'Reed', 'Marshall', 'Cooper', 'Parker', 'Foster', 'Wallace', 'Carter', 'Miller', 'Jackson', 'Lawson', 'Bryantson', 'Davis', 'Robinson', 'Williams', 'Price', 'Turner', 'Ellis', 'Griffin', 'Harris'];
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export const PLAYERS = Array.from({length: 84}, (_, index) => {
  const club = index < 72 ? CLUBS[Math.floor(index / 6)] : null;
  const seed = (index * 41 + 17) % 101;
  const overall = Math.min(94, 62 + (seed % 30) + (index % 11 === 0 ? 3 : 0));
  const age = 20 + ((index * 7 + 3) % 15);
  const potential = Math.min(98, overall + (age < 26 ? 4 + ((index * 3) % 10) : (index % 4)));
  const salary = Math.round((180000 + Math.pow(overall - 54, 1.65) * 11500 + (age < 25 ? 0 : 180000)) / 10000) * 10000;
  const name = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(index * 7 / FIRST_NAMES.length) % LAST_NAMES.length]}`;
  return { id: `P${String(index + 1).padStart(3,'0')}`, name, position: POSITIONS[index % 5], overall, potential, age, salary, teamId: club?.id ?? null };
});

export const CLUB_BY_ID = Object.fromEntries(CLUBS.map(c => [c.id,c]));
export const PLAYER_BY_ID = Object.fromEntries(PLAYERS.map(p => [p.id,p]));
