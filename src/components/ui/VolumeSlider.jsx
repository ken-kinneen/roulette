import { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { setMusicVolume } from '../../utils/music';
import { setAmbienceVolume } from '../../utils/ambience';
import './VolumeSlider.css';

export function VolumeSlider() {
  const volume = useGameStore((state) => state.volume);
  const isMuted = useGameStore((state) => state.isMuted);
  const setVolume = useGameStore((state) => state.setVolume);

  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume / 100;
    setMusicVolume(effectiveVolume);
    setAmbienceVolume(effectiveVolume * 0.4); // Ambience at 40% of music volume
  }, [volume, isMuted]);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="volume-slider-container">
      <div className="volume-label">VOLUME</div>
      <div className="volume-control">
        <svg className="volume-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span className="volume-value">{volume}%</span>
      </div>
    </div>
  );
}

