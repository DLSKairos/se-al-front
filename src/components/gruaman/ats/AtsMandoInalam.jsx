import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsMandoInalam() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-mando-inalam', { replace: true });
  }, [navigate]);
  return null;
}
