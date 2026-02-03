import { useEffect, useState, useCallback } from 'react';

function Fireworks({ trigger, teamColor, teamName, message }) {
  const [particles, setParticles] = useState([]);
  const [showMessage, setShowMessage] = useState(false);

  const createFirework = useCallback((x, y, color) => {
    const newParticles = [];
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 3;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: color || `hsl(${Math.random() * 360}, 100%, 60%)`,
        life: 1,
        size: 3 + Math.random() * 3,
      });
    }
    return newParticles;
  }, []);

  const launchFireworks = useCallback(() => {
    const colors = teamColor ? [teamColor, '#ffd700', '#ffffff'] : ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const allParticles = [];
    
    // Create multiple fireworks at random positions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = 100 + Math.random() * (window.innerWidth - 200);
        const y = 100 + Math.random() * (window.innerHeight / 2);
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        setParticles(prev => [...prev, ...createFirework(x, y, color)]);
      }, i * 200);
    }

    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  }, [teamColor, createFirework]);

  useEffect(() => {
    if (trigger > 0) {
      launchFireworks();
    }
  }, [trigger, launchFireworks]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity
            life: p.life - 0.02,
          }))
          .filter(p => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  if (particles.length === 0 && !showMessage) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Particles */}
      <svg className="absolute inset-0 w-full h-full">
        {particles.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size * p.life}
            fill={p.color}
            opacity={p.life}
          />
        ))}
      </svg>

      {/* Celebration Message */}
      {showMessage && message && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div 
            className="text-center animate-bounce px-8 py-4 rounded-lg shadow-2xl"
            style={{ 
              backgroundColor: teamColor || '#ffd700',
              color: '#000'
            }}
          >
            <div className="text-2xl font-bold mb-1">🎉 {message} 🎉</div>
            {teamName && (
              <div className="text-lg font-semibold">{teamName}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to manage fireworks state
export function useFireworks() {
  const [fireworksState, setFireworksState] = useState({
    trigger: 0,
    teamColor: null,
    teamName: null,
    message: null,
  });

  const celebrate = useCallback((message, teamName = null, teamColor = null) => {
    setFireworksState({
      trigger: Date.now(),
      teamColor,
      teamName,
      message,
    });
  }, []);

  return { fireworksState, celebrate };
}

export default Fireworks;
