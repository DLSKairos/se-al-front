import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsMantenimiento() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-mantenimiento', { replace: true });
  }, [navigate]);
  return null;
}
