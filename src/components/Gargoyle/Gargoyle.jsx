import React, { useState, useEffect } from 'react';
import { Zap, Target, ShieldCheck, Flame } from 'lucide-react';
import './Gargoyle.css';

export default function Gargoyle() {
  const [stats, setStats] = useState({
    enabled: true,
    totalBlocked: 0,
    sessionBlocked: 0,
    blocklistSize: 0,
    recentBlocks: []
  });
  const [toggling, setToggling] = useState(false);

  const fetchStats = async () => {
    if (window.electronAPI?.getGargoyleStats) {
      const s = await window.electronAPI.getGargoyleStats();
      setStats(s);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    if (window.electronAPI?.toggleGargoyle) {
      const newState = await window.electronAPI.toggleGargoyle();
      setStats(prev => ({ ...prev, enabled: newState }));
    }
    setToggling(false);
  };

  return (
    <div className="gargoyle-page">
      {/* Cinematic Background matching Dashboard */}
      <div className="gargoyle-bg" />
      <div className="gargoyle-fog-layer" />

      <div className="gargoyle-inner">
        {/* Top Header */}
        <div className="gargoyle-header">
          <h1 className="gargoyle-title">GARGOYLE</h1>
          <p className="gargoyle-subtitle">Proprietary Network Interception</p>
        </div>

        {/* Central Layout */}
        <div className="gargoyle-core-layout">
          {/* Left Column: Floating Stats */}
          <div className="gargoyle-stats-column">
            <div className="gargoyle-stat-floating primary">
              <span className="stat-num">{stats.sessionBlocked.toLocaleString()}</span>
              <span className="stat-lbl">Hexes Banished</span>
            </div>
            <div className="gargoyle-stat-floating">
              <span className="stat-num">{stats.totalBlocked.toLocaleString()}</span>
              <span className="stat-lbl">Total Banished</span>
            </div>
            <div className="gargoyle-stat-floating">
              <span className="stat-num">{stats.blocklistSize.toLocaleString()}</span>
              <span className="stat-lbl">Known Wards</span>
            </div>
          </div>

          {/* Center Column: The Grand Ward (Toggle) */}
          <div className="gargoyle-center-ward">
            <button 
              className={`ward-toggle ${stats.enabled ? 'ward--active' : 'ward--dormant'} ${toggling ? 'toggling' : ''}`}
              onClick={handleToggle}
            >
              <div className="ward-rings">
                <div className="ward-ring ring-1"></div>
                <div className="ward-ring ring-2"></div>
                <div className="ward-ring ring-3"></div>
              </div>
              <div className="ward-core">
                <ShieldCheck size={64} className="ward-icon" strokeWidth={1} />
                <span className="ward-status-text">{stats.enabled ? 'ARMED' : 'DORMANT'}</span>
              </div>
            </button>
            <div className="ward-pulse-glow" />
          </div>

          {/* Right Column: Crucible Stream */}
          <div className="gargoyle-stream-column">
            <h2 className="stream-title">Crucible Log</h2>
            <div className="stream-fade-mask">
              <div className="stream-list">
                {stats.recentBlocks && stats.recentBlocks.length > 0 ? (
                  stats.recentBlocks.map((block, idx) => {
                    const d = new Date(block.timestamp);
                    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
                    return (
                      <div key={block.timestamp + idx} className="stream-entry">
                        <span className="stream-time">[{timeStr}]</span>
                        <span className="stream-url">{block.url}</span>
                        <span className="stream-status">BANISHED</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="stream-empty">The network is silent...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
