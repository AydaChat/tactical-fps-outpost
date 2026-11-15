'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { socketClient } from '@/network/socketClient';
import {
  WeaponId,
  WEAPON_CONFIGS,
  Team,
  GameMode,
} from '@/types/game';
import {
  Shield,
  Crosshair,
  Users,
  Copy,
  Check,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Wifi,
  ExternalLink,
} from 'lucide-react';

const PRIMARY_WEAPONS: WeaponId[] = ['AR-76', 'SR-99', 'SMG-9', 'SG-12'];

export const Lobby: React.FC = () => {
  const {
    nickname,
    setNickname,
    preferredTeam,
    setPreferredTeam,
    loadout,
    setLoadout,
    isConnecting,
    connectionError,
    currentRoom,
    leaveRoom,
    setInGame,
    ping,
    startPracticeMode,
  } = useGameStore();

  const [inputCode, setInputCode] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('TDM');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'matchmaking' | 'loadout'>('matchmaking');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tactical_fps_socket_url') || 'http://localhost:3001';
    }
    return 'http://localhost:3001';
  });

  // Check URL parameters for ?room=XXXXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && roomParam.length >= 4) {
        setInputCode(roomParam.toUpperCase());
      }
    }
  }, []);

  const handleCreateRoom = () => {
    if (!nickname.trim()) return;
    if (!socketClient.isConnected()) {
      startPracticeMode(selectedMode);
      return;
    }
    socketClient.createRoom({
      nickname: nickname.trim(),
      mode: selectedMode,
      team: selectedMode === 'FFA' ? 'FFA' : preferredTeam,
    });
  };

  const handleJoinByCode = () => {
    if (!nickname.trim() || !inputCode.trim()) return;
    if (!socketClient.isConnected()) {
      startPracticeMode(selectedMode);
      return;
    }
    socketClient.joinRoom({
      roomCode: inputCode.trim().toUpperCase(),
      nickname: nickname.trim(),
      preferredTeam: selectedMode === 'FFA' ? 'FFA' : preferredTeam,
    });
  };

  const handleQuickMatch = () => {
    if (!nickname.trim()) return;
    if (!socketClient.isConnected()) {
      startPracticeMode(selectedMode);
      return;
    }
    socketClient.quickMatch({
      nickname: nickname.trim(),
      preferredMode: selectedMode,
    });
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyShareLink = (code: string) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const selectedPrimary = WEAPON_CONFIGS[loadout.primary];
  const secondaryConfig = WEAPON_CONFIGS[loadout.secondary];
  const meleeConfig = WEAPON_CONFIGS[loadout.melee];

  return (
    <div className="relative w-full min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-between p-4 md:p-8 select-none overflow-x-hidden font-sans">
      {/* Background Gradients & Tactical Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header bar */}
      <header className="w-full max-w-7xl flex items-center justify-between border-b border-gray-800/80 pb-4 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#ff4655] to-amber-500 flex items-center justify-center font-black text-xl italic tracking-tighter shadow-lg shadow-rose-500/20 transform -skew-x-12">
            V9
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
              VORTEX: OUTPOST
            </h1>
            <p className="text-[10px] tracking-widest text-cyan-400 font-mono">
              60HZ TACTICAL COMPETITIVE CLIENT v1.0.4
            </p>
          </div>
        </div>

        {/* Server & Ping Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#0d121d] px-3 py-1.5 rounded border border-gray-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-400">NET:</span>
            <span className="text-emerald-400 font-bold">{ping}ms</span>
            <Wifi className="w-3.5 h-3.5 text-gray-500 ml-1" />
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-400">
            <span className="px-2 py-1 bg-gray-900 border border-gray-800 rounded">
              DIRECT 3D CANVAS
            </span>
          </div>
        </div>
      </header>

      {/* Connection Notice & Offline Mode Banner */}
      {connectionError && (
        <div className="w-full max-w-5xl mt-3 p-4 bg-[#0e1422]/95 border border-amber-500/40 rounded-xl text-xs font-mono z-20 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full mt-1 bg-amber-400 animate-pulse" />
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span className="text-amber-400">MULTIPLAYER SUNUCUSU BİLDİRİMİ</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded uppercase font-bold">
                    Sunucusuz Mod Aktif
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                  Vercel sunucusuz barındırma ortamında 60Hz Socket.io sunucusu kapalıdır.
                  <strong className="text-white"> Çevrimdışı Bot Arenası</strong> ile tüm 6 silahı, ses motorunu, zıplama pedlerini ve OUTPOST-09 haritasını anında 60 FPS test edebilir veya yerel sunucu adresinizi bağlayabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => startPracticeMode(selectedMode)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black uppercase tracking-wider rounded text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                BOT ARENASINA GİR
              </button>
              <button
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-bold uppercase transition-colors"
              >
                ⚙️ Sunucu Ayarı
              </button>
              <button
                onClick={() => socketClient.connect(customServerUrl)}
                className="px-2.5 py-2 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-300 rounded text-[11px] font-bold uppercase transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>

          {showServerConfig && (
            <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center gap-2">
              <span className="text-gray-400 text-[11px] whitespace-nowrap">WebSocket Sunucu URL:</span>
              <input
                type="text"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="flex-1 bg-[#121824] border border-gray-700 rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  socketClient.connect(customServerUrl);
                }}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase rounded text-xs transition-colors"
              >
                Bağlan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-7xl flex-1 flex flex-col items-center justify-center my-6 z-10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-[#0c101a] p-1 rounded-lg border border-gray-800/80">
          <button
            onClick={() => setActiveTab('matchmaking')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'matchmaking'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Matchmaking & Deploy
          </button>
          <button
            onClick={() => setActiveTab('loadout')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'loadout'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
            }`}
          >
            <Shield className="w-4 h-4" />
            Arsenal & Loadout
          </button>
        </div>

        {/* TAB 1: MATCHMAKING & LOBBY */}
        {activeTab === 'matchmaking' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Player Identity & Preferences */}
            <div className="lg:col-span-5 bg-[#0b0f17]/90 backdrop-blur-md border border-gray-800/80 rounded-xl p-6 shadow-2xl space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 tracking-wider mb-2">
                  Operator Callsign (Nickname)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={16}
                    placeholder="ENTER CODENAME..."
                    className="w-full bg-[#121824] border border-gray-700/80 focus:border-cyan-400 rounded-lg px-4 py-3 text-white font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all text-sm uppercase placeholder-gray-600"
                  />
                  <div className="absolute right-3 top-3 text-[11px] font-mono text-gray-500">
                    {nickname.length}/16
                  </div>
                </div>
              </div>

              {/* Game Mode Selection */}
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 tracking-wider mb-2">
                  Engagement Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedMode('TDM')}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      selectedMode === 'TDM'
                        ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300 shadow-md shadow-cyan-950/50'
                        : 'border-gray-800 bg-[#121824] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm tracking-wide">TEAM DEATHMATCH</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">50 Kills Target • 2 Teams</div>
                  </button>

                  <button
                    onClick={() => setSelectedMode('FFA')}
                    className={`p-3 rounded-lg border text-left font-mono transition-all ${
                      selectedMode === 'FFA'
                        ? 'border-amber-400 bg-amber-950/20 text-amber-300 shadow-md shadow-amber-950/50'
                        : 'border-gray-800 bg-[#121824] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="font-bold text-sm tracking-wide">FREE FOR ALL</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">30 Kills Target • Solo FFA</div>
                  </button>
                </div>
              </div>

              {/* Team Selector (Only for TDM) */}
              {selectedMode === 'TDM' && (
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-400 tracking-wider mb-2">
                    Faction Assignment
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPreferredTeam('ALPHA')}
                      className={`p-3 rounded-lg border text-left font-mono transition-all ${
                        preferredTeam === 'ALPHA'
                          ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 shadow-lg shadow-cyan-500/10'
                          : 'border-gray-800 bg-[#121824] text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-widest text-cyan-400">ALPHA</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      </div>
                      <div className="text-[10px] text-cyan-200/60 mt-1">Special Vanguard</div>
                    </button>

                    <button
                      onClick={() => setPreferredTeam('BRAVO')}
                      className={`p-3 rounded-lg border text-left font-mono transition-all ${
                        preferredTeam === 'BRAVO'
                          ? 'border-rose-500 bg-rose-950/30 text-rose-300 shadow-lg shadow-rose-500/10'
                          : 'border-gray-800 bg-[#121824] text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm tracking-widest text-rose-400">BRAVO</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      </div>
                      <div className="text-[10px] text-rose-200/60 mt-1">Apex Enforcers</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Summary of Active Loadout */}
              <div className="pt-2 border-t border-gray-800/80">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                  <span>DEPLOYMENT LOADOUT</span>
                  <button
                    onClick={() => setActiveTab('loadout')}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    Modify
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-[#121824] p-2 rounded border border-gray-800">
                    <div className="text-[9px] text-gray-500">PRIMARY</div>
                    <div className="text-xs font-bold text-white truncate">{selectedPrimary.name}</div>
                  </div>
                  <div className="bg-[#121824] p-2 rounded border border-gray-800">
                    <div className="text-[9px] text-gray-500">SIDEARM</div>
                    <div className="text-xs font-bold text-white truncate">{secondaryConfig.name}</div>
                  </div>
                  <div className="bg-[#121824] p-2 rounded border border-gray-800">
                    <div className="text-[9px] text-gray-500">MELEE</div>
                    <div className="text-xs font-bold text-white truncate">{meleeConfig.name}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Matchmaking Actions / Room Active View */}
            <div className="lg:col-span-7 bg-[#0b0f17]/90 backdrop-blur-md border border-gray-800/80 rounded-xl p-6 shadow-2xl flex flex-col justify-between min-h-[440px]">
              {!currentRoom ? (
                /* Not in a room yet */
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-black tracking-wider uppercase text-white font-mono flex items-center gap-2">
                      <Zap className="w-5 h-5 text-cyan-400" />
                      Matchmaking Hub
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Create a private tactical lobby, enter an existing room code, or deploy directly.
                    </p>
                  </div>

                  {/* Action 1: Quick Match & Bot Arena */}
                  <div className="bg-gradient-to-r from-cyan-950/40 via-[#101726] to-[#121824] p-5 rounded-xl border border-cyan-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-mono font-bold text-cyan-300 text-sm tracking-wider">
                          AUTOMATED QUICK DEPLOY
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {socketClient.isConnected()
                            ? 'Açık bir odaya katıl veya otomatik yeni bir karşılaşma başlat'
                            : 'Anında 60 FPS OUTPOST-09 haritasında botlarla karşılaşmaya başla'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-mono rounded uppercase">
                        Instant
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleQuickMatch}
                        className="py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black font-mono tracking-wider uppercase rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] text-xs sm:text-sm"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        {socketClient.isConnected() ? 'ONLINE HIZLI EŞLEŞ' : 'HIZLI OYNA (BOT ARENA)'}
                      </button>

                      <button
                        onClick={() => startPracticeMode(selectedMode)}
                        className="py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black font-mono tracking-wider uppercase rounded-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] text-xs sm:text-sm"
                      >
                        <Crosshair className="w-4 h-4" />
                        BOT ANTRENMAN ARENASI
                      </button>
                    </div>
                  </div>

                  {/* Action 2 & 3: Create Room or Join by Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create Room */}
                    <div className="bg-[#121824] p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                      <div>
                        <div className="font-mono font-bold text-white text-sm">CREATE CUSTOM LOBBY</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Generates a unique 6-character room code to invite teammates.
                        </div>
                      </div>

                      <button
                        onClick={handleCreateRoom}
                        disabled={isConnecting}
                        className="mt-4 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg border border-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Generate Room
                      </button>
                    </div>

                    {/* Join by Code */}
                    <div className="bg-[#121824] p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
                      <div>
                        <div className="font-mono font-bold text-white text-sm">JOIN BY ROOM CODE</div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Have an invite code? Paste or enter it here.
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                          placeholder="ROOM CODE"
                          maxLength={6}
                          className="w-full bg-[#0d121c] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-xs uppercase focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          onClick={handleJoinByCode}
                          disabled={isConnecting || !inputCode.trim()}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-mono font-bold text-xs uppercase rounded-lg transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* In a Room: Waiting Room Roster & Launch */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 tracking-wider">
                        ACTIVE OPERATIONS ROOM
                      </div>
                      <div className="text-xl font-black font-mono tracking-widest text-white flex items-center gap-2">
                        <span>ROOM #{currentRoom.id}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded font-normal">
                          {currentRoom.mode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(currentRoom.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-mono text-gray-200 rounded border border-gray-700 transition-colors"
                        title="Copy Room Code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? 'COPIED' : 'CODE'}
                      </button>

                      <button
                        onClick={() => handleCopyShareLink(currentRoom.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-xs font-mono text-cyan-300 rounded border border-cyan-800 transition-colors"
                        title="Copy Direct Link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                        {copiedLink ? 'LINK COPIED' : 'SHARE LINK'}
                      </button>
                    </div>
                  </div>

                  {/* Player Roster */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        DEPLOYED OPERATORS ({Object.keys(currentRoom.players).length}/{currentRoom.maxPlayers})
                      </span>
                      <span className="text-emerald-400 font-bold">READY</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {Object.values(currentRoom.players).map((p) => {
                        const isAlpha = p.team === 'ALPHA';
                        return (
                          <div
                            key={p.id}
                            className={`p-2.5 rounded-lg border font-mono flex items-center justify-between ${
                              isAlpha
                                ? 'bg-cyan-950/20 border-cyan-800/60'
                                : p.team === 'BRAVO'
                                ? 'bg-rose-950/20 border-rose-800/60'
                                : 'bg-gray-900/50 border-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isAlpha ? 'bg-cyan-400' : p.team === 'BRAVO' ? 'bg-rose-500' : 'bg-amber-400'
                                }`}
                              />
                              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                                {p.nickname}
                              </span>
                            </div>

                            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
                              <span>{p.currentWeapon}</span>
                              <span className="text-emerald-400">{p.ping}ms</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Launch Game Buttons */}
                  <div className="pt-4 border-t border-gray-800 flex items-center gap-3">
                    <button
                      onClick={() => setInGame(true)}
                      className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black font-mono tracking-widest uppercase rounded-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      ENTER ARENA NOW
                    </button>

                    <button
                      onClick={() => leaveRoom()}
                      className="px-4 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition-colors"
                      title="Leave Lobby"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ARSENAL & LOADOUT SELECTOR */}
        {activeTab === 'loadout' && (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h2 className="text-lg font-black font-mono uppercase tracking-wider text-white">
                  TACTICAL ARSENAL CONFIGURATOR
                </h2>
                <p className="text-xs text-gray-400 font-mono">
                  Select your primary service firearm. Secondary and melee weapons are standard-issue.
                </p>
              </div>

              <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded border border-cyan-800">
                ACTIVE LOADOUT SAVED
              </div>
            </div>

            {/* Primary Weapon Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRIMARY_WEAPONS.map((wId) => {
                const config = WEAPON_CONFIGS[wId];
                const isSelected = loadout.primary === wId;

                return (
                  <div
                    key={wId}
                    onClick={() => setLoadout({ primary: wId })}
                    className={`cursor-pointer rounded-xl p-5 border font-mono transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-gradient-to-b from-cyan-950/40 to-[#0e1422] shadow-xl shadow-cyan-500/10'
                        : 'border-gray-800 bg-[#0d121c] hover:border-gray-700 hover:bg-[#111724]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-cyan-400 text-black text-[9px] font-black px-2.5 py-0.5 uppercase tracking-wider rounded-bl">
                        EQUIPPED
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {config.category}
                      </div>
                      <div className="text-base font-black text-white tracking-wide mt-0.5">
                        {config.name}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {wId === 'AR-76' && 'Versatile standard rifle with lethal headshot multiplier and manageable spray.'}
                        {wId === 'SR-99' && 'Long-range bolt sniper with high-magnification scope and 1-tap headshot kill.'}
                        {wId === 'SMG-9' && 'CQC machine pistol with blistering 850 RPM rate of fire and rapid handling.'}
                        {wId === 'SG-12' && 'Heavy 8-pellet buckshot shotgun dealing immense point-blank damage.'}
                      </p>
                    </div>

                    {/* Stat Bars */}
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-800/80">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>DAMAGE</span>
                          <span className="text-cyan-300 font-bold">{config.damage}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400"
                            style={{ width: `${Math.min(100, (config.damage / 100) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>FIRE RATE</span>
                          <span className="text-cyan-300 font-bold">{config.fireRate} RPM</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${Math.min(100, (config.fireRate / 950) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>RANGE</span>
                          <span className="text-cyan-300 font-bold">{config.range}m</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${Math.min(100, (config.range / 300) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span>MAGAZINE</span>
                        <span className="text-white font-bold">{config.maxAmmo} / {config.reserveAmmo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Standard Secondary & Melee Displays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-800 bg-[#0d121c] font-mono flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">
                    STANDARD SIDEARM
                  </div>
                  <div className="text-sm font-black text-white">{secondaryConfig.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Heavy caliber 50 DMG hand cannon with match-grade stopping power.
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-gray-800 text-gray-300 text-[10px] rounded uppercase font-bold">
                    Fixed Slot
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-800 bg-[#0d121c] font-mono flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-rose-500 uppercase tracking-widest font-bold">
                    TACTICAL MELEE
                  </div>
                  <div className="text-sm font-black text-white">{meleeConfig.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Curved tactical knife. Instant critical damage on close-range lunges.
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-gray-800 text-gray-300 text-[10px] rounded uppercase font-bold">
                    Fixed Slot
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="w-full max-w-7xl flex items-center justify-between border-t border-gray-800/80 pt-4 text-xs font-mono text-gray-500 z-10">
        <div>CONTROLS: WASD Move • Shift Sprint • C Crouch • R Reload • Right-Click ADS • 1/2/3 Weapons • TAB Scores • ESC Settings</div>
        <div>OUTPOST-09 • 60HZ TICKRATE</div>
      </footer>
    </div>
  );
};
