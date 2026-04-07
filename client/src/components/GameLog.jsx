import { useEffect, useRef } from 'react';

export default function GameLog({ log }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="game-log">
      {log.map((entry, i) => (
        <div key={i} className="log-entry">{entry}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
