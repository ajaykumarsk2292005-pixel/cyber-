const getStorageKeys = (sessionNumber: number) => ({
  remaining: `session_${sessionNumber}_timeleft`,
  deadline: `session_${sessionNumber}_deadline`,
});

const readNonNegativeInteger = (value: string | null) => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
};

export const getSessionTimeLeft = (sessionNumber: number, durationSeconds: number) => {
  const { remaining, deadline } = getStorageKeys(sessionNumber);
  const storedDeadline = Number(localStorage.getItem(deadline));

  if (Number.isFinite(storedDeadline) && storedDeadline > 0) {
    return Math.max(0, Math.min(durationSeconds, Math.ceil((storedDeadline - Date.now()) / 1000)));
  }

  return Math.max(0, Math.min(durationSeconds, readNonNegativeInteger(localStorage.getItem(remaining)) ?? durationSeconds));
};

export const startSessionTimer = ({
  sessionNumber,
  durationSeconds,
  onTick,
  onExpire,
}: {
  sessionNumber: number;
  durationSeconds: number;
  onTick: (timeLeft: number) => void;
  onExpire: () => void;
}) => {
  const { remaining, deadline } = getStorageKeys(sessionNumber);
  const currentTimeLeft = getSessionTimeLeft(sessionNumber, durationSeconds);
  const storedDeadline = Number(localStorage.getItem(deadline));
  const timerDeadline = Number.isFinite(storedDeadline) && storedDeadline > 0
    ? storedDeadline
    : Date.now() + currentTimeLeft * 1000;

  localStorage.setItem(deadline, timerDeadline.toString());

  let expired = false;
  const tick = () => {
    const timeLeft = Math.max(0, Math.min(durationSeconds, Math.ceil((timerDeadline - Date.now()) / 1000)));
    localStorage.setItem(remaining, timeLeft.toString());
    onTick(timeLeft);

    if (timeLeft === 0 && !expired) {
      expired = true;
      localStorage.removeItem(deadline);
      onExpire();
    }
  };

  tick();
  const interval = window.setInterval(tick, 250);

  return () => {
    window.clearInterval(interval);
    const timeLeft = Math.max(0, Math.min(durationSeconds, Math.ceil((timerDeadline - Date.now()) / 1000)));
    localStorage.setItem(remaining, timeLeft.toString());
    localStorage.removeItem(deadline);
  };
};
