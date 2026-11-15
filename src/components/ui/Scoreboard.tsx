'use client';

import React, { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PlayerState } from '@/types/game';
import { Users, Award, Shield, Skull, Wifi } from 'lucide-react';

export const Scoreboard: React.FC = () => {
  const {
    isScoreboardOpen,
    players,
    playerId,
    currentRoom,
    matchState,
  } = useGameStore();

  if (!isScoreboardOpen) return null;

  // Split players into ALPHA and BRAVO (or single sorted list for FFA)
  const isFFA = currentRoom?.mode === 'FFA';

  const { alphaPlayers, bravoPlayers, ffaPlayers } = useMemo(() => {
    const all = Object.values(players);

    // Sort helper: Score descending, then Kills descending, then Deaths ascending
    const sorter = (a: PlayerState, b: PlayerState) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.deaths - b.deaths;
    };

    if (isFFA) {
      return {
        alphaPlayers: [],
        bravoPlayers: [],
        ffaPlayers: [...all].sort(sorter),
      };
    }

    const alpha = all.filter((p) => p.team === 'ALPHA').sort(sorter);
    const bravo = all.filter((p) => p.team === 'BRAVO').sort(sorter);

    return {
      alphaPlayers: alpha,
      bravoPlayers: bravo,
      ffaPlayers: [],
    };
  }, [players, isFFA]);

  // Aggregate stats
  const alphaTotalKills = alphaPlayers.reduce((acc, p) => acc + p.kills, 0);
  const bravoTotalKills = bravoPlayers.reduce((acc, p) => acc + p.kills, 0);

  const renderPlayerRow = (p: PlayerState, isAlphaTeam: boolean) => {
    const isLocal = p.id === playerId;
    const kd = p.deaths === 0 ? p.kills.toFixed(1) : (p.kills / p.deaths).toFixed(2);

    return (
      <tr
        key={p.id}
        className={`border-b border-gray-800/60 font-mono transition-colors text-xs ${
          isLocal
            ? 'bg-cyan-950/40 text-cyan-200 border-cyan-500/40 font-bold'
            : 'text-gray-300 hover:bg-gray-800/20'
        }`}
      >
        {/* Status */}
        <td className="py-2.5 px-3">
          {p.isDead ? (
            <span className="flex items-center gap-1 text-rose-500 text-[10px]">
              <Skull className="w-3.5 h-3.5" /> DEAD
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ALIVE
            </span>
          )}
        </td>

        {/* Name */}
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide truncate max-w-[130px]">
              {p.nickname}
            </span>
            {isLocal && (
              <span className="text-[9px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40">
                YOU
              </span>
            )}
          </div>
        </td>

        {/* Current Weapon */}
        <td className="py-2.5 px-3 text-gray-400 text-[11px]">
          {p.currentWeapon || 'AR-76'}
        </td>

        {/* Kills */}
        <td className="py-2.5 px-3 text-center font-bold text-white">
          {p.kills}
        </td>

        {/* Deaths */}
        <td className="py-2.5 px-3 text-center text-gray-400">
          {p.deaths}
        </td>

        {/* Assists */}
        <td className="py-2.5 px-3 text-center text-gray-400">
          {p.assists}
        </td>

        {/* K/D */}
        <td className="py-2.5 px-3 text-center text-cyan-400 font-semibold">
          {kd}
        </td>

        {/* Score */}
        <td className="py-2.5 px-3 text-right font-black text-amber-400">
          {p.score}
        </td>

        {/* Ping */}
        <td className="py-2.5 px-3 text-right text-gray-400">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-1 ${
              p.ping < 50 ? 'bg-emerald-400' : p.ping < 100 ? 'bg-amber-400' : 'bg-rose-500'
            }`}
          />
          {p.ping}ms
        </td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-30 flex items-center justify-center p-4 select-none font-mono">
      <div className="w-full max-w-5xl bg-[#0b0f17] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="px-6 py-4 bg-[#0e1420] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-black font-black">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-widest text-white uppercase">
                TACTICAL ENGAGEMENT OVERVIEW
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>MODE: <strong className="text-white">{currentRoom?.mode || 'TDM'}</strong></span>
                <span>ROOM: <strong className="text-cyan-400">{currentRoom?.id || 'LOCAL'}</strong></span>
                <span>SERVER: <strong className="text-emerald-400">60Hz TICK</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
            <div className="flex items-center gap-1.5 bg-gray-900 px-3 py-1.5 rounded border border-gray-800">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{Object.keys(players).length} PLAYERS</span>
            </div>
            <span className="text-[11px] text-gray-500">[RELEASE TAB TO CLOSE]</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {!isFFA ? (
            /* TDM: ALPHA vs BRAVO Split Tables */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ALPHA TEAM */}
              <div className="border border-cyan-500/30 rounded-xl overflow-hidden bg-cyan-950/10">
                <div className="px-4 py-3 bg-cyan-950/40 border-b border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className="font-black text-cyan-300 text-sm tracking-wider">
                      ALPHA VANGUARD
                    </span>
                  </div>
                  <div className="text-xs font-bold text-cyan-400">
                    KILLS: {alphaTotalKills} • SCORE: {matchState.scoreAlpha}
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider bg-gray-900/40">
                      <th className="py-2 px-3">STATUS</th>
                      <th className="py-2 px-3">OPERATOR</th>
                      <th className="py-2 px-3">WEAPON</th>
                      <th className="py-2 px-3 text-center">K</th>
                      <th className="py-2 px-3 text-center">D</th>
                      <th className="py-2 px-3 text-center">A</th>
                      <th className="py-2 px-3 text-center">K/D</th>
                      <th className="py-2 px-3 text-right">SCORE</th>
                      <th className="py-2 px-3 text-right">PING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alphaPlayers.length > 0 ? (
                      alphaPlayers.map((p) => renderPlayerRow(p, true))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-4 text-center text-xs text-gray-500">
                          No operators in Alpha Team
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* BRAVO TEAM */}
              <div className="border border-rose-500/30 rounded-xl overflow-hidden bg-rose-950/10">
                <div className="px-4 py-3 bg-rose-950/40 border-b border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="font-black text-rose-300 text-sm tracking-wider">
                      BRAVO ENFORCERS
                    </span>
                  </div>
                  <div className="text-xs font-bold text-rose-400">
                    KILLS: {bravoTotalKills} • SCORE: {matchState.scoreBravo}
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider bg-gray-900/40">
                      <th className="py-2 px-3">STATUS</th>
                      <th className="py-2 px-3">OPERATOR</th>
                      <th className="py-2 px-3">WEAPON</th>
                      <th className="py-2 px-3 text-center">K</th>
                      <th className="py-2 px-3 text-center">D</th>
                      <th className="py-2 px-3 text-center">A</th>
                      <th className="py-2 px-3 text-center">K/D</th>
                      <th className="py-2 px-3 text-right">SCORE</th>
                      <th className="py-2 px-3 text-right">PING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bravoPlayers.length > 0 ? (
                      bravoPlayers.map((p) => renderPlayerRow(p, false))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-4 text-center text-xs text-gray-500">
                          No operators in Bravo Team
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* FFA Table */
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#0d121c]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider bg-gray-900/60">
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">OPERATOR</th>
                    <th className="py-2.5 px-3">WEAPON</th>
                    <th className="py-2.5 px-3 text-center">KILLS</th>
                    <th className="py-2.5 px-3 text-center">DEATHS</th>
                    <th className="py-2.5 px-3 text-center">ASSISTS</th>
                    <th className="py-2.5 px-3 text-center">K/D</th>
                    <th className="py-2.5 px-3 text-right">TOTAL SCORE</th>
                    <th className="py-2.5 px-3 text-right">PING</th>
                  </tr>
                </thead>
                <tbody>
                  {ffaPlayers.map((p) => renderPlayerRow(p, false))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0a0d14] border-t border-gray-800 flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>HOLD [TAB] TO KEEP SCOREBOARD OPEN</span>
          <span>TARGET SCORE: {matchState.targetScore}</span>
        </div>
      </div>
    </div>
  );
};
