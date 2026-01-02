import { GameScene } from './components/scene/GameScene';
import { StartScreen } from './components/ui/StartScreen';
import { GameHUD } from './components/ui/GameHUD';
import { GameOverScreen } from './components/ui/GameOverScreen';
import { ScreenFlashOverlay } from './components/ui/ScreenFlashOverlay';
import './index.css';

function App() {
  return (
    <div className="app">
      <GameScene />
      <ScreenFlashOverlay />
      <StartScreen />
      <GameHUD />
      <GameOverScreen />
    </div>
  );
}

export default App;
