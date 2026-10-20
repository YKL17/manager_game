import { CLUBS, PLAYERS, PLAYER_BY_ID, CLUB_BY_ID } from './data.js';
import { SAVE_KEY, CONFIG, initialState, validateState, reduceGame, money, rating, playerSalary, currentClub, clubRoster, freeAgents, agencyValue, clientIncome, clubStrength, signClientCost, signingBonus, upgradeCost } from './engine.js';

const root=document.querySelector('#app');
const toast=document.querySelector('#toast');
const screens=['dashboard','clients','market','clubs','league','records'];
const saved=localStorage.getItem(SAVE_KEY);
let state;
try {state=saved?validateState(JSON.parse(saved)):initialState();}catch{state=initialState();}
let tab='dashboard';
let search='',position='ALL',showOnlyFree=false;
let toastTimer;

const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtNumber = n=>Number(n).toLocaleString('zh-CN');
const posName={PG:'控球后卫',SG:'得分后卫',SF:'小前锋',PF:'大前锋',C:'中锋'};
const labels={arena:'主场球馆',academy:'青训系统',marketing:'商业开发'};
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function toastMessage(message, type='success'){
  toast.textContent=message;toast.dataset.type=type;toast.hidden=false;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},3200);
}
function button(text,command,extra={},options={}){
  const attrs=Object.entries(extra).map(([k,v])=>`data-${k}="${escapeHtml(v)}"`).join(' ');
  return `<button type="button" class="btn ${options.className||'btn-small'}" data-command="${command}" ${attrs} ${options.disabled?'disabled':''}>${text}</button>`;
}
function sectionHead(kicker,title,body='',extra=''){
  return `<div class="section-head"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2>${body?`<p>${body}</p>`:''}</div>${extra}</div>`;
}
function progress(value,max=100){return `<div class="progress"><span style="width:${Math.max(0,Math.min(100,(value/max)*100))}%"></span></div>`;}
function playerName(p){return escapeHtml(p.name);}
function ownedClub(){return state.ownedClubId?CLUB_BY_ID[state.ownedClubId]:null;}
function teamBadge(c,size=''){return `<span class="team-emblem ${size}" style="--team-color:${c.color}">${escapeHtml(c.id)}</span>`;}
function renderNav(){
  for(const el of document.querySelectorAll('[data-tab]'))el.classList.toggle('active',el.dataset.tab===tab && el.classList.contains('nav-link'));
  document.getElementById('calendar').textContent=`${state.year} SEASON · WEEK ${String(state.week).padStart(2,'0')}`;
  const advance=document.getElementById('advanceBtn');
  advance.title='进行两轮联赛比赛、结算本周收入与支出';
}
function renderStat(label,val,annotation='',light=false){return `<div class="stat ${light?'stat-highlight':''}"><div class="stat-label">${label}</div><div class="stat-value">${val}</div><div class="stat-caption">${annotation}</div></div>`;}
function newsCards(limit=5){return state.news.slice(0,limit).map(item=>`<article class="news-item"><span class="news-dot"></span><div><div class="news-meta">${escapeHtml(item.week)} <span class="pill tiny">${escapeHtml(item.type)}</span></div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div></article>`).join('')||'<div class="empty">暂无动态。</div>';}
function resultsCard(){
  if(!state.ownedClubId)return `<div class="empty-empty"><div class="illustration">♜</div><strong>真正的老板，还差一步</strong><p>收购俱乐部后，这里会出现你的赛季战绩、比赛记录和球队经营数据。</p><button class="btn btn-quiet" data-tab="clubs">查看出售中的球队 ↗</button></div>`;
  const club=ownedClub(), s=state.standings[club.id],recent=state.games.slice(0,4);
  return `<div class="club-status"><div class="club-status-header">${teamBadge(club)}<div><div class="eyebrow">OWNED FRANCHISE</div><h3>${escapeHtml(club.name)}</h3><p>球队战力 ${clubStrength(state,club.id)} · 现有 ${clubRoster(state,club.id).length} 人</p></div></div><div class="record-block"><strong>${s.wins} <span>胜</span> / ${s.losses} <span>负</span></strong><small>常规赛战绩</small></div>${recent.map(g=>`<div class="game-line"><span>${escapeHtml(CLUB_BY_ID[g.homeId].city)} <b>${g.home} - ${g.away}</b> ${escapeHtml(CLUB_BY_ID[g.awayId].city)}</span><span class="${g.win?'good':'bad'}">${g.win?'胜':'负'}</span></div>`).join('')||'<div class="muted">推进一周后产生比赛记录。</div>'}<button class="btn btn-quiet btn-full" data-tab="league">完整联赛排名 ↗</button></div>`;
}
function dashboard(){
  const club=ownedClub();
  const value=agencyValue(state);
  return `<section class="hero"><div class="hero-grain"></div><div class="hero-content"><div class="hero-kicker">EST. 1996 <span>·</span> THE OWNERSHIP ERA</div><h1>你的篮球帝国，<br /><em>从 1996 开始。</em></h1><p>从球员经纪人起步。签合同、做交易、购入球队。每一次决定，都可能改变联盟格局。</p><div class="hero-actions"><button class="btn btn-primary" data-tab="market">探索球员市场 <span>↗</span></button><button class="btn btn-outline" data-tab="clubs">购买一支球队</button></div></div><div class="hero-graphic" aria-hidden="true"><div class="court-ring ring-one"></div><div class="court-ring ring-two"></div><div class="hero-basketball">✦</div><div class="hero-year">96</div></div><div class="hero-corner">THE GAME IS YOURS / 01</div></section>
  <div class="stats-grid">${renderStat('现金余额',money(state.cash),'可用于签约与收购',true)}${renderStat('公司总资产',money(value),'现金 + 经纪业务 + 球队')}${renderStat('签约客户',`${state.clients.length} <span class="fraction">/ ${CONFIG.maxClients}</span>`,`预计周佣金 ${money(clientIncome(state))}`)}${renderStat('经纪声望',`${state.reputation} <span class="fraction">/ 100</span>`,`影响谈判成功率`)}</div>
  <div class="dashboard-grid"><section class="panel panel-news">${sectionHead('FRONT PAGE','经理办公室','最新动态与业务消息。','<span class="small-muted">实时报表</span>')}<div class="news-list">${newsCards()}</div><button class="btn btn-quiet btn-full" data-tab="records">查看全部经营记录 ↗</button></section><section class="panel panel-franchise">${sectionHead('FRANCHISE DESK','我的球队',club?'每周结算运营收入，并模拟两轮比赛。':'先积累资本，再买下你的第一支球队。')}${resultsCard()}</section></div>
  <div class="quick-strip"><div><span class="eyebrow">YOUR NEXT MOVE</span><h3>${!club?'找到第一支属于你的球队':'把阵容打造成冠军级别'}</h3><p>${!club?'起步资金足以考虑一支新兴球队。球队收购后将开放球员签约、训练和商业设施升级。':'签下优质自由球员，安排训练，提升球馆和商业收入。'}</p></div><button class="btn btn-primary" data-tab="${club?'league':'clubs'}">${club?'查看赛季表现':'浏览球队收购市场'} ↗</button></div>`;
}
function playerCard(p, context='market'){
  const isClient=state.clients.includes(p.id),isFree=currentClub(state,p)===null,club=currentClub(state,p)?CLUB_BY_ID[currentClub(state,p)]:null;
  const ov=rating(state,p),cost=signClientCost(p);
  const isScouted=state.scoutedIds.includes(p.id);
  let controls='';
  if(context==='clients'){
    const cooldown=Math.max(0,4-(state.tick-(state.lastNegotiated[p.id]??-5)));
    controls=`${button(cooldown?`冷却 ${cooldown} 周`:'谈判新合同','NEGOTIATE',{player:p.id},{disabled:cooldown>0,className:'btn-small btn-gold'})}`;
  }else{
    controls=`${button(isClient?'已签约':`签为客户 · ${money(cost)}`,'SIGN_CLIENT',{player:p.id},{disabled:isClient||state.clients.length>=CONFIG.maxClients||state.cash<cost,className:'btn-small btn-gold'})}`;
    if(isFree&&state.ownedClubId){controls+=button(`签入球队 · ${money(signingBonus(state,p))}`,'SIGN_TEAM_PLAYER',{player:p.id},{disabled:clubRoster(state,state.ownedClubId).length>=CONFIG.maxClubRoster||state.cash<signingBonus(state,p),className:'btn-small btn-quiet'});}
  }
  return `<article class="player-card"><div class="player-top"><span class="position-tag">${escapeHtml(p.position)}</span>${isScouted?'<span class="player-scout">★ 球探推荐</span>':''}<span class="rating-score">${ov}<small>OVR</small></span></div><div class="player-portrait"><span>${escapeHtml(p.name.split(' ').map(s=>s[0]).join(''))}</span><div class="portrait-ring"></div></div><h3>${playerName(p)}</h3><div class="player-sub">${escapeHtml(posName[p.position])} · ${p.age} 岁</div><div class="player-metrics"><div><span>潜力</span><strong>${p.potential}</strong></div><div><span>当前合同</span><strong>${money(playerSalary(state,p))}</strong></div></div>${progress(ov,100)}<div class="player-club">${club?teamBadge(club,'team-emblem-small'):'<span class="team-emblem team-emblem-small" style="--team-color:#788898">FA</span>'}<span>${club?escapeHtml(club.name):'自由球员'}</span></div><div class="player-actions">${controls}</div></article>`;
}
function clients(){
  const people=state.clients.map(id=>PLAYER_BY_ID[id]).filter(Boolean).sort((a,b)=>rating(state,b)-rating(state,a));
  const weekly=clientIncome(state);
  return `${sectionHead('PLAYER MANAGEMENT','我的签约客户','经纪人公司的核心资产。签约优秀球员，谈判更高薪水，为每周持续贡献佣金。')}
   <div class="ribbon-stats"><div><span>在册客户</span><strong>${people.length} / ${CONFIG.maxClients}</strong></div><div><span>客户年薪总额</span><strong>${money(people.reduce((s,p)=>s+playerSalary(state,p),0))}</strong></div><div><span>经纪佣金 / 周</span><strong>${money(weekly)}</strong></div><div><span>谈判成功率</span><strong>${Math.round(Math.min(.88,.38+state.reputation*.005)*100)}%</strong></div></div>
   <div class="inline-head"><h3>经纪人名册 <span class="count">${people.length}</span></h3><button type="button" class="btn btn-quiet" data-tab="market">拓展客户名单 ↗</button></div>
   <div class="player-grid">${people.map(p=>playerCard(p,'clients')).join('')}</div>
   <div class="tip"><strong>合同规则</strong> 每名球员的周佣金为其年薪的 ${(CONFIG.commissionRate*100).toFixed(0)}% ÷ ${CONFIG.weeksPerSeason}。一次成功谈判可将年薪提高 11%，同一名球员每四周最多谈判一次。</div>`;
}
function market(){
  let players=PLAYERS.filter(p=>!showOnlyFree||currentClub(state,p)===null);
  if(position!=='ALL')players=players.filter(p=>p.position===position);
  if(search.trim()){const s=search.trim().toLowerCase();players=players.filter(p=>p.name.toLowerCase().includes(s)||(currentClub(state,p)?CLUB_BY_ID[currentClub(state,p)].name.includes(s):'自由球员'.includes(s)));}
  players.sort((a,b)=> state.scoutedIds.includes(b.id)-state.scoutedIds.includes(a.id) || rating(state,b)-rating(state,a));
  return `${sectionHead('FREE AGENT & CONTRACT MARKET','球员市场','经纪人可以代理任意球员；拥有球队后还能从自由市场直接引援。',button('派出球探 · '+money(CONFIG.scoutingCost),'SCOUT',{}, {disabled:state.cash<CONFIG.scoutingCost,className:'btn-gold'}))}
    <div class="market-toolbar"><form id="filterForm" class="filter-form"><label class="search-wrap"><span>⌕</span><input name="search" value="${escapeHtml(search)}" placeholder="搜索球员姓名或球队" autocomplete="off" aria-label="搜索球员" /></label><select aria-label="球员位置" name="position"><option value="ALL" ${position==='ALL'?'selected':''}>所有位置</option>${['PG','SG','SF','PF','C'].map(pos=>`<option value="${pos}" ${pos===position?'selected':''}>${pos} ${posName[pos]}</option>`).join('')}</select><label class="checkbox"><input type="checkbox" name="free" ${showOnlyFree?'checked':''} /> 仅自由球员</label><button class="btn btn-quiet" type="submit">筛选</button></form><span class="small-muted">找到 ${players.length} 名球员</span></div>
    ${players.length?`<div class="player-grid">${players.map(p=>playerCard(p)).join('')}</div>`:'<div class="empty">没有找到符合筛选条件的球员。</div>'}
    <div class="tip"><strong>球探提示</strong> 花费 ${money(CONFIG.scoutingCost)} 可以查看高潜力自由球员的特别推荐。推荐会保留在市场首页。</div>`;
}
function clubs(){
  const owned=ownedClub();
  const sorted=CLUBS.slice().sort((a,b)=>a.price-b.price);
  return `${sectionHead('THE OWNERSHIP MARKET','收购一家球队','把你的经纪公司发展成体育帝国。收购后可经营俱乐部、签约自由球员和升级设施。')}
    ${owned?renderOwnedClub(owned):`<div class="ownership-banner"><div><span class="eyebrow">BE YOUR OWN BOSS</span><h3>从经纪人，到球队所有者。</h3><p>当前现金 ${money(state.cash)}。一次只能拥有一支球队。低价球队更容易入手，但阵容和商业基础相对薄弱。</p></div><div class="ownership-mark">1996</div></div>`}
    <div class="inline-head"><h3>联盟球队 <span class="count">${CLUBS.length}</span></h3><span class="small-muted">按收购价格排序 · 虚构数据</span></div>
    <div class="club-grid">${sorted.map(c=>clubCard(c)).join('')}</div>`;
}
function clubCard(c){
  const strength=clubStrength(state,c.id),owned=state.ownedClubId===c.id;
  const isLocked=!!state.ownedClubId && !owned;
  return `<article class="club-card ${owned?'club-card-owned':''}"><div class="club-card-head">${teamBadge(c)}<span class="conference-tag">${escapeHtml(c.conference)}联盟</span></div><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.en)}</p><div class="club-info"><div><span>球队战力</span><b>${strength}</b></div><div><span>球迷基础</span><b>${c.fanBase}</b></div><div><span>球员数量</span><b>${clubRoster(state,c.id).length}</b></div></div><div class="club-bottom"><div><span>参考收购价</span><strong>${money(c.price)}</strong></div>${button(owned?'我的球队':isLocked?'仅限拥有一支':state.cash<c.price?'现金不足':'正式收购','BUY_CLUB',{club:c.id},{disabled:owned||isLocked||state.cash<c.price,className:owned?'btn-success':'btn-gold'})}</div></article>`;
}
function renderOwnedClub(club){
  const roster=clubRoster(state,club.id);
  return `<section class="owner-panel"><div class="owner-panel-heading"><div class="club-status-header">${teamBadge(club)}<div><div class="eyebrow">YOUR FRANCHISE · OWNED</div><h3>${escapeHtml(club.name)}</h3><p>综合战力 ${clubStrength(state,club.id)} · ${roster.length} 名队员</p></div></div><button class="btn btn-quiet" data-tab="league">查看赛季赛程 ↗</button></div><div class="owner-upgrades">${['arena','academy','marketing'].map(kind=>`<div class="upgrade"><div class="upgrade-name">${labels[kind]} <b>LV ${state.upgrades[kind]}/3</b></div>${progress(state.upgrades[kind],3)}<p>${({arena:'提升主场比赛周收入。',academy:'提高球队比赛实力。',marketing:'增加赞助与商业收益。'})[kind]}</p>${button(state.upgrades[kind]===3?'已达满级':`升级 · ${money(upgradeCost(kind,state.upgrades[kind]))}`,'UPGRADE',{kind},{disabled:state.upgrades[kind]===3||state.cash<upgradeCost(kind,state.upgrades[kind]),className:'btn-small btn-quiet'})}</div>`).join('')}</div><div class="roster-head"><div><span class="eyebrow">ACTIVE ROSTER</span><h3>当前球队阵容</h3></div>${button(state.lastTrainingTick===state.tick?'本周已训练':`安排特训 · ${money(CONFIG.trainingCost)}`,'TRAIN',{}, {disabled:state.lastTrainingTick===state.tick||state.cash<CONFIG.trainingCost,className:'btn-gold'})}</div><div class="roster-list">${roster.sort((a,b)=>rating(state,b)-rating(state,a)).map(p=>`<div class="roster-row"><span class="position-tag">${p.position}</span><strong>${playerName(p)}</strong><span class="muted">${p.age} 岁</span><span class="rating-small">${rating(state,p)}</span><span>${money(playerSalary(state,p))}/年</span></div>`).join('')}</div><p class="muted">阵容上限 ${CONFIG.maxClubRoster} 人。前往球员市场签下自由球员。</p></section>`;
}
function league(){
  const rankings=CLUBS.slice().sort((a,b)=>state.standings[b.id].wins-state.standings[a.id].wins||state.standings[a.id].losses-state.standings[b.id].losses||state.standings[b.id].for-state.standings[a.id].for);
  return `${sectionHead('LEAGUE COMMISSION · 1996','常规赛积分榜','每推进一周，全联盟球队各进行 2 场模拟比赛。26 周后结算一个赛季。',`<span class="season-tag">${state.year} / ${state.year+1} SEASON</span>`)}
    <div class="league-top">${renderStat('当前赛季周数',`${state.week} / ${CONFIG.weeksPerSeason}`,'赛季结束后自动进入下一年')}${renderStat('联盟球队','12','东部 6 支 · 西部 6 支')}${renderStat('累计模拟周数',fmtNumber(state.tick),'比赛记录自动保存在本地')}</div>
    <section class="panel"><div class="inline-head"><h3>联盟排名</h3><span class="small-muted">按胜场优先排序</span></div><div class="table-scroll"><table class="standings-table"><thead><tr><th>排名</th><th>球队</th><th>分区</th><th>战力</th><th>胜</th><th>负</th><th>净胜分</th></tr></thead><tbody>${rankings.map((c,i)=>{const s=state.standings[c.id];return `<tr class="${c.id===state.ownedClubId?'my-team':''}"><td class="rank">${String(i+1).padStart(2,'0')}</td><td><div class="table-club">${teamBadge(c,'team-emblem-small')}<strong>${escapeHtml(c.name)}</strong>${c.id===state.ownedClubId?'<span class="pill gold-pill">MY TEAM</span>':''}</div></td><td>${c.conference}</td><td>${clubStrength(state,c.id)}</td><td><strong>${s.wins}</strong></td><td>${s.losses}</td><td>${s.for-s.against>0?'+':''}${s.for-s.against}</td></tr>`}).join('')}</tbody></table></div></section>
    <section class="panel recent-panel"><div class="inline-head"><h3>我的球队 · 最近比赛</h3><span class="small-muted">${state.games.length} 场记录</span></div>${state.ownedClubId?state.games.length?state.games.slice(0,12).map(g=>`<div class="fixture"><span>${escapeHtml(CLUB_BY_ID[g.homeId].name)} <b>${g.home} : ${g.away}</b> ${escapeHtml(CLUB_BY_ID[g.awayId].name)}</span><b class="${g.win?'good':'bad'}">${g.win?'胜利':'失利'}</b></div>`).join(''):'<div class="empty">请推进一周，查看比赛结果。</div>':'<div class="empty">购买球队后将记录你参加的比赛。</div>'}</section>`;
}
function records(){
  const totalIncome=state.ledger.filter(e=>e.amount>0).reduce((sum,e)=>sum+e.amount,0);
  const totalSpend=-state.ledger.filter(e=>e.amount<0).reduce((sum,e)=>sum+e.amount,0);
  return `${sectionHead('YOUR LEGACY','存档与记录','自动保存在当前浏览器，也可以导出 JSON 备份或从备份导入。')}
    <div class="save-actions"><div><span class="eyebrow">LOCAL DATA CONTROL</span><h3>你的 1996 经营档案</h3><p>数据只保存在本机浏览器，不上传任何服务器。清除浏览器数据可能删除存档，请定期导出。</p></div><div class="save-action-buttons">${button('导出存档 ↓','EXPORT',{}, {className:'btn-gold'})}${button('导入存档 ↑','IMPORT',{}, {className:'btn-quiet'})}${button('重新开始','RESET',{}, {className:'btn-danger'})}</div></div>
    <div class="stats-grid stats-grid-3">${renderStat('现金余额',money(state.cash),'当前账面余额')}${renderStat('历史总流入',money(totalIncome),'包括初始资金')}${renderStat('历史总流出',money(totalSpend),'所有支出之和')}</div>
    <div class="dashboard-grid"><section class="panel">${sectionHead('HISTORY','经营日志')}<div class="news-list">${newsCards(45)}</div></section><section class="panel">${sectionHead('CASHFLOW','资金流水')}<div class="ledger">${state.ledger.slice(0,55).map(e=>`<div class="ledger-line"><div><strong>${escapeHtml(e.label)}</strong><small>WEEK ${e.tick+1}</small></div><span class="${e.amount>=0?'good':'bad'}">${e.amount>=0?'+':''}${money(e.amount)}</span></div>`).join('')}</div></section></div>`;
}
function render(){
  const templates={dashboard,clients,market,clubs,league,records};
  root.innerHTML=templates[tab]();
  renderNav();
}
function navigate(next){if(!screens.includes(next))return;tab=next;render();window.scrollTo({top:0,behavior:'smooth'});}
function dispatch(action){
  try{
    if(action.type==='BUY_CLUB'){
      const club=CLUB_BY_ID[action.clubId];
      if(!club || !window.confirm(`确认花费 ${money(club.price)} 收购 ${club.name}？\n每个存档只能拥有一支球队。`))return;
    }
    const next=reduceGame(state,action);state=next;save();render();
    const last=state.news[0];toastMessage(action.type==='ADVANCE_WEEK'?'新的一周已结算。':last?.title||'操作成功。');
  }catch(error){toastMessage(error.message||'操作失败。','error');}
}
function exportSave(){
  const json=JSON.stringify(state,null,2);
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`golden-agent-1996-${state.year}-w${state.week}.json`;
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  toastMessage('存档文件已经导出。');
}
root.addEventListener('submit',event=>{
  if(event.target?.id!=='filterForm')return;
  event.preventDefault();const f=new FormData(event.target);
  search=String(f.get('search')||'');position=String(f.get('position')||'ALL');showOnlyFree=f.has('free');render();
});
document.body.addEventListener('click',event=>{
  const advance=event.target.closest('#advanceBtn');if(advance){dispatch({type:'ADVANCE_WEEK'});return;}
  const navigation=event.target.closest('button[data-tab]');if(navigation){navigate(navigation.dataset.tab);return;}
  const btn=event.target.closest('button[data-command]');if(!btn || btn.disabled)return;
  switch(btn.dataset.command){
    case 'EXPORT':exportSave();break;
    case 'IMPORT':document.getElementById('importFile').click();break;
    case 'RESET': if(window.confirm('确定删除当前本地存档并重新开始吗？此操作无法撤销。')){state=initialState();save();navigate('dashboard');toastMessage('已经创建新的 1996 年存档。');}break;
    default:dispatch({type:btn.dataset.command,playerId:btn.dataset.player,clubId:btn.dataset.club,kind:btn.dataset.kind});
  }
});
document.getElementById('importFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>2_000_000)throw new Error('存档文件过大。');
    const raw=JSON.parse(await file.text());state=validateState(raw);save();navigate('dashboard');toastMessage('存档导入成功。');
  }catch(err){toastMessage(err.message||'无法导入存档。','error');}
  event.target.value='';
});
render();
