/**
 * TextInputQuestion — pregunta con campo de texto libre o número
 *
 * Props:
 *   question  object  — { id, type ('text'|'number'), question, icon?, placeholder?, min?, max? }
 *   onAnswer  fn      — (questionId, value: string) => void
 */
import { useState, useRef, useEffect } from 'react';
import TypewriterQuestion from './TypewriterQuestion';
import './TextInputQuestion.css';

function TextInputQuestion({ question, onAnswer }) {
  const [typingDone, setTypingDone] = useState(false);
  const [value,      setValue]      = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typingDone && inputRef.current) {
      inputRef.current.focus();
    }
  }, [typingDone]);

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(question.id, value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const isNumber = question.type === 'number';
  const isDate   = question.type === 'date';

  return (
    <div className="tiq-root">

      {question.icon && (
        <div className="tiq-icon" aria-hidden="true">{question.icon}</div>
      )}

      <div className="tiq-bubble-wrap">
        <div className="tiq-bubble">
          <TypewriterQuestion
            text={question.question}
            onDone={() => setTypingDone(true)}
          />
        </div>
        <div className="tiq-tail" aria-hidden="true" />
      </div>

      <div className={`tiq-input-wrap${typingDone ? ' tiq-input-wrap--visible' : ''}`}>
        <input
          ref={inputRef}
          className="tiq-input"
          type={isNumber ? 'number' : isDate ? 'date' : 'text'}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={question.placeholder || (isNumber ? '0' : isDate ? 'YYYY-MM-DD' : '')}
          min={question.min}
          max={question.max}
          disabled={submitted}
          aria-label={question.question}
        />
        <button
          className={`tiq-confirm-btn${submitted ? ' tiq-confirm-btn--done' : ''}`}
          onClick={handleSubmit}
          disabled={submitted}
          aria-label="Confirmar"
        >
          {submitted ? '✓' : '→'}
        </button>
      </div>

    </div>
  );
}

export default TextInputQuestion;
