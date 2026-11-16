import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#6366f1'],
  });
}

