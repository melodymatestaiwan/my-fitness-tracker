import React, { useState } from 'react';
import { Coins, ShoppingBag, Hammer, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../components';
import { MATERIALS, BUILDING_SLOTS, TIER_COLORS, TIER_NAMES } from '../buildingData';

export default function Building({ building, setBuilding }) {
  const [activeView, setActiveView] = useState('building'); // 'building' | 'shop'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast] = useState('');

  const coins = building.coins || 0;
  const placed = building.placed || {}; // { slotId: materialId }
  const inventory = building.inventory || []; // [materialId, ...]
  const streak = building.streak || 0;
  const missedDays = building.missedDays || 0;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  // --- 購買建材 ---
  const buyMaterial = (mat) => {
    if (coins < mat.price) return showToast('金幣不足！');
    setBuilding({
      ...building,
      coins: coins - mat.price,
      inventory: [...inventory, mat.id],
    });
    showToast(`購買了 ${mat.emoji} ${mat.name}！`);
  };

  // --- 放置建材到建築 ---
  const placeMaterial = (slotId, matId) => {
    const idx = inventory.indexOf(matId);
    if (idx === -1) return;
    const newInv = [...inventory];
    newInv.splice(idx, 1);
    setBuilding({
      ...building,
      placed: { ...placed, [slotId]: matId },
      inventory: newInv,
    });
    setSelectedSlot(null);
    showToast('建材已放置！');
  };

  // --- 移除建材（退回庫存）---
  const removeMaterial = (slotId) => {
    const matId = placed[slotId];
    if (!matId) return;
    const newPlaced = { ...placed };
    delete newPlaced[slotId];
    setBuilding({
      ...building,
      placed: newPlaced,
      inventory: [...inventory, matId],
    });
    showToast('建材已退回庫存');
  };

  // --- 風化狀態 ---
  const getDecayClass = (slotId) => {
    if (!placed[slotId]) return '';
    if (missedDays >= 7) return 'opacity-30 grayscale';
    if (missedDays >= 3) return 'opacity-50 grayscale-[50%]';
    if (missedDays >= 1) return 'opacity-70';
    return '';
  };

  // --- 建築檢視 ---
  const renderBuilding = () => {
    const rows = [5, 4, 3, 2, 1, 0]; // 由上到下
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <p className="text-white/40 font-black tracking-[0.5em] text-[10px] uppercase mb-2">Build Your Body. Build Your Legacy.</p>
          <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">My<br/><span className="text-[#FF5733]">Palace</span></h1>
        </div>

        {/* Coin & Streak Display */}
        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-4 text-center border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Gold</p>
            <p className="text-2xl font-black italic text-[#FFD700] flex items-center justify-center gap-2"><Coins size={20}/> {coins}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center border-white/5">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Streak</p>
            <p className="text-2xl font-black italic text-[#FF5733]">🔥 {streak} 天</p>
          </GlassCard>
        </div>

        {/* Decay Warning */}
        {missedDays > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-red-400 text-sm font-black">已漏練 {missedDays} 天</p>
              <p className="text-red-400/60 text-[10px]">
                {missedDays >= 7 ? '頂層已倒塌！快回來訓練！' : missedDays >= 3 ? '構件正在損壞中...' : '建築開始風化，趕快訓練！'}
              </p>
            </div>
          </div>
        )}

        {/* Building View */}
        <GlassCard className="py-8">
          <div className="flex flex-col items-center gap-1">
            {rows.map(row => {
              const slotsInRow = BUILDING_SLOTS.filter(s => s.row === row);
              return (
                <div key={row} className="flex gap-2 justify-center">
                  {slotsInRow.map(slot => {
                    const matId = placed[slot.id];
                    const mat = matId ? MATERIALS.find(m => m.id === matId) : null;
                    const decayClass = getDecayClass(slot.id);
                    const isSelected = selectedSlot === slot.id;
                    const isCollapsed = missedDays >= 7 && slot.row >= 4 && matId;

                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          if (matId) {
                            if (confirm(`移除 ${mat.emoji} ${mat.name}？（退回庫存）`)) removeMaterial(slot.id);
                          } else {
                            setSelectedSlot(isSelected ? null : slot.id);
                          }
                        }}
                        className={`
                          w-20 h-16 rounded-2xl flex flex-col items-center justify-center transition-all text-xs font-black border-2
                          ${isCollapsed ? 'border-red-500/30 bg-red-500/5 line-through opacity-30' :
                            mat ? `border-white/20 ${decayClass}` :
                            isSelected ? 'border-[#FF5733] bg-[#FF5733]/10 scale-105' :
                            'border-dashed border-white/10 hover:border-white/20'}
                        `}
                        style={mat && !isCollapsed ? { backgroundColor: mat.color + '20', borderColor: mat.color + '60' } : {}}
                      >
                        {isCollapsed ? (
                          <span className="text-lg">💥</span>
                        ) : mat ? (
                          <>
                            <span className="text-lg">{mat.emoji}</span>
                            <span className="text-[8px] text-white/40">{mat.name}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg opacity-20">{slot.icon}</span>
                            <span className="text-[8px] text-white/20">{slot.name}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Ground line */}
          <div className="mt-2 mx-8 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
        </GlassCard>

        {/* Place Material Panel (when slot selected) */}
        {selectedSlot && (
          <GlassCard className="border-[#FF5733]/30 bg-[#FF5733]/5 animate-slide-bottom">
            <h3 className="text-sm font-black text-white italic uppercase mb-4 flex items-center gap-2">
              <Hammer size={16} /> 放置建材到: {BUILDING_SLOTS.find(s => s.id === selectedSlot)?.name}
            </h3>
            {inventory.length === 0 ? (
              <p className="text-white/20 text-xs text-center py-4">庫存是空的，去商店購買建材吧！</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[...new Set(inventory)].map(matId => {
                  const mat = MATERIALS.find(m => m.id === matId);
                  const count = inventory.filter(i => i === matId).length;
                  return (
                    <button
                      key={matId}
                      onClick={() => placeMaterial(selectedSlot, matId)}
                      className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center hover:bg-white/10 transition-all"
                    >
                      <span className="text-2xl">{mat.emoji}</span>
                      <p className="text-[10px] font-black text-white/60 mt-1">{mat.name}</p>
                      <p className="text-[10px] text-white/30">x{count}</p>
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={() => setSelectedSlot(null)} className="w-full mt-3 py-2 text-white/30 text-[10px] font-black uppercase">取消</button>
          </GlassCard>
        )}

        {/* Inventory Summary */}
        {inventory.length > 0 && !selectedSlot && (
          <GlassCard className="p-4">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">庫存</h4>
            <div className="flex flex-wrap gap-2">
              {[...new Set(inventory)].map(matId => {
                const mat = MATERIALS.find(m => m.id === matId);
                const count = inventory.filter(i => i === matId).length;
                return (
                  <span key={matId} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs flex items-center gap-1">
                    {mat.emoji} {mat.name} <span className="text-white/30">x{count}</span>
                  </span>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Tab Switch */}
        <button
          onClick={() => setActiveView('shop')}
          className="w-full bg-[#FFD700] text-black font-black py-5 rounded-[2rem] shadow-xl uppercase italic tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag size={20} /> 建材商店
        </button>
      </div>
    );
  };

  // --- 商店 ---
  const renderShop = () => {
    const tiers = ['basic', 'advanced', 'rare', 'legendary'];
    return (
      <div className="space-y-8 animate-slide-right">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Material<br/><span className="text-[#FFD700]">Shop</span>
          </h1>
          <div className="bg-[#FFD700]/20 border border-[#FFD700]/30 rounded-2xl px-4 py-2 flex items-center gap-2">
            <Coins className="text-[#FFD700]" size={18} />
            <span className="text-[#FFD700] font-black italic text-lg">{coins}</span>
          </div>
        </div>

        {tiers.map(tier => (
          <div key={tier}>
            <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: TIER_COLORS[tier] }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[tier] }} />
              {TIER_NAMES[tier]}
            </h3>
            <div className="space-y-2">
              {MATERIALS.filter(m => m.tier === tier).map(mat => (
                <div key={mat.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{mat.emoji}</span>
                    <div>
                      <p className="text-white font-black italic text-sm">{mat.name}</p>
                      <p className="text-[10px] text-white/30 uppercase">{TIER_NAMES[mat.tier]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => buyMaterial(mat)}
                    disabled={coins < mat.price}
                    className={`px-5 py-2 rounded-2xl font-black text-xs italic flex items-center gap-1 transition-all ${
                      coins >= mat.price
                        ? 'bg-[#FFD700] text-black hover:brightness-110 active:scale-95'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    <Coins size={12} /> {mat.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setActiveView('building')}
          className="w-full py-4 rounded-[2rem] font-black text-sm text-white/40 border border-white/10 hover:bg-white/5 transition-all mb-12"
        >
          ← 返回建築
        </button>
      </div>
    );
  };

  return (
    <div className="pb-12">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-[#FFD700] text-black font-black px-6 py-3 rounded-2xl shadow-2xl text-sm italic animate-slide-bottom">
          {toast}
        </div>
      )}
      {activeView === 'building' ? renderBuilding() : renderShop()}
    </div>
  );
}
