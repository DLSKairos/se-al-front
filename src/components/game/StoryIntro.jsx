import { useState, useEffect, useRef } from 'react';
import './StoryIntro.css';

const TYPEWRITER_SPEED = 50; // ms por carácter
const DIALOG_PAUSE    = 1600; // ms de pausa después de terminar de tipear

function buildDialogs(characterName, obraName) {
  return [
    `${characterName}, hoy tienes una jornada importante por delante`,
    `En ${obraName}, tu trabajo marca la diferencia`,
    `Completa tus registros del día para mantener la operación al día`,
    `Todo listo. ¡Que tengas una jornada segura!`,
  ];
}

/**
 * StoryIntro — intro cinematográfica con diálogos tipo typewriter
 *
 * Props:
 *   character  string  — clave del personaje (ignorada; el nombre viene de localStorage)
 *   obraName   string  — nombre de la obra seleccionada
 *   onComplete fn      — callback al terminar todos los diálogos
 */
function StoryIntro({ character = 'trabajador', obraName = 'la obra', onComplete }) {
  const characterName = localStorage.getItem('cargo_trabajador') || 'Operario';
  const dialogs       = buildDialogs(characterName, obraName);

  const [dialogIndex,   setDialogIndex]   = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping,      setIsTyping]      = useState(true);
  const [imgError,      setImgError]      = useState(false);

  const onCompleteRef   = useRef(onComplete);
  const typeIntervalRef = useRef(null);
  const autoTimerRef    = useRef(null);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const clearAll = () => {
    clearInterval(typeIntervalRef.current);
    clearTimeout(autoTimerRef.current);
  };

  const handleSkip = () => {
    clearAll();
    onCompleteRef.current?.();
  };

  useEffect(() => {
    clearAll();
    setDisplayedText('');
    setIsTyping(true);

    let i = 0;
    const text = dialogs[dialogIndex];

    typeIntervalRef.current = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(typeIntervalRef.current);
        setIsTyping(false);

        autoTimerRef.current = setTimeout(() => {
          if (dialogIndex < dialogs.length - 1) {
            setDialogIndex(prev => prev + 1);
          } else {
            onCompleteRef.current?.();
          }
        }, DIALOG_PAUSE);
      }
    }, TYPEWRITER_SPEED);

    return clearAll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogIndex]);

  const charEmoji = '👷';

  return (
    <div className="si-overlay">

      <div className="si-bg" />

      <div className="si-skip-wrap">
        <span className="si-skip-label">Saltar intro</span>
        <button className="si-skip" onClick={handleSkip} aria-label="Saltar introducción">
          <span className="si-skip-arrows">»</span>
        </button>
      </div>

      <div className="si-character">
        {!imgError ? (
          <img
            src={`/assets/${character}-idle.png`}
            alt={characterName}
            className="si-character-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="si-character-emoji" aria-hidden="true">
            {charEmoji}
          </div>
        )}
      </div>

      <div className="si-bubble-wrap">
        <div className="si-bubble">
          <p className="si-text">
            {displayedText}
            {isTyping && <span className="si-cursor" aria-hidden="true" />}
          </p>
        </div>
        <div className="si-tail" aria-hidden="true" />
      </div>

      <div className="si-dots" role="status" aria-label={`Diálogo ${dialogIndex + 1} de ${dialogs.length}`}>
        {dialogs.map((_, i) => (
          <span
            key={i}
            className={[
              'si-dot',
              i === dialogIndex ? 'si-dot--active' : '',
              i < dialogIndex   ? 'si-dot--done'   : '',
            ].join(' ')}
          />
        ))}
      </div>

    </div>
  );
}

export default StoryIntro;
