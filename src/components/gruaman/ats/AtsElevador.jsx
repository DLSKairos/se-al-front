import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsElevador() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-elevador', { replace: true });
  }, [navigate]);
  return null;
}
