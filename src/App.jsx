import { GameScene } from './components/scene/GameScene';
import { StartScreen } from './components/ui/StartScreen';
import { GameHUD } from './components/ui/GameHUD';
import { HiLoUI } from './components/ui/HiLoUI';
import { GameOverScreen } from './components/ui/GameOverScreen';
import { ScreenFlashOverlay } from './components/ui/ScreenFlashOverlay';
import { MuteButton } from './components/ui/MuteButton';
import { VolumeSlider } from './components/ui/VolumeSlider';
import './index.css';

function App() {
  return (
    <div className="app">
      <GameScene />
      <ScreenFlashOverlay />
      <StartScreen />
      <GameHUD />
      <HiLoUI />
      <GameOverScreen />
      <MuteButton />
      <VolumeSlider />
    </div>
  );
}

export default App;
