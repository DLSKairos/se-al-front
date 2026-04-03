/**
 * TypewriterQuestion — texto con efecto typewriter
 *
 * Mismo patrón que StoryIntro.jsx líneas 53-82:
 *   setInterval a 50ms/char, cursor parpadeante, cleanup en return.
 *
 * Props:
 *   text   string  — texto a escribir
 *   speed  number  — ms por carácter (default 50)
 *   onDone fn      — callback cuando termina de escribir
 */
import { useState, useEffect, useRef } from 'react';
import './TypewriterQuestion.css';

function TypewriterQuestion({ text = '', speed = 50, onDone }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping,      setIsTyping]      = useState(true);

  const onDoneRef   = useRef(onDone);
  const intervalRef = useRef(null);

  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    setDisplayedText('');
    setIsTyping(true);

    let i = 0;

    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(intervalRef.current);
        setIsTyping(false);
        onDoneRef.current?.();
      }
    }, speed);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return (
    <p className="tq-text">
      {displayedText}
      {isTyping && <span className="tq-cursor" aria-hidden="true" />}
    </p>
  );
}

export default TypewriterQuestion;
