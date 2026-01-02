// Background music manager
let audio = null;
let isPlaying = false;

export function initMusic() {
    if (!audio) {
        audio = new Audio("src/assets/music/music.mp3");
        audio.loop = true;
        audio.volume = 0.1;
    }
}

export function playMusic() {
    if (!audio) initMusic();

    if (!isPlaying) {
        audio.play().catch((err) => {
            console.log("Music autoplay blocked, will play on user interaction");
        });
        isPlaying = true;
    }
}

export function stopMusic() {
    if (audio && isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        isPlaying = false;
    }
}

export function pauseMusic() {
    if (audio && isPlaying) {
        audio.pause();
    }
}

export function resumeMusic() {
    if (audio && isPlaying) {
        audio.play().catch(() => {});
    }
}

export function setMusicVolume(volume) {
    if (audio) {
        audio.volume = Math.max(0, Math.min(1, volume));
    }
}

export function isMusicPlaying() {
    return isPlaying && audio && !audio.paused;
}
