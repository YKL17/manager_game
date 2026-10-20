import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLUBS, PLAYERS, PLAYER_BY_ID } from '../src/data.js';
import { CONFIG, initialState, validateState, reduceGame, clubRoster, freeAgents, rating, playerSalary, clubStrength, clientIncome } from '../src/engine.js';

test('new game has seeded customers, all league teams and a valid save', () => {
  const s=initialState();
  assert.equal(s.cash, CONFIG.startingCash);
  assert.equal(s.year, 1996);assert.equal(s.week, 1);
  assert.equal(s.clients.length,3);assert.equal(Object.keys(s.standings).length,12);
  assert.deepEqual(validateState(s),s);
});
test('signing customer costs cash, adds client and does not mutate old state', () => {
  const s=initialState(), id='P081';
  const n=reduceGame(s,{type:'SIGN_CLIENT',playerId:id});
  assert.equal(s.clients.includes(id),false);
  assert.equal(n.clients.includes(id),true);
  assert.ok(n.cash<s.cash);
  assert.ok(clientIncome(n)>clientIncome(s));
  assert.throws(()=>reduceGame(n,{type:'SIGN_CLIENT',playerId:id}),/已经/);
});
test('contract negotiation enforces cooldown', () => {
  const s=initialState(),id=s.clients[0];
  const n=reduceGame(s,{type:'NEGOTIATE',playerId:id});
  assert.equal(n.lastNegotiated[id],0);
  assert.throws(()=>reduceGame(n,{type:'NEGOTIATE',playerId:id}),/间隔/);
});
test('unaffordable club purchase is rejected without changing input', () => {
  const s=initialState();
  assert.throws(()=>reduceGame(s,{type:'BUY_CLUB',clubId:'LAX'}),/不足/);
  assert.equal(s.ownedClubId,null);
});
test('purchasing inexpensive club unlocks upgrades, training and free agent acquisition', () => {
  const s=initialState(), club='VAN';
  const owned=reduceGame(s,{type:'BUY_CLUB',clubId:club});
  assert.equal(owned.ownedClubId,club);
  const upgraded=reduceGame(owned,{type:'UPGRADE',kind:'academy'});
  assert.equal(upgraded.upgrades.academy,1);
  const before=clubRoster(upgraded,club).length;
  const trained=reduceGame(upgraded,{type:'TRAIN'});
  assert.equal(trained.lastTrainingTick,0);
  const p=freeAgents(trained)[0];
  const hired=reduceGame(trained,{type:'SIGN_TEAM_PLAYER',playerId:p.id});
  assert.equal(clubRoster(hired,club).length,before+1);
  assert.ok(clubStrength(hired,club)>0);
});
test('weekly simulation changes cash and produces results', () => {
  let s=reduceGame(initialState(),{type:'BUY_CLUB',clubId:'VAN'});
  const before=s.cash;
  s=reduceGame(s,{type:'ADVANCE_WEEK'});
  assert.equal(s.week,2);assert.equal(s.tick,1);
  assert.equal(s.games.length,2);
  assert.notEqual(before,s.cash);
  assert.equal(CLUBS.reduce((sum,c)=>sum+s.standings[c.id].wins,0),12);
});
test('season rollover awards champion or resets rankings', () => {
  let s=initialState();
  for(let i=0;i<26;i++)s=reduceGame(s,{type:'ADVANCE_WEEK'});
  assert.equal(s.year,1997);assert.equal(s.week,1);
  assert.equal(s.tick,26);
  assert.equal(CLUBS.reduce((sum,c)=>sum+s.standings[c.id].wins,0),0);
});
test('malformed imported saves are rejected', () => {
  const s=initialState();
  assert.throws(()=>validateState({...s,format:9}),/存档/);
  assert.throws(()=>validateState({...s,clients:['NOT_A_PLAYER']}),/客户/);
  assert.throws(()=>validateState({...s,ownedClubId:'TEAM_INVALID'}),/球队/);
});
