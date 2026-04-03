import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsOperacionTorregrua() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-operacion-torregrua', { replace: true });
  }, [navigate]);
  return null;
}
