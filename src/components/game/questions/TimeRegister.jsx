/**
 * TimeRegister — captura automática de hora del dispositivo
 *
 * Props:
 *   question  object — { id, question, icon?, fieldName }
 *   onAnswer  fn     — (questionId, isoString: string) => void
 *
 * Flujo:
 *   1. Al montar: captura new Date() → congela la hora
 *   2. Typewriter escribe la pregunta
 *   3. Muestra hora en formato HH:MM a.m./p.m.
 *   4. Botón "Confirmar hora" → onAnswer(id, date.toISOString())
 *
 * El valor retornado es un ISO timestamp completo.
 * Conversión a HH:MM para el backend se hace en formParser (Fase 6C).
 */
import { useState } from 'react';
import TypewriterQuestion from './TypewriterQuestion';
import './TimeRegister.css';

/** Formatea un Date a "H:MM a.m./p.m." */
function formatDisplayTime(date) {
  let hours   = date.getHours();
  const mins  = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${period}`;
}

function TimeRegister({ question, onAnswer }) {
  // Captura una sola vez al montar (lazy initializer)
  const [capturedTime] = useState(() => new Date()); // frozen at mount time
  const [confirmed,   setConfirmed]   = useState(false);
  const [typingDone,  setTypingDone]  = useState(false);

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    onAnswer(question.id, capturedTime.toISOString());
  };

  const displayTime = formatDisplayTime(capturedTime);

  return (
    <div className="tr-root">

      {question.icon && (
        <div className="tr-icon" aria-hidden="true">{question.icon}</div>
      )}

      <div className="tr-bubble-wrap">
        <div className="tr-bubble">
          <TypewriterQuestion
            text={question.question}
            onDone={() => setTypingDone(true)}
          />
        </div>
        <div className="tr-tail" aria-hidden="true" />
      </div>

      <div className={`tr-clock-wrap${typingDone ? ' tr-clock-wrap--visible' : ''}`}>
        <div className="tr-clock" aria-label={`Hora registrada: ${displayTime}`}>
          <span className="tr-clock-icon" aria-hidden="true">🕐</span>
          <span className="tr-clock-time">{displayTime}</span>
          <span className="tr-clock-label">hora del dispositivo</span>
        </div>

        <button
          className={`tr-confirm-btn${confirmed ? ' tr-confirm-btn--done' : ''}`}
          onClick={handleConfirm}
          disabled={confirmed}
          aria-label="Confirmar hora registrada"
        >
          {confirmed ? '✓ Registrado' : 'Confirmar hora →'}
        </button>
      </div>

    </div>
  );
}

export default TimeRegister;
