import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorldsByCharacter } from '../../config/gameConfig';
import { getCompletedWorlds, computeWorldStatus, markWorldComplete } from '../../db/gameProgress';
import WorldNode        from './WorldNode';
import CircleTransition from './CircleTransition';
import './WorldMap.css';

const TUTORIAL_KEY = 'game_tutorial_seen';

/**
 * WorldMap — mapa de mundos estilo Mario Bros
 *
 * Lee character de localStorage.
 * Renderiza WorldNodes con scroll horizontal.
 * Maneja navegación a /game/level/:worldId y /bienvenida.
 */
export default function WorldMap() {
  const navigate = useNavigate();

  const character     = localStorage.getItem('selectedCharacter') || 'trabajador';
  const userName      = localStorage.getItem('nombre_trabajador')  || 'Operario';
  const characterName = localStorage.getItem('cargo_trabajador') || 'Operario';

  const worlds      = getWorldsByCharacter(character);
  const dailyWorlds = worlds.filter(w => w.daily !== false);

  const [completedIds, setCompletedIds] = useState(() => getCompletedWorlds());
  const completedCount = dailyWorlds.filter(w => completedIds.includes(w.id)).length;

  useEffect(() => {
    const worldId = localStorage.getItem('game_mode');
    if (worldId) {
      localStorage.removeItem('game_mode');
      markWorldComplete(worldId);
      setCompletedIds(getCompletedWorlds());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ZIGZAG = ['right', 'left', 'center'];
  const POS_X  = { right: '83%', left: '13%', center: '50%' };

  const [imgError, setImgError] = useState(false);

  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY)
  );
  const tutorialTimerRef = useRef(null);

  const dismissTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch { /* quota exceeded */ }
    clearTimeout(tutorialTimerRef.current);
  };

  useEffect(() => {
    if (!showTutorial) return;
    tutorialTimerRef.current = setTimeout(dismissTutorial, 6000);
    return () => clearTimeout(tutorialTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTutorial]);

  const [covering,    setCovering]    = useState(false);
  const [destination, setDestination] = useState(null);

  const navigateTo = (path) => {
    setDestination(path);
    setCovering(true);
  };

  const handleCoverDone = () => {
    if (destination) navigate(destination);
  };

  const progressPct = dailyWorlds.length > 0
    ? (completedCount / dailyWorlds.length) * 100
    : 0;

  return (
    <div className="wm-root">

      <div className="wm-clouds" aria-hidden="true">
        <span className="wm-cloud wm-cloud--1">☁️</span>
        <span className="wm-cloud wm-cloud--2">☁️</span>
        <span className="wm-cloud wm-cloud--3">☁️</span>
      </div>

      <header className="wm-header">
        <div className="wm-avatar-wrap">
          {!imgError ? (
            <img
              src={`/assets/${character}-idle.png`}
              alt={characterName}
              className="wm-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="wm-avatar-emoji" aria-hidden="true">
              👷
            </span>
          )}
        </div>

        <div className="wm-user-info">
          <span className="wm-user-name">{userName}</span>
          <span className={`wm-char-name wm-char-name--${character}`}>
            {characterName}
          </span>
        </div>

        <div className="wm-progress-wrap">
          <span className="wm-progress-label">
            {completedCount}/{dailyWorlds.length} misiones
          </span>
          <div
            className="wm-progress-bar"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemax={dailyWorlds.length}
            aria-label="Progreso del día"
          >
            <div
              className="wm-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {showTutorial && (
        <div className="wm-tutorial" role="status">
          <button
            className="wm-tutorial-close"
            onClick={dismissTutorial}
            aria-label="Cerrar tutorial"
          >
            ✕
          </button>
          <p className="wm-tutorial-text">
            ¡Hola, <strong>{characterName}</strong>! 👋
          </p>
          <p className="wm-tutorial-text">
            Empieza la misión por aquí 👇
          </p>
          <div className="wm-tutorial-tail" aria-hidden="true" />
        </div>
      )}

      <div className="wm-scroll">
        <div className="wm-track">

          {worlds.flatMap((world, index) => {
            const pos     = ZIGZAG[index % ZIGZAG.length];
            const posNext = ZIGZAG[(index + 1) % ZIGZAG.length];
            return [
              /* Nodo del mundo */
              <div key={world.id} className={`wm-node-slot wm-node-slot--${pos}`}>
                <WorldNode
                  world={world}
                  status={computeWorldStatus(world, completedIds, worlds)}
                  isHighlighted={index === 0 && showTutorial}
                  onClick={(id) => navigateTo(`/game/level/${id}`)}
                />
              </div>,

              index < worlds.length - 1 && (
                <svg
                  key={`conn-${world.id}`}
                  className="wm-connector-svg"
                  width="100%"
                  height="48"
                  aria-hidden="true"
                >
                  <line
                    x1={POS_X[pos]}     y1="0"
                    x2={POS_X[posNext]} y2="48"
                    stroke="rgba(255,210,80,0.6)"
                    strokeWidth="3"
                    strokeDasharray="8 5"
                    strokeLinecap="round"
                  />
                </svg>
              ),
            ];
          }).filter(Boolean)}

          <div className={`wm-finish wm-finish--${ZIGZAG[worlds.length % ZIGZAG.length]}`} aria-label="Meta final">
            <span className="wm-finish-flag">🏁</span>
          </div>

        </div>
      </div>

      <footer className="wm-footer">
        <button
          className="wm-salir"
          onClick={() => navigateTo('/bienvenida')}
        >
          ← Salir
        </button>
      </footer>

      {covering && (
        <CircleTransition direction="out" onDone={handleCoverDone} />
      )}

    </div>
  );
}
