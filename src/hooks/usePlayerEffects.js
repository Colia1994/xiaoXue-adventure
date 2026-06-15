import { useState, useEffect, useRef } from 'react';

export function useDelayedHp(hp, maxHp) {
  const [delayedHp, setDelayedHp] = useState(hp);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hp < delayedHp) {
      timerRef.current = setTimeout(() => setDelayedHp(hp), 600);
    } else {
      setDelayedHp(hp);
    }
  }, [hp]);

  return Math.max(0, (delayedHp / maxHp) * 100);
}

export function useArmorBounce(armor) {
  const [bounce, setBounce] = useState(false);
  const prevRef = useRef(armor);

  useEffect(() => {
    if (armor > prevRef.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 400);
      prevRef.current = armor;
      return () => clearTimeout(t);
    }
    prevRef.current = armor;
  }, [armor]);

  return bounce;
}
