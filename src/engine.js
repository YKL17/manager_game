import { CLUBS, PLAYERS, PLAYER_BY_ID, CLUB_BY_ID } from './data.js';

export const SAVE_KEY = 'golden-agent-1996-save-v1';
export const SAVE_FORMAT = 1;
export const CONFIG = Object.freeze({
  startingCash: 18800000,
  weeksPerSeason: 26,
  maxClients: 12,
  maxClubRoster: 12,
  scoutingCost: 75000,
  trainingCost: 250000,
  commissionRate: .06,
  agencyFeeMultiplier: 4400,
  ownershipBaseRevenue: 780000,
  trainingBonus: 1,
});

const initialNews = [
  { week: '1996 · W01', type:'公告', title:'传奇从这里开始', detail:'经纪市场刚刚开放。签约球员、积累现金，然后收购自己的球队。' },
  { week: '1996 · W01', type:'市场', title:'球队出售窗口开启', detail:'有 12 支虚构球队可供收购，收购后可签自由球员、升级场馆并参与联赛。' }
];

export function initialState() {
  return {
    format: SAVE_FORMAT, year: 1996, week: 1, tick: 0, cash: CONFIG.startingCash,
    reputation: 37, clients: ['P003','P021','P044'], ownedClubId: null,
    playerSalaries: {}, playerRatings: {}, playerTeamOverrides: {},
    lastNegotiated: {}, lastTrainingTick: -1, upgrades: {arena:0, academy:0, marketing:0},
    standings: Object.fromEntries(CLUBS.map(c => [c.id,{wins:0,losses:0,for:0,against:0}])),
    ledger: [{ tick:0, label:'创业资金', amount: CONFIG.startingCash }],
    news: initialNews.map(x => ({...x})), games: [], rng: 19960213,
    lastWeekly: null, scoutedIds: []
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function money(value) {
  const abs = Math.abs(value);
  const unit = abs >= 100000000 ? '亿' : '万';
  const num = abs >= 100000000 ? abs / 100000000 : abs / 10000;
  return `${value < 0 ? '-' : ''}$${num.toLocaleString('zh-CN',{maximumFractionDigits: abs >= 100000000 ? 2 : 1})}${unit}`;
}
export function playerSalary(state, p) { return state.playerSalaries[p.id] ?? p.salary; }
export function rating(state, p) { return state.playerRatings[p.id] ?? p.overall; }
export function currentClub(state, p) { return Object.hasOwn(state.playerTeamOverrides, p.id) ? state.playerTeamOverrides[p.id] : p.teamId; }
export function clubRoster(state, clubId) { return PLAYERS.filter(p => currentClub(state,p) === clubId); }
export function freeAgents(state) { return PLAYERS.filter(p => currentClub(state,p) === null); }
export function clientIncome(state) { return state.clients.reduce((sum,id)=> sum + playerSalary(state, PLAYER_BY_ID[id]) * CONFIG.commissionRate / CONFIG.weeksPerSeason, 0); }
export function clubStrength(state,clubId) {
  const players=clubRoster(state,clubId).map(p=>rating(state,p)).sort((a,b)=>b-a).slice(0,5);
  const average=players.length ? players.reduce((s,n)=>s+n,0)/players.length : 58;
  return Math.round(average + (clubId === state.ownedClubId ? state.upgrades.academy * 1.5 : 0));
}
export function agencyValue(state) {
  const clientValue=state.clients.reduce((v,id)=> v + playerSalary(state,PLAYER_BY_ID[id]) * .25,0);
  const clubValue=state.ownedClubId ? CLUB_BY_ID[state.ownedClubId].price * (1 + state.upgrades.arena*.07 + state.upgrades.academy*.05) : 0;
  return Math.round(state.cash+clientValue+clubValue);
}
function nextRandom(state) {state.rng = (Math.imul(state.rng,1664525)+1013904223) >>> 0; return state.rng/4294967296;}
function randomBetween(state,min,max) {return min+Math.floor(nextRandom(state)*(max-min+1));}
function addNews(state,type,title,detail) {
  state.news.unshift({week:`${state.year} · W${String(state.week).padStart(2,'0')}`,type,title,detail});
  state.news=state.news.slice(0,75);
}
function entry(state,label,amount) {
  if (!Number.isFinite(amount)) throw new Error('金额异常。');
  const rounded=Math.round(amount);
  state.cash += rounded;
  state.ledger.unshift({tick:state.tick,label,amount:rounded});
  state.ledger=state.ledger.slice(0,150);
}
function ensure(condition,error) {if(!condition) throw new Error(error);}
export function signClientCost(p) { return Math.round((22000 + Math.max(0,p.overall - 60) * CONFIG.agencyFeeMultiplier)/1000)*1000; }
export function signingBonus(state,p){return Math.round(playerSalary(state,p)*.30/10000)*10000;}
export function upgradeCost(kind,level){return Math.round(({arena:850000,academy:670000,marketing:420000}[kind] || 0) * (level+1) * (1+level*.2));}
export function simulateScore(state,homeId,awayId){
  const h=clubStrength(state,homeId),a=clubStrength(state,awayId);
  const home=Math.round(89 + (h-72)*1.1 + randomBetween(state,-19,20) + 3);
  const away=Math.round(89 + (a-72)*1.1 + randomBetween(state,-19,20));
  return {home:home === away ? home+1 : home, away};
}
function playLeagueRound(state){
  let playerGames=[];
  for(let round=0;round<2;round++) {
    let teamIds=CLUBS.map(t=>t.id);
    for(let i=teamIds.length-1;i>0;i--){const j=randomBetween(state,0,i);[teamIds[i],teamIds[j]]=[teamIds[j],teamIds[i]];}
    for(let i=0;i<teamIds.length;i+=2){
      const homeId=teamIds[i],awayId=teamIds[i+1];
      const score=simulateScore(state,homeId,awayId);
      const homeWon=score.home>score.away;
      let sh=state.standings[homeId],sa=state.standings[awayId];
      sh.wins+=homeWon?1:0;sh.losses+=homeWon?0:1;sh.for+=score.home;sh.against+=score.away;
      sa.wins+=homeWon?0:1;sa.losses+=homeWon?1:0;sa.for+=score.away;sa.against+=score.home;
      if(state.ownedClubId === homeId || state.ownedClubId === awayId){
        playerGames.push({homeId,awayId,home:score.home,away:score.away,win:state.ownedClubId===(homeWon?homeId:awayId),tick:state.tick});
      }
    }
  }
  state.games=playerGames.concat(state.games).slice(0,28);
  return playerGames;
}
function maybeRandomEvent(state){
  if(nextRandom(state)>.27) return;
  const events=[
    { title:'赞助商主动接触', amount:135000, rep:1, detail:'一笔临时赞助资金到账。' },
    { title:'商业合作遇阻', amount:-75000, rep:0, detail:'本周推广活动额外产生支出。' },
    { title:'新人经纪人专访', amount:0, rep:3, detail:'媒体专访提升了公司声誉。' },
    { title:'球员慈善赛', amount:-38000, rep:2, detail:'你赞助了一场社区慈善赛。' },
    { title:'老客户推荐业务', amount:94000, rep:1, detail:'老客户带来了新的品牌合作。' }
  ];
  const e=events[randomBetween(state,0,events.length-1)];
  if(e.amount) entry(state,e.title,e.amount);
  state.reputation=clamp(state.reputation+e.rep,0,100);
  addNews(state,'事件',e.title,e.detail);
}

/** Pure from caller's perspective: returns a new state, or throws without mutation. */
export function reduceGame(original, action) {
  const state=structuredClone(original);
  const p=action.playerId ? PLAYER_BY_ID[action.playerId] : null;
  const c=action.clubId ? CLUB_BY_ID[action.clubId] : null;
  switch(action.type){
    case 'SIGN_CLIENT': {
      ensure(p,'找不到这个球员。'); ensure(!state.clients.includes(p.id),'这名球员已经是你的客户。');
      ensure(state.clients.length<CONFIG.maxClients,'客户名额已满。');
      const cost=signClientCost(p); ensure(state.cash>=cost,'资金不足，无法支付签约费用。');
      entry(state,`签约 ${p.name}`,-cost);state.clients.push(p.id);state.reputation=clamp(state.reputation+1,0,100);
      addNews(state,'经纪',`正式签约 ${p.name}`,`经纪公司新增一名 ${p.position} 球员客户，年薪 ${money(playerSalary(state,p))}。`);break;
    }
    case 'NEGOTIATE': {
      ensure(p && state.clients.includes(p.id),'只能为自己的客户谈判。');
      ensure(state.tick-(state.lastNegotiated[p.id]??-5)>=4,'该球员刚完成谈判，至少间隔 4 周。');
      state.lastNegotiated[p.id]=state.tick;
      const succeeded=nextRandom(state)<clamp(.38+state.reputation*.005,0,.88);
      if(succeeded){ const old=playerSalary(state,p);const next=Math.round(old*1.11/10000)*10000;state.playerSalaries[p.id]=next;state.reputation=clamp(state.reputation+2,0,100);addNews(state,'经纪',`${p.name} 成功加薪`,`新合同年薪 ${money(next)}，你的经纪佣金将随之提高。`); }
      else {state.reputation=clamp(state.reputation-1,0,100);addNews(state,'经纪',`${p.name} 谈判暂未成功`,'本次未达成新合同，四周后可以再次尝试。');}
      break;
    }
    case 'SCOUT': {
      ensure(state.cash>=CONFIG.scoutingCost,'球探经费不足。');entry(state,'球探调研',-CONFIG.scoutingCost);
      const free=freeAgents(state).filter(x=>!state.scoutedIds.includes(x.id)).sort((a,b)=>b.potential-a.potential);
      let candidates=[];
      for(let i=0;i<3 && free.length;i++){
        const max=Math.min(8,free.length), index=randomBetween(state,0,max-1);
        candidates.push(free.splice(index,1)[0]);
      }
      state.scoutedIds.push(...candidates.map(p=>p.id));
      addNews(state,'球探','球探报告已更新',candidates.length ? `重点推荐：${candidates.map(p=>p.name).join('、')}。` : '自由市场中的球员已经全部考察。');break;
    }
    case 'BUY_CLUB': {
      ensure(c,'球队不存在。');ensure(!state.ownedClubId,'你已经拥有一家球队。');ensure(state.cash>=c.price,'现金不足，无法完成球队收购。');
      entry(state,`收购 ${c.name}`,-c.price);state.ownedClubId=c.id;state.reputation=clamp(state.reputation+10,0,100);
      addNews(state,'老板',`你正式接手 ${c.name}`,`以 ${money(c.price)} 收购俱乐部。现在可以进行自由球员签约、设施建设和比赛管理。`);break;
    }
    case 'SIGN_TEAM_PLAYER': {
      ensure(state.ownedClubId,'请先收购一支球队。');ensure(p && currentClub(state,p)===null,'只可以签下自由球员。');
      ensure(clubRoster(state,state.ownedClubId).length<CONFIG.maxClubRoster,'球队阵容已满。');
      const bonus=signingBonus(state,p);ensure(state.cash>=bonus,'资金不足，无法支付签字费。');
      entry(state,`签字费 ${p.name}`,-bonus);state.playerTeamOverrides[p.id]=state.ownedClubId;
      addNews(state,'转会',`${p.name} 加盟 ${CLUB_BY_ID[state.ownedClubId].name}`,`签字费 ${money(bonus)}，年薪 ${money(playerSalary(state,p))}。`);break;
    }
    case 'TRAIN': {
      ensure(state.ownedClubId,'请先收购球队。');ensure(state.lastTrainingTick!==state.tick,'每周只能组织一次特训。');
      ensure(state.cash>=CONFIG.trainingCost,'训练资金不足。');
      entry(state,'球队专项训练',-CONFIG.trainingCost);state.lastTrainingTick=state.tick;
      const roster=clubRoster(state,state.ownedClubId).slice().sort((a,b)=>rating(state,a)-rating(state,b)).slice(0,5);
      roster.forEach(p=>state.playerRatings[p.id]=clamp(rating(state,p)+CONFIG.trainingBonus,0,p.potential));
      addNews(state,'球队','本周特训结束',`${roster.length} 名队员完成提升训练。`);break;
    }
    case 'UPGRADE': {
      const kind=action.kind;ensure(state.ownedClubId,'请先收购球队。');ensure(['arena','academy','marketing'].includes(kind),'升级类型无效。');
      const level=state.upgrades[kind];ensure(level<3,'该设施已经达到最高等级。');
      const cost=upgradeCost(kind,level);ensure(state.cash>=cost,'升级资金不足。');
      const names={arena:'主场球馆',academy:'青训系统',marketing:'商业开发'};
      entry(state,`${names[kind]}升级`,-cost);state.upgrades[kind]=level+1;
      addNews(state,'球队',`${names[kind]}升至 ${level+1} 级`,`本次投资 ${money(cost)}。`);break;
    }
    case 'ADVANCE_WEEK': {
      const weeklyAgent=Math.round(clientIncome(state));entry(state,'球员经纪佣金',weeklyAgent);
      const games=playLeagueRound(state);
      let revenues=0,costs=0;
      if(state.ownedClubId){
        const club=CLUB_BY_ID[state.ownedClubId];const wins=games.filter(g=>g.win).length;
        revenues=Math.round(CONFIG.ownershipBaseRevenue*(.5+club.fanBase/100*.5)+state.upgrades.arena*115000+state.upgrades.marketing*65000+wins*85000);
        costs=Math.round(clubRoster(state,club.id).reduce((sum,p)=>sum+playerSalary(state,p),0)/CONFIG.weeksPerSeason + 160000 + state.upgrades.academy*18000);
        entry(state,'门票、转播与赞助',revenues);entry(state,'球员工资与俱乐部运营',-costs);
        addNews(state,'战报',`本周球队 ${wins} 胜 ${games.length-wins} 负`,games.map(g=>`${CLUB_BY_ID[g.homeId].city} ${g.home} : ${g.away} ${CLUB_BY_ID[g.awayId].city}`).join('；'));
      }
      state.lastWeekly={agents:weeklyAgent,revenue:revenues,costs,matchCount:games.length};
      state.tick++;
      state.week++;
      maybeRandomEvent(state);
      if(state.week>CONFIG.weeksPerSeason){
        const champion=CLUBS.slice().sort((a,b)=> state.standings[b.id].wins-state.standings[a.id].wins)[0];
        if(champion.id === state.ownedClubId){entry(state,'联赛冠军奖金',2600000);state.reputation=clamp(state.reputation+8,0,100);}
        addNews(state,'赛季',`${state.year} 赛季结束`,`${champion.name} 获得联盟第一。联赛战绩已清零，下一赛季正式开始。`);
        state.year++;state.week=1;
        state.standings=Object.fromEntries(CLUBS.map(c=>[c.id,{wins:0,losses:0,for:0,against:0}]));
      }
      break;
    }
    default: throw new Error('未知操作。');
  }
  return state;
}

/** Imported saves are intentionally constrained to the known roster and clubs. */
export function validateState(raw){
  if(!raw || raw.format !== SAVE_FORMAT || !Number.isInteger(raw.week) || raw.week<1 || raw.week>CONFIG.weeksPerSeason) throw new Error('存档版本或周数不正确。');
  if(!Number.isInteger(raw.year) || raw.year<1996 || raw.year>3000 || !Number.isFinite(raw.cash) || Math.abs(raw.cash)>1e14)throw new Error('存档资金或年份不正确。');
  if(!Number.isInteger(raw.tick) || raw.tick<0 || !Number.isFinite(raw.reputation) || raw.reputation<0 || raw.reputation>100) throw new Error('存档数据有误。');
  if(!Array.isArray(raw.clients) || raw.clients.length>CONFIG.maxClients || new Set(raw.clients).size!==raw.clients.length || raw.clients.some(id=>!PLAYER_BY_ID[id])) throw new Error('存档客户列表无效。');
  if(raw.ownedClubId!==null && !CLUB_BY_ID[raw.ownedClubId])throw new Error('存档球队无效。');
  if(!raw.standings || CLUBS.some(club=>!raw.standings[club.id] || !Number.isFinite(raw.standings[club.id].wins))) throw new Error('联赛存档无效。');
  if(!Array.isArray(raw.news) || !Array.isArray(raw.ledger) || !Array.isArray(raw.games) || !Array.isArray(raw.scoutedIds))throw new Error('存档记录有误。');
  for(const key of ['playerSalaries','playerRatings','playerTeamOverrides','lastNegotiated','upgrades'])if(!raw[key] || typeof raw[key]!=='object' || Array.isArray(raw[key]))throw new Error('存档字典字段无效。');
  if(!Number.isInteger(raw.rng))throw new Error('随机种子无效。');
  return structuredClone(raw);
}
