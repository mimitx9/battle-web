/**
 * Sound utility functions for playing audio effects
 */

export interface SoundConfig {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;
  private backgroundMusic: HTMLAudioElement | null = null;
  private backgroundMusicEnabled: boolean = true;

  constructor() {
    // Initialize sounds
    this.initializeSounds();
  }

  private initializeSounds() {
    // Only initialize sounds in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const soundFiles = {
      click: '/audio/click.mp3',
      start: '/audio/start.mp3',
      correct: '/audio/correct.mp3',
      wrong: '/audio/wrong.mp3',
      nextQuiz: '/audio/next_quiz.mp3',
      insane: '/audio/insane.mp3',
      skill: '/audio/skill.mp3',
      top3: '/audio/top_3.mp3',
      countdown: '/audio/321.mp3',
      ost: '/audio/ost.mp3'
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.7; // Default volume
      this.sounds.set(key, audio);
    });

    // Initialize background music
    this.backgroundMusic = new Audio('/audio/ost.mp3');
    this.backgroundMusic.preload = 'auto';
    this.backgroundMusic.volume = 0.3; // Lower volume for background music
    this.backgroundMusic.loop = true;
  }

  /**
   * Play a sound effect
   */
  play(soundName: string, config?: SoundConfig): void {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const audio = this.sounds.get(soundName);
    if (!audio) {
      console.warn(`Sound "${soundName}" not found`);
      return;
    }

    // Reset audio to beginning
    audio.currentTime = 0;
    
    // Apply configuration
    if (config?.volume !== undefined) {
      audio.volume = config.volume;
    }
    
    if (config?.loop !== undefined) {
      audio.loop = config.loop;
    }

    // Play the sound
    audio.play().catch(error => {
      console.warn(`Failed to play sound "${soundName}":`, error);
    });
  }

  /**
   * Stop a sound effect
   */
  stop(soundName: string): void {
    if (typeof window === 'undefined') return;
    
    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    if (typeof window === 'undefined') return;
    
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Set global volume for all sounds
   */
  setVolume(volume: number): void {
    if (typeof window === 'undefined') return;
    
    this.sounds.forEach(audio => {
      audio.volume = Math.max(0, Math.min(1, volume));
    });
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Start background music
   */
  startBackgroundMusic(): void {
    if (!this.backgroundMusicEnabled || typeof window === 'undefined' || !this.backgroundMusic) {
      console.log('🎵 Background music not enabled or not available');
      return;
    }
    
    console.log('🎵 Attempting to start background music...');
    this.backgroundMusic.currentTime = 0;
    this.backgroundMusic.play().catch(error => {
      console.warn('🎵 Failed to play background music:', error);
      if (error.name === 'NotAllowedError') {
        console.log('🎵 Autoplay blocked by browser. User interaction required.');
      }
    });
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (typeof window === 'undefined' || !this.backgroundMusic) return;
    
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
  }

  /**
   * Set background music volume
   */
  setBackgroundMusicVolume(volume: number): void {
    if (typeof window === 'undefined' || !this.backgroundMusic) return;
    
    this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable or disable background music
   */
  setBackgroundMusicEnabled(enabled: boolean): void {
    this.backgroundMusicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  /**
   * Check if background music is enabled
   */
  isBackgroundMusicEnabled(): boolean {
    return this.backgroundMusicEnabled;
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

// Export convenience functions
export const playSound = (soundName: string, config?: SoundConfig) => soundManager.play(soundName, config);
export const stopSound = (soundName: string) => soundManager.stop(soundName);
export const stopAllSounds = () => soundManager.stopAll();
export const setSoundVolume = (volume: number) => soundManager.setVolume(volume);
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);
export const isSoundEnabled = () => soundManager.isSoundEnabled();

// Export specific sound functions for common use cases
export const playClickSound = () => playSound('click');
export const playStartSound = () => playSound('start');
export const playCorrectSound = () => playSound('correct');
export const playWrongSound = () => playSound('wrong');
export const playNextQuizSound = () => playSound('nextQuiz');
export const playInsaneSound = () => playSound('insane');
export const playSkillSound = () => playSound('skill');
export const playTop3Sound = () => playSound('top3');
export const playCountdownSound = () => playSound('countdown');

// Export background music functions
export const startBackgroundMusic = () => soundManager.startBackgroundMusic();
export const stopBackgroundMusic = () => soundManager.stopBackgroundMusic();
export const setBackgroundMusicVolume = (volume: number) => soundManager.setBackgroundMusicVolume(volume);
export const setBackgroundMusicEnabled = (enabled: boolean) => soundManager.setBackgroundMusicEnabled(enabled);
export const isBackgroundMusicEnabled = () => soundManager.isBackgroundMusicEnabled();

export default soundManager;
