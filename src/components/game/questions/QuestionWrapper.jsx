/**
 * QuestionWrapper — orquestador de preguntas con flip 3D
 *
 * Props:
 *   questions    array   — [{ id, type, question, icon?, critical?, fieldName, ...}]
 *   onComplete   fn      — (answers: object) => void  al terminar todas
 *   sectionName  string  — nombre de la sección (para aria)
 *   timerConfig  object? — { duration: number } — si está presente, muestra TimerChallenge
 *
 * Flujo por pregunta:
 *   1. phase='enter'  → card entra con flipIn  (350ms)  → phase='idle'
 *   2. Usuario responde
 *   3. phase='exit'   → card sale con flipOut  (350ms)
 *   4. phase='celebrating' → MicroCelebration  (~900ms)  → onDone
 *   5. Si quedan preguntas → setCurrentIndex++ → vuelve a 1
 *      Si no quedan        → onComplete(answers)
 *
 * Importante: MicroCelebration se muestra DESPUÉS del flip-out,
 * NO durante.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import YesNoQuestion       from './YesNoQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import TimeRegister        from './TimeRegister';
import TimerChallenge      from './TimerChallenge';
import MicroCelebration    from './MicroCelebration';
import TextInputQuestion      from './TextInputQuestion';
import InventoryItemQuestion  from './InventoryItemQuestion';
import './QuestionWrapper.css';

const FLIP_DURATION = 350; // ms — debe coincidir con la duración CSS

function QuestionWrapper({ questions = [], onComplete, sectionName = '', timerConfig = null }) {
  const [currentIndex,    setCurrentIndex]    = useState(0);
  const [phase,           setPhase]           = useState('enter');
  const [celebrationType, setCelebrationType] = useState('positive');

  const answersRef      = useRef({});
  const currentIdxRef   = useRef(0);
  const onCompleteRef   = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => { currentIdxRef.current = currentIndex; }, [currentIndex]);

  useEffect(() => {
    setPhase('enter');
    const t = setTimeout(
      () => setPhase(prev => prev === 'enter' ? 'idle' : prev),
      FLIP_DURATION
    );
    return () => clearTimeout(t);
  }, [currentIndex]);

  const handleAnswer = useCallback((questionId, value, extraAnswers = {}) => {
    answersRef.current = { ...answersRef.current, [questionId]: value, ...extraAnswers };

    setCelebrationType(
      value === 'yes' ? 'positive'
      : value === 'no' ? 'negative'
      : 'neutral'
    );

    setPhase('exit');
    setTimeout(() => setPhase('celebrating'), FLIP_DURATION);
  }, []);

  const handleCelebrationDone = useCallback(() => {
    const next = currentIdxRef.current + 1;
    if (next >= questions.length) {
      // Diferir al siguiente tick para salir del ciclo de efectos actual
      setTimeout(() => onCompleteRef.current?.(answersRef.current), 0);
    } else {
      setCurrentIndex(next); // dispara el useEffect de entrada
    }
  }, [questions.length]);

  const current = questions[currentIndex];
  if (!current) return null;

  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="qw-root" aria-label={sectionName || 'Preguntas'}>

      {timerConfig && (
        <div className="qw-timer-slot">
          <TimerChallenge
            duration={timerConfig.duration}
            onExpire={timerConfig.onExpire}
          />
        </div>
      )}

      <div
        className="qw-progress-wrap"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label={`Pregunta ${currentIndex + 1} de ${questions.length}`}
      >
        <div className="qw-progress-track">
          <div className="qw-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="qw-counter">
          {currentIndex + 1}
          <span className="qw-counter-sep">/</span>
          {questions.length}
        </span>
      </div>

      <div className="qw-scene">
        <div
          className={[
            'qw-card',
            phase === 'exit'  && 'qw-card--exit',
            phase === 'enter' && 'qw-card--enter',
          ].filter(Boolean).join(' ')}
        >

          {(current.type === 'yesno' || !current.type) && (
            <YesNoQuestion
              key={current.id}
              question={current}
              onAnswer={handleAnswer}
            />
          )}

          {current.type === 'multiselect' && (
            <MultiSelectQuestion
              key={current.id}
              question={current}
              onAnswer={handleAnswer}
            />
          )}

          {current.type === 'time' && (
            <TimeRegister
              key={current.id}
              question={current}
              onAnswer={handleAnswer}
            />
          )}

          {(current.type === 'text' || current.type === 'number' || current.type === 'date') && (
            <TextInputQuestion
              key={current.id}
              question={current}
              onAnswer={handleAnswer}
            />
          )}

          {current.type === 'inventory-item' && (
            <InventoryItemQuestion
              key={current.id}
              question={current}
              onAnswer={handleAnswer}
            />
          )}

          {current.type && !['yesno', 'multiselect', 'time', 'text', 'number', 'date', 'inventory-item'].includes(current.type) && (
            <div className="qw-fallback">
              <p className="qw-fallback-text">{current.question}</p>
              <button
                className="qw-fallback-btn"
                onClick={() => handleAnswer(current.id, null)}
              >
                Continuar →
              </button>
            </div>
          )}

        </div>
      </div>

      <MicroCelebration
        show={phase === 'celebrating'}
        type={celebrationType}
        onDone={handleCelebrationDone}
      />

    </div>
  );
}

export default QuestionWrapper;
