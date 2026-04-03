import { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorldById, getCharacterName } from '../../config/gameConfig';
import CircleTransition  from './CircleTransition';
import QuestionWrapper   from './questions/QuestionWrapper';
import { parseFormToQuestions, submitFormData } from '../../utils/formParser';
import { markWorldComplete } from '../../db/gameProgress';
import { getTimerConfig } from '../../utils/questionTypes';
import './LevelWrapper.css';

/**
 * Mapea los identificadores de mundo (worldId) a sus componentes de formulario
 * cargados de forma diferida (lazy).
 *
 * Mantenido a nivel de módulo para que React nunca recree las referencias lazy
 * entre renderizados.
 */
const FORM_MAP = {
  'hora-ingreso':              lazy(() => import('../compartido/horada_ingreso')),
  'permiso-trabajo':           lazy(() => import('../compartido/permiso_trabajo')),
  'chequeo-altura':            lazy(() => import('../compartido/chequeo_alturas')),
  'hora-salida':               lazy(() => import('../compartido/hora_salida')),

  'planilla-bombeo':           lazy(() => import('../bomberman/planillabombeo')),
  'checklist':                 lazy(() => import('../bomberman/checklist')),
  'inspeccion-epcc-bomberman': lazy(() => import('../bomberman/inspeccion_epcc_bomberman')),
  'inventarios-obra':          lazy(() => import('../bomberman/inventariosobra')),
  'herramientas-mantenimiento':lazy(() => import('../bomberman/herramientas_mantenimiento')),
  'kit-limpieza':              lazy(() => import('../bomberman/kit_limpieza')),

  'chequeo-torregruas':        lazy(() => import('../gruaman/chequeo_torregruas')),
  'inspeccion-epcc':           lazy(() => import('../gruaman/inspeccion_epcc')),
  'inspeccion-izaje':          lazy(() => import('../gruaman/inspeccion_izaje')),
  'chequeo-elevador':          lazy(() => import('../gruaman/chequeo_elevador')),

  'ats':  lazy(() => import('../gruaman/AtsSelector')),
};

/**
 * Envoltorio de misión renderizado en /game/level/:worldId.
 *
 * Opera en uno de dos modos según si formParser retorna secciones para el worldId dado:
 *
 * Modo gamificado — mundos con secciones definidas en formParser:
 *   Renderiza secciones de forma secuencial mediante QuestionWrapper (flip 3D, confetti),
 *   acumula respuestas entre secciones, envía al backend en la última sección,
 *   marca el mundo como completado y navega de vuelta a /game/world-map.
 *
 * Modo formulario original — todos los demás mundos:
 *   Carga de forma diferida el componente de formulario correspondiente sin modificaciones.
 *   El formulario escribe game_mode en localStorage; WorldMap lo detecta al montar y
 *   marca el mundo como completado.
 *
 * Las respuestas se persisten en sessionStorage entre secciones para resistencia ante recargas.
 */
export default function LevelWrapper() {
  const { worldId } = useParams();
  const navigate    = useNavigate();

  const character     = localStorage.getItem('selectedCharacter') || 'bomberman';
  const characterName = getCharacterName(character);
  const world         = getWorldById(character, worldId);

  const [imgError,  setImgError]  = useState(false);
  const [revealing, setRevealing] = useState(true);

  const gamifiedSections = parseFormToQuestions(worldId);
  const isGamified       = !!gamifiedSections;

  const [sectionIdx,   setSectionIdx]   = useState(0);
  const [allAnswers,   setAllAnswers]   = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);
  const [missionDone,  setMissionDone]  = useState(false);

  const allAnswersRef = useRef({});

  useEffect(() => {
    if (!isGamified) return;
    try {
      const saved = sessionStorage.getItem('lw_answers_' + worldId);
      if (saved) {
        allAnswersRef.current = JSON.parse(saved);
      }
    } catch {
      // sessionStorage no disponible o JSON inválido — se inicia con estado vacío
    }
  }, [worldId, isGamified]);

  useEffect(() => {
    localStorage.setItem('game_mode', worldId);
  }, [worldId]);

  const FormComponent = FORM_MAP[worldId];
  useEffect(() => {
    if (!FormComponent && !isGamified) {
      navigate('/game/world-map', { replace: true });
    }
  }, [FormComponent, isGamified, navigate]);

  const shortName  = world?.name.replace(/^Misión:\s*/i, '') || worldId;
  const orderLabel = world?.order ? `MISIÓN ${world.order}` : 'MISIÓN';
  const isCrane    = character === 'gruaman';

  const handleExit = () => {
    localStorage.removeItem('game_mode');
    navigate('/game/world-map', { replace: true });
  };

  const handleSectionComplete = useCallback(async (sectionAnswers) => {
    const merged = { ...allAnswersRef.current, ...sectionAnswers };
    allAnswersRef.current = merged;
    setAllAnswers(merged);

    try {
      sessionStorage.setItem('lw_answers_' + worldId, JSON.stringify(merged));
    } catch {
      // sessionStorage no disponible — se continúa sin persistencia
    }

    if (sectionAnswers['__preamble__'] === 'skip') {
      markWorldComplete(worldId);
      localStorage.removeItem('game_mode');
      sessionStorage.removeItem('lw_answers_' + worldId);
      setMissionDone(true);
      setTimeout(() => navigate('/game/world-map', { replace: true }), 800);
      return;
    }

    const isLastSection = sectionIdx >= gamifiedSections.length - 1;

    if (!isLastSection) {
      setSectionIdx(prev => prev + 1);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitFormData(worldId, merged);
      markWorldComplete(worldId.startsWith('ats-') ? 'ats' : worldId);
      localStorage.removeItem('game_mode');
      sessionStorage.removeItem('lw_answers_' + worldId);
      setMissionDone(true);
      setTimeout(() => navigate('/game/world-map', { replace: true }), 1800);
    } catch (err) {
      const detalle = err?.response?.data?.detalle || err?.response?.data?.error || null;
      setSubmitError(detalle
        ? `Error del servidor: ${detalle}`
        : 'No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
      setSubmitting(false);
    }
  }, [sectionIdx, gamifiedSections, worldId, navigate]);

  const currentSection = isGamified ? gamifiedSections[sectionIdx] : null;
  const timerConfig    = currentSection?.enableTimer
    ? { duration: currentSection.timerDuration ?? getTimerConfig(currentSection.id)?.duration ?? 90 }
    : null;

  if (!FormComponent && !isGamified) return null;

  return (
    <div className="lw-root">

      <div className="lw-clouds" aria-hidden="true">
        <span className="lw-cloud lw-cloud--1">☁️</span>
        <span className="lw-cloud lw-cloud--2">☁️</span>
        <span className="lw-cloud lw-cloud--3">☁️</span>
      </div>

      <header className="lw-header">

        <div className="lw-avatar-wrap">
          {!imgError ? (
            <img
              src={`/assets/${character}-idle.png`}
              alt={characterName}
              className="lw-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="lw-avatar-emoji" aria-hidden="true">
              {isCrane ? '🏗️' : '💧'}
            </span>
          )}
        </div>

        <div className="lw-mission-info">
          <span className={`lw-mission-label lw-mission-label--${character}`}>
            {orderLabel}
          </span>
          <span className="lw-mission-name">{shortName}</span>
          {isGamified && (
            <span className="lw-section-progress">
              {currentSection?.name || ''} · {sectionIdx + 1}/{gamifiedSections.length}
            </span>
          )}
        </div>

        <button
          className="lw-exit-btn"
          onClick={handleExit}
          aria-label="Salir de la misión"
          title="Salir al mapa"
        >
          ✕
        </button>

      </header>

      {isGamified && !submitting && !missionDone && !submitError && currentSection && (
        <div className="lw-game-container">
          <QuestionWrapper
            key={currentSection.id}
            questions={currentSection.questions}
            sectionName={currentSection.name}
            timerConfig={timerConfig}
            onComplete={handleSectionComplete}
          />
        </div>
      )}

      {isGamified && submitting && (
        <div className="lw-status lw-status--loading" aria-live="polite">
          <span className="lw-status-icon">⏳</span>
          <p>Guardando misión…</p>
        </div>
      )}

      {isGamified && missionDone && (
        <div className="lw-status lw-status--success" aria-live="polite">
          <span className="lw-status-icon">🏆</span>
          <p>¡Misión completada!</p>
        </div>
      )}

      {isGamified && submitError && (
        <div className="lw-status lw-status--error" role="alert">
          <span className="lw-status-icon">⚠️</span>
          <p>{submitError}</p>
          <button
            className="lw-retry-btn"
            onClick={() => handleSectionComplete({})}
          >
            Reintentar
          </button>
        </div>
      )}

      {!isGamified && (
        <div className="lw-form-container">
          <Suspense fallback={<LevelLoading />}>
            <FormComponent />
          </Suspense>
        </div>
      )}

      {revealing && (
        <CircleTransition direction="in" onDone={() => setRevealing(false)} />
      )}

    </div>
  );
}

/**
 * Fallback de Suspense mostrado mientras el componente de formulario diferido se carga.
 */
function LevelLoading() {
  return (
    <div className="lw-loading" aria-live="polite">
      <span className="lw-loading-icon">⏳</span>
      <span>Cargando misión…</span>
    </div>
  );
}
