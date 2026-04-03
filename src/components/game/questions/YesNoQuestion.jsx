/**
 * YesNoQuestion — bocadillo de diálogo + botones táctiles
 *
 * Props:
 *   question  object  — { id, question, icon?, fieldName, customOptions? }
 *   onAnswer  fn      — (questionId, value, extraAnswers?) => void
 *
 * customOptions: array de { value, label, icon?, className?, negative? }
 *   Si está presente, reemplaza los botones SI/NO/NA predeterminados.
 *   Marcar negative:true en las opciones que deben pedir observación.
 *
 * Flujo:
 *   1. Typewriter escribe la pregunta
 *   2. Al terminar → botones aparecen con bounceIn
 *   3. Usuario selecciona:
 *        → opción negative:true → muestra campo observaciones → Continuar
 *        → resto              → llama onAnswer inmediatamente
 */
import { useState, useRef, useEffect } from 'react';
import TypewriterQuestion from './TypewriterQuestion';
import './YesNoQuestion.css';

const DEFAULT_OPTIONS = [
  { value: 'yes', label: 'Sí',  icon: '✓', className: 'ynq-btn--yes', negative: false },
  { value: 'no',  label: 'No',  icon: '✗', className: 'ynq-btn--no',  negative: true  },
  { value: 'na',  label: 'N/A', icon: '—', className: 'ynq-btn--na',  negative: false },
];

function YesNoQuestion({ question, onAnswer }) {
  const [typingDone, setTypingDone] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [showObs,    setShowObs]    = useState(false);
  const [obsText,    setObsText]    = useState('');
  const textareaRef = useRef(null);

  const options = question.customOptions || DEFAULT_OPTIONS;

  // Enfocar textarea cuando aparece
  useEffect(() => {
    if (showObs && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [showObs]);

  const handleSelect = (value) => {
    if (selected) return; // evitar doble tap
    setSelected(value);

    const opt = options.find(o => o.value === value);
    if (opt?.negative) {
      setShowObs(true); // esperar observación
    } else {
      onAnswer(question.id, value);
    }
  };

  const handleConfirm = () => {
    const extras = obsText.trim()
      ? { [question.id + '_obs']: obsText.trim() }
      : {};
    onAnswer(question.id, selected, extras);
  };

  return (
    <div className="ynq-root">

      {question.icon && (
        <div className="ynq-icon" aria-hidden="true">
          {question.icon}
        </div>
      )}

      <div className="ynq-bubble-wrap">
        <div className="ynq-bubble">
          <TypewriterQuestion
            text={question.question}
            onDone={() => setTypingDone(true)}
          />
        </div>
        <div className="ynq-tail" aria-hidden="true" />
      </div>

      <div className={`ynq-buttons${typingDone ? ' ynq-buttons--visible' : ''}${options.length > 3 ? ' ynq-buttons--many' : ''}`}>
        {options.map(opt => (
          <button
            key={opt.value}
            className={`ynq-btn ${opt.className || 'ynq-btn--na'}${selected === opt.value ? ' ynq-btn--chosen' : ''}`}
            onClick={() => handleSelect(opt.value)}
            disabled={!!selected}
            aria-label={opt.label}
            aria-pressed={selected === opt.value}
          >
            <span className="ynq-btn-icon">{opt.icon}</span>
            <span className="ynq-btn-label">{opt.label}</span>
          </button>
        ))}
      </div>

      {showObs && (
        <div className="ynq-obs-wrap" role="region" aria-label="Observaciones">
          <label className="ynq-obs-label" htmlFor={`obs-${question.id}`}>
            ¿Por qué? <span className="ynq-obs-optional">(opcional)</span>
          </label>
          <textarea
            id={`obs-${question.id}`}
            ref={textareaRef}
            className="ynq-obs-textarea"
            value={obsText}
            onChange={e => setObsText(e.target.value)}
            placeholder="Escribe una observación..."
            rows={3}
          />
          <button className="ynq-obs-btn" onClick={handleConfirm}>
            Continuar →
          </button>
        </div>
      )}

    </div>
  );
}

export default YesNoQuestion;
