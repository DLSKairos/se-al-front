import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import RotateScreen     from './RotateScreen';
import StoryIntro       from './StoryIntro';
import WorldMap         from './WorldMap';
import CircleTransition from './CircleTransition';

/**
 * GameFlow — Orquestador del flujo de juego
 *
 * Props:
 *   step  'rotate' | 'story' | 'map'
 *
 * Flujo de navegación:
 *   /game/rotate-screen  →  /game/story-intro  →  /game/world-map
 *
 * CircleTransition:
 *   • Al montar 'story' y 'map': revela la pantalla (direction="in")
 *   • Al terminar cada paso:     cubre la pantalla (direction="out") → navega
 *
 * WorldMap se agrega en Fase 4.
 * LevelWrapper se agrega en Fase 5.
 */
function GameFlow({ step }) {
  const navigate = useNavigate();

  const [revealing, setRevealing] = useState(step !== 'rotate');
  const [covering,  setCovering]  = useState(false);

  const character = localStorage.getItem('selectedCharacter') || 'bomberman';
  const obraName  =
    localStorage.getItem('obra') ||
    localStorage.getItem('nombre_proyecto') ||
    'la construcción';

  if (!localStorage.getItem('selectedCharacter') && step !== 'rotate') {
    return <Navigate to="/bienvenida" replace />;
  }

  const handleStepComplete = () => setCovering(true);

  const handleCoverDone = () => {
    if (step === 'rotate') navigate('/game/story-intro', { replace: true });
    if (step === 'story')  navigate('/game/world-map',   { replace: true });
  };

  return (
    <>
      {step === 'rotate' && (
        <RotateScreen
          duration={4000}
          onComplete={handleStepComplete}
        />
      )}

      {step === 'story' && (
        <StoryIntro
          character={character}
          obraName={obraName}
          onComplete={handleStepComplete}
        />
      )}

      {step === 'map' && <WorldMap />}

      {revealing && (
        <CircleTransition
          direction="in"
          onDone={() => setRevealing(false)}
        />
      )}

      {covering && (
        <CircleTransition
          direction="out"
          onDone={handleCoverDone}
        />
      )}
    </>
  );
}


export default GameFlow;
