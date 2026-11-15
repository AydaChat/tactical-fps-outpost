'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { socketClient } from '@/network/socketClient';
import {
  Sliders,
  Volume2,
  Monitor,
  Gamepad2,
  Copy,
  Check,
  RotateCcw,
  LogOut,
  X,
  Radio,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    currentRoom,
    leaveRoom,
    audioSettings,
    updateAudioSettings,
    graphicsSettings,
    updateGraphicsSettings,
    controlSettings,
    updateControlSettings,
    resetSettingsToDefault,
    ping,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'controls' | 'audio' | 'graphics' | 'match'>('controls');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isSettingsOpen) return null;

  const handleCopyCode = () => {
    if (currentRoom && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentRoom.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyShareLink = () => {
    if (currentRoom && typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?room=${currentRoom.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleLeaveMatch = () => {
    socketClient.leaveRoom();
    setSettingsOpen(false);
  };

  const CROSSHAIR_COLORS = [
    { name: 'Cyan', hex: '#00f0ff' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Gold', hex: '#eab308' },
    { name: 'Crimson', hex: '#ff4655' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Purple', hex: '#a855f7' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none font-mono">
      <div className="w-full max-w-3xl bg-[#0b0f17] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0e1420] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-black font-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-widest text-white uppercase">
                TACTICAL CONFIGURATION
              </h2>
              <p className="text-xs text-gray-400">
                Adjust input sensitivity, audio mixing, display options, and room management.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-800/80 bg-[#090c12]">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'controls'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Controls
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'audio'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Audio
          </button>

          <button
            onClick={() => setActiveTab('graphics')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'graphics'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" /> Graphics & HUD
          </button>

          <button
            onClick={() => setActiveTab('match')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono text-xs uppercase tracking-wider font-bold transition-all ${
              activeTab === 'match'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> Match Info
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* TAB 1: CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Mouse Sensitivity */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">Mouse Sensitivity</span>
                  <span className="text-cyan-400 font-bold">{controlSettings.mouseSensitivity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={controlSettings.mouseSensitivity}
                  onChange={(e) =>
                    updateControlSettings({ mouseSensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>Low (0.1)</span>
                  <span>Default (1.2)</span>
                  <span>High (5.0)</span>
                </div>
              </div>

              {/* ADS Sensitivity Multiplier */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">ADS Sensitivity Multiplier</span>
                  <span className="text-cyan-400 font-bold">
                    {controlSettings.adsSensitivityMultiplier.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.05"
                  value={controlSettings.adsSensitivityMultiplier}
                  onChange={(e) =>
                    updateControlSettings({ adsSensitivityMultiplier: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Invert Y-Axis */}
              <div className="flex items-center justify-between p-4 bg-[#111622] rounded-xl border border-gray-800">
                <div>
                  <div className="text-xs font-bold text-white uppercase">Invert Y-Axis</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Reverse vertical mouse look direction
                  </div>
                </div>
                <button
                  onClick={() => updateControlSettings({ invertY: !controlSettings.invertY })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    controlSettings.invertY ? 'bg-cyan-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      controlSettings.invertY ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              {/* Master Volume */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">Master Volume</span>
                  <span className="text-cyan-400 font-bold">{audioSettings.masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings.masterVolume}
                  onChange={(e) => updateAudioSettings({ masterVolume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">Sound Effects (SFX / Weapons)</span>
                  <span className="text-cyan-400 font-bold">{audioSettings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings.sfxVolume}
                  onChange={(e) => updateAudioSettings({ sfxVolume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Hitmarker Audio Volume */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">Hitmarker & Headshot Chime</span>
                  <span className="text-cyan-400 font-bold">{audioSettings.hitmarkerVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings.hitmarkerVolume}
                  onChange={(e) => updateAudioSettings({ hitmarkerVolume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Music Volume */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">Music Volume</span>
                  <span className="text-cyan-400 font-bold">{audioSettings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings.musicVolume}
                  onChange={(e) => updateAudioSettings({ musicVolume: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: GRAPHICS & HUD */}
          {activeTab === 'graphics' && (
            <div className="space-y-6">
              {/* FOV Slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-gray-200 uppercase">Field of View (FOV)</span>
                  <span className="text-cyan-400 font-bold">{graphicsSettings.fov}°</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="110"
                  value={graphicsSettings.fov}
                  onChange={(e) => updateGraphicsSettings({ fov: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 bg-gray-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>60° (Narrow)</span>
                  <span>85° (Default)</span>
                  <span>110° (Ultra-Wide)</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-[#111622] rounded-xl border border-gray-800">
                  <div>
                    <div className="text-xs font-bold text-white uppercase">FPS Display</div>
                    <div className="text-[10px] text-gray-400">Show frame rate counter</div>
                  </div>
                  <button
                    onClick={() => updateGraphicsSettings({ showFps: !graphicsSettings.showFps })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      graphicsSettings.showFps ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        graphicsSettings.showFps ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#111622] rounded-xl border border-gray-800">
                  <div>
                    <div className="text-xs font-bold text-white uppercase">Screen Shake</div>
                    <div className="text-[10px] text-gray-400">Recoil & explosion feedback</div>
                  </div>
                  <button
                    onClick={() =>
                      updateGraphicsSettings({ screenShake: !graphicsSettings.screenShake })
                    }
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      graphicsSettings.screenShake ? 'bg-cyan-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        graphicsSettings.screenShake ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Crosshair Customization */}
              <div className="p-4 bg-[#111622] rounded-xl border border-gray-800 space-y-4">
                <div className="text-xs font-bold text-white uppercase">Crosshair Styling</div>

                {/* Color presets */}
                <div>
                  <div className="text-[11px] text-gray-400 mb-2">Color Preset</div>
                  <div className="flex items-center gap-3">
                    {CROSSHAIR_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => updateGraphicsSettings({ crosshairColor: c.hex })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          graphicsSettings.crosshairColor === c.hex
                            ? 'scale-110 border-white shadow-lg'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Size & Gap */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Size</span>
                      <span className="text-cyan-400">{graphicsSettings.crosshairSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={graphicsSettings.crosshairSize}
                      onChange={(e) =>
                        updateGraphicsSettings({ crosshairSize: parseInt(e.target.value) })
                      }
                      className="w-full accent-cyan-400 bg-gray-800 h-1.5 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Center Gap</span>
                      <span className="text-cyan-400">{graphicsSettings.crosshairGap}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={graphicsSettings.crosshairGap}
                      onChange={(e) =>
                        updateGraphicsSettings({ crosshairGap: parseInt(e.target.value) })
                      }
                      className="w-full accent-cyan-400 bg-gray-800 h-1.5 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MATCH INFO */}
          {activeTab === 'match' && (
            <div className="space-y-6">
              {currentRoom ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#111622] rounded-xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">CURRENT ROOM CODE</div>
                      <div className="text-2xl font-black text-cyan-400 tracking-wider">
                        {currentRoom.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded-lg transition-colors border border-gray-700"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiedCode ? 'COPIED' : 'COPY CODE'}
                      </button>

                      <button
                        onClick={handleCopyShareLink}
                        className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 text-xs text-cyan-300 rounded-lg transition-colors border border-cyan-800"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copiedLink ? 'LINK COPIED' : 'SHARE LINK'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#111622] rounded-xl border border-gray-800">
                      <div className="text-[10px] text-gray-400">SERVER FREQUENCY</div>
                      <div className="text-base font-bold text-emerald-400 mt-1">60Hz Tick Rate</div>
                    </div>
                    <div className="p-4 bg-[#111622] rounded-xl border border-gray-800">
                      <div className="text-[10px] text-gray-400">NETWORK LATENCY</div>
                      <div className="text-base font-bold text-cyan-400 mt-1">{ping} ms RTT</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs">
                  Not currently connected to any multiplayer room.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#090c12] border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={resetSettingsToDefault}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-xs text-gray-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Defaults
            </button>

            {currentRoom && (
              <button
                onClick={handleLeaveMatch}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-xs text-rose-300 rounded-lg border border-rose-800/60 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Leave Match
              </button>
            )}
          </div>

          <button
            onClick={() => setSettingsOpen(false)}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all"
          >
            Resume Game [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
