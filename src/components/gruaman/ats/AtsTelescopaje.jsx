import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AtsTelescopaje() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/game/level/ats-telescopaje', { replace: true });
  }, [navigate]);
  return null;
}
