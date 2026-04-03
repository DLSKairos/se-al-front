/**
 * MultiSelectQuestion — grid de cards con flip 180° al seleccionar
 *
 * Props:
 *   question  object — {
 *     id, question, icon?,
 *     options: [{ value, label, icon? }],
 *     minSelections?, maxSelections?,
 *     fieldName
 *   }
 *   onAnswer  fn     — (questionId, value: string[]) => void
 *
 * Flujo:
 *   1. Typewriter escribe la pregunta
 *   2. Grid de cards aparece con bounceIn
 *   3. Tap en card → flip 180° (seleccionada/deseleccionada)
 *   4. Botón "Confirmar" activo cuando selected.size >= minSelections
 *   5. Confirmar → onAnswer(id, [...selected])
 */
import { useState } from 'react';
import TypewriterQuestion from './TypewriterQuestion';
import './MultiSelectQuestion.css';

function MultiSelectQuestion({ question, onAnswer }) {
  const [selected,   setSelected]   = useState(new Set());
  const [confirmed,  setConfirmed]  = useState(false);
  const [typingDone, setTypingDone] = useState(false);

  const minSelections = question.minSelections ?? 1;
  const maxSelections = question.maxSelections ?? 99;
  const options       = question.options ?? [];

  const toggleOption = (value) => {
    if (confirmed) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else if (next.size < maxSelections) {
        next.add(value);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size < minSelections || confirmed) return;
    setConfirmed(true);
    onAnswer(question.id, Array.from(selected));
  };

  const canConfirm = selected.size >= minSelections;

  return (
    <div className="msq-root">

      {question.icon && (
        <div className="msq-icon" aria-hidden="true">{question.icon}</div>
      )}

      <div className="msq-bubble-wrap">
        <div className="msq-bubble">
          <TypewriterQuestion
            text={question.question}
            onDone={() => setTypingDone(true)}
          />
        </div>
        <div className="msq-tail" aria-hidden="true" />
      </div>

      <div
        className={`msq-grid${typingDone ? ' msq-grid--visible' : ''}`}
        role="group"
        aria-label="Opciones"
      >
        {options.map(opt => {
          const isSelected = selected.has(opt.value);
          const isDisabled = confirmed || (!isSelected && selected.size >= maxSelections);

          return (
            <button
              key={opt.value}
              className={`msq-card${isSelected ? ' msq-card--selected' : ''}`}
              onClick={() => toggleOption(opt.value)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={opt.label}
            >
              <div className="msq-card-inner">

                <div className="msq-card-front">
                  {opt.icon && (
                    <span className="msq-card-opt-icon" aria-hidden="true">
                      {opt.icon}
                    </span>
                  )}
                  <span className="msq-card-label">{opt.label}</span>
                </div>

                <div className="msq-card-back">
                  <span className="msq-card-check" aria-hidden="true">✓</span>
                  <span className="msq-card-label">{opt.label}</span>
                </div>

              </div>
            </button>
          );
        })}
      </div>

      {typingDone && (
        <div className="msq-footer">
          <span className="msq-count" aria-live="polite">
            {selected.size}
            <span className="msq-count-sep">/</span>
            {minSelections} mín
          </span>
          <button
            className={`msq-confirm-btn${canConfirm ? ' msq-confirm-btn--ready' : ''}`}
            onClick={handleConfirm}
            disabled={!canConfirm || confirmed}
            aria-disabled={!canConfirm || confirmed}
          >
            {confirmed ? '✓ Listo' : 'Confirmar →'}
          </button>
        </div>
      )}

    </div>
  );
}

export default MultiSelectQuestion;
