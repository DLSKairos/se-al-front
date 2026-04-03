import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { markWorldComplete } from '../../db/gameProgress';

const ATS_LIST = [
  { worldId: 'ats-operacion-torregrua',   nombre: 'Operación de Torre Grúa',                    icon: '🏗️' },
  { worldId: 'ats-mando-inalam',          nombre: 'Torre Grúa con Mando Inalámbrico desde Piso', icon: '📡' },
  { worldId: 'ats-montaje-torregrua',     nombre: 'Montaje de Torre Grúas',                      icon: '🔧' },
  { worldId: 'ats-montaje-elevador',      nombre: 'Montaje Elevador de Carga',                   icon: '🛗' },
  { worldId: 'ats-desmontaje-torregrua',  nombre: 'Desmontaje de Torre Grúa',                    icon: '🔩' },
  { worldId: 'ats-telescopaje',           nombre: 'Telescopaje',                                 icon: '🔭' },
  { worldId: 'ats-mantenimiento',         nombre: 'Mantenimiento',                               icon: '⚙️' },
  { worldId: 'ats-elevador',              nombre: 'Elevador de Carga',                           icon: '⬆️' },
];

const btn = {
  base: {
    background: 'rgba(20, 20, 35, 0.85)',
    border: '1.5px solid rgba(255,193,7,0.3)',
    borderRadius: 14,
    padding: '20px 12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
    boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
    textAlign: 'center',
  },
};

export default function AtsSelector() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const inGame    = location.pathname.startsWith('/game/level/');
  const [preamble, setPreamble] = useState(inGame); // true → mostrar preamble primero

  function handleNo() {
    markWorldComplete('ats');
    localStorage.removeItem('game_mode');
    navigate('/game/world-map', { replace: true });
  }

  function handleAts(worldId) {
    navigate(`/game/level/${worldId}`);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px 40px',
      boxSizing: 'border-box',
    }}>
      {/* Encabezado */}
      <div style={{
        width: '100%',
        maxWidth: 560,
        background: 'rgba(20, 20, 35, 0.88)',
        borderRadius: 16,
        padding: '20px 20px 16px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,193,7,0.25)',
      }}>
        {!inGame && (
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#ffc107', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '4px 0', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Volver
          </button>
        )}
        <h1 style={{ color: '#ffc107', fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: 0.3 }}>
          ATS — Análisis de Trabajo Seguro
        </h1>
        <p style={{ color: '#e0e0e0', fontSize: 15, margin: 0, lineHeight: 1.4 }}>
          {preamble ? '¿Debes llenar un ATS hoy?' : '¿Qué actividad vas a realizar?'}
        </p>
      </div>

      {/* PREAMBLE: ¿Debes llenarlo hoy? */}
      {preamble ? (
        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            onClick={() => setPreamble(false)}
            style={{ ...btn.base, padding: '22px 16px', border: '1.5px solid rgba(76,175,80,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4caf50'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(76,175,80,0.5)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: 32 }}>✅</span>
            <span style={{ color: '#f5f5f5', fontSize: 15, fontWeight: 700 }}>Sí, voy a llenar un ATS</span>
          </button>
          <button
            onClick={handleNo}
            style={{ ...btn.base, padding: '22px 16px', border: '1.5px solid rgba(244,67,54,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f44336'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(244,67,54,0.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: 32 }}>❌</span>
            <span style={{ color: '#f5f5f5', fontSize: 15, fontWeight: 700 }}>No, hoy no aplica</span>
          </button>
        </div>
      ) : (
        /* SELECTOR DE ACTIVIDAD */
        <div style={{ width: '100%', maxWidth: 560, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {ATS_LIST.map((ats) => (
            <button
              key={ats.worldId}
              onClick={() => handleAts(ats.worldId)}
              style={btn.base}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffc107'; e.currentTarget.style.background = 'rgba(40,35,10,0.92)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,193,7,0.3)'; e.currentTarget.style.background = 'rgba(20,20,35,0.85)'; e.currentTarget.style.transform = 'scale(1)'; }}
              aria-label={`ATS: ${ats.nombre}`}
            >
              <span style={{ fontSize: 36, lineHeight: 1 }}>{ats.icon}</span>
              <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{ats.nombre}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
