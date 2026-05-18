import { useEffect, useState } from 'react';

interface CounterAnimationProps {
  end: number;
  duration?: number;
}

export const CounterAnimation = ({ end, duration = 1000 }: CounterAnimationProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span className="font-bold mr-1">{count}</span>;
};