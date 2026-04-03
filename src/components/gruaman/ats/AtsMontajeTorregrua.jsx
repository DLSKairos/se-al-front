import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsMontajeTorregrua() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-montaje-torregrua', { replace: true });
  }, [navigate]);
  return null;
}
