/**
 * InventoryItemQuestion — pregunta de tipo inventario con 3 campos:
 *   Cantidad Buena (numérico), Cantidad Mala (numérico), Estado (texto)
 *
 * Props:
 *   question  { id, label }
 *   onAnswer  (questionId, { buena, mala, estado }) => void
 */
import { useState } from 'react';
import './TextInputQuestion.css';

export default function InventoryItemQuestion({ question, onAnswer }) {
  const [buena,  setBuena]  = useState('');
  const [mala,   setMala]   = useState('');
  const [estado, setEstado] = useState('');

  const handleSubmit = () => {
    onAnswer(question.id, {
      buena:  buena  || '0',
      mala:   mala   || '0',
      estado: estado || ''
    });
  };

  return (
    <div className="tiq-root">

      <div className="tiq-bubble-wrap">
        <div className="tiq-bubble" style={{ textAlign: 'center', fontWeight: 600 }}>
          {question.label || question.question}
        </div>
        <div className="tiq-tail" aria-hidden="true" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, justifyContent: 'center', flexWrap: 'wrap' }}>

        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#27ae60', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Buena
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={buena}
            onChange={e => setBuena(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            style={{
              width: 72,
              textAlign: 'center',
              padding: '10px 4px',
              borderRadius: 10,
              border: '2px solid #27ae60',
              fontSize: 18,
              fontWeight: 700,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#e74c3c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Mala
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={mala}
            onChange={e => setMala(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="0"
            style={{
              width: 72,
              textAlign: 'center',
              padding: '10px 4px',
              borderRadius: 10,
              border: '2px solid #e74c3c',
              fontSize: 18,
              fontWeight: 700,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#1976d2', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Estado
          </label>
          <input
            type="text"
            value={estado}
            onChange={e => setEstado(e.target.value)}
            placeholder="Ej: OK, Roto..."
            style={{
              width: 110,
              padding: '10px 8px',
              borderRadius: 10,
              border: '2px solid #1976d2',
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

      </div>

      <button
        type="button"
        className="tiq-confirm-btn"
        onClick={handleSubmit}
      >
        Confirmar →
      </button>
    </div>
  );
}
