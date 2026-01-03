import { GameScene } from './components/scene/GameScene';
import { StartScreen } from './components/ui/StartScreen';
import { GamePanel } from './components/ui/GamePanel';
import { GameOverScreen } from './components/ui/GameOverScreen';
import { ScreenFlashOverlay } from './components/ui/ScreenFlashOverlay';
import { AudioControls } from './components/ui/AudioControls';
import { HelpButton } from './components/ui/HelpButton';
import { DevTools } from './components/ui/DevTools';
import './index.css';

function App() {
  return (
    <div className="app">
      <GameScene />
      <ScreenFlashOverlay />
      <StartScreen />
      <HelpButton />
      <GamePanel />
      <GameOverScreen />
      <AudioControls />
      <DevTools />
    </div>
  );
}

export default App;
