import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsDesmontajeTorregrua() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-desmontaje-torregrua', { replace: true });
  }, [navigate]);
  return null;
}
