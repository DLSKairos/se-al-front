import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsMontajeElevador() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-montaje-elevador', { replace: true });
  }, [navigate]);
  return null;
}
