/**
 * GameFlow — Orquestador del flujo de juego
 *
 * Props:
 *   step  'rotate' | 'story' | 'map'
 *
 * Flujo de navegación:
 *   /game/rotate-screen  →  /game/story-intro  →  /game/world-map
 */
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import RotateScreen     from './RotateScreen'
import StoryIntro       from './StoryIntro'
import WorldMap         from './WorldMap'
import CircleTransition from './CircleTransition'

interface GameFlowProps {
  step: 'rotate' | 'story' | 'map'
}

function GameFlow({ step }: GameFlowProps) {
  const navigate = useNavigate()

  const [revealing, setRevealing] = useState(step !== 'rotate')
  const [covering,  setCovering]  = useState(false)

  const character = localStorage.getItem('selectedCharacter') || 'trabajador'
  const obraName  =
    localStorage.getItem('obra') ||
    localStorage.getItem('nombre_proyecto') ||
    'la construcción'

  // Guardia: si no hay personaje seleccionado y no estamos en rotate, redirigir
  if (!localStorage.getItem('selectedCharacter') && step !== 'rotate') {
    return <Navigate to="/bienvenida" replace />
  }

  const handleStepComplete = () => setCovering(true)

  const handleCoverDone = () => {
    if (step === 'rotate') navigate('/game/story-intro', { replace: true })
    if (step === 'story')  navigate('/game/world-map',   { replace: true })
  }

  return (
    <>
      {step === 'rotate' && (
        <RotateScreen duration={4000} onComplete={handleStepComplete} />
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
        <CircleTransition direction="in" onDone={() => setRevealing(false)} />
      )}

      {covering && (
        <CircleTransition direction="out" onDone={handleCoverDone} />
      )}
    </>
  )
}

export default GameFlow
