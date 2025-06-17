/**
 * AudioManager
 * Manages spatial audio for the WebXR experience
 */

export class AudioManager {
  /**
   * Create a new AudioManager
   * @param {THREE.Camera} camera - The Three.js camera
   * @param {THREE.Scene} scene - The Three.js scene
   */
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    
    // Audio context
    this.audioContext = null;
    
    // Audio listener (attached to camera)
    this.listener = null;
    
    // Sound sources
    this.sounds = {};
    
    // Audio settings
    this.settings = {
      masterVolume: 1.0,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      spatialAudio: true,
      muted: false
    };
    
    // Initialize audio
    this.init();
  }
  
  /**
   * Initialize audio system
   */
  init() {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Create audio listener and attach to camera
      this.listener = new THREE.AudioListener();
      this.camera.add(this.listener);
      
      // Set up master volume
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.settings.masterVolume;
      this.masterGain.connect(this.audioContext.destination);
      
      // Create separate channels for music and sound effects
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.settings.musicVolume;
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.settings.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      // Load ambient sound
      this.loadAmbientSound();
      
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }
  
  /**
   * Load ambient background sound
   */
  loadAmbientSound() {
    // Create a positional audio source
    const ambientSound = new THREE.PositionalAudio(this.listener);
    
    // Load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    
    // We'll use a placeholder URL here - in a real app, you'd provide an actual sound file
    const soundUrl = './src/assets/audio/ambient.mp3';
    
    // Add a dummy ambient sound for now (will be replaced when a real file is loaded)
    this.createDummyAmbientSound(ambientSound);
    
    // Try to load the actual sound file
    audioLoader.load(
      soundUrl,
      (buffer) => {
        ambientSound.setBuffer(buffer);
        ambientSound.setRefDistance(20); // Distance at which the volume is reduced by half
        ambientSound.setLoop(true);
        ambientSound.setVolume(0.5);
        ambientSound.play();
        
        console.log('Ambient sound loaded');
      },
      (xhr) => {
        // Loading progress
        console.log(`Loading sound: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
      },
      (error) => {
        // Error callback - we'll keep the dummy sound
        console.warn('Could not load ambient sound:', error);
      }
    );
    
    // Add to sounds collection
    this.sounds.ambient = ambientSound;
    
    // Add to scene at a fixed position
    const ambientSource = new THREE.Object3D();
    ambientSource.position.set(0, 2, 0);
    ambientSource.add(ambientSound);
    this.scene.add(ambientSource);
  }
  
  /**
   * Create a dummy ambient sound using oscillators
   * @param {THREE.PositionalAudio} audioObject - The audio object to set up
   */
  createDummyAmbientSound(audioObject) {
    if (!this.audioContext) return;
    
    // Create oscillator for ambient sound
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3 note
    
    // Create gain node to control volume
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime); // Very quiet
    
    // Connect oscillator to gain and gain to audio destination
    oscillator.connect(gainNode);
    
    // Store the nodes in the audio object for later access
    audioObject.userData = {
      oscillator: oscillator,
      gainNode: gainNode,
      isDummy: true
    };
  }
  
  /**
   * Load a sound effect
   * @param {string} name - Name to reference the sound by
   * @param {string} url - URL of the sound file
   * @param {Object} options - Sound options
   * @param {boolean} options.spatial - Whether the sound is spatial (positional)
   * @param {number} options.volume - Volume of the sound (0.0 to 1.0)
   * @param {boolean} options.loop - Whether the sound should loop
   * @returns {Promise} Promise that resolves when the sound is loaded
   */
  loadSound(name, url, options = {}) {
    return new Promise((resolve, reject) => {
      // Default options
      const defaultOptions = {
        spatial: true,
        volume: 0.8,
        loop: false
      };
      
      // Merge with provided options
      const soundOptions = { ...defaultOptions, ...options };
      
      // Create audio object based on spatial setting
      let sound;
      
      if (soundOptions.spatial) {
        // Positional (spatial) audio
        sound = new THREE.PositionalAudio(this.listener);
      } else {
        // Non-positional audio
        sound = new THREE.Audio(this.listener);
      }
      
      // Load the sound
      const audioLoader = new THREE.AudioLoader();
      
      audioLoader.load(
        url,
        (buffer) => {
          sound.setBuffer(buffer);
          sound.setVolume(soundOptions.volume);
          sound.setLoop(soundOptions.loop);
          
          // Add to sounds collection
          this.sounds[name] = sound;
          
          console.log(`Sound loaded: ${name}`);
          resolve(sound);
        },
        (xhr) => {
          // Loading progress
          console.log(`Loading sound ${name}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
        },
        (error) => {
          console.error(`Error loading sound ${name}:`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Play a sound
   * @param {string} name - Name of the sound to play
   * @param {THREE.Vector3} position - Position to play the sound at (for spatial audio)
   * @returns {boolean} True if the sound was played, false otherwise
   */
  playSound(name, position = null) {
    const sound = this.sounds[name];
    
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return false;
    }
    
    // If the sound is already playing, stop it first
    if (sound.isPlaying) {
      sound.stop();
    }
    
    // If position is provided and it's a positional audio, update position
    if (position && sound.panner) {
      // Create a temporary object to hold the sound
      const soundSource = new THREE.Object3D();
      soundSource.position.copy(position);
      soundSource.add(sound);
      this.scene.add(soundSource);
      
      // Remove after playing
      sound.onEnded = () => {
        this.scene.remove(soundSource);
      };
    }
    
    // Play the sound
    sound.play();
    
    return true;
  }
  
  /**
   * Stop a sound
   * @param {string} name - Name of the sound to stop
   * @returns {boolean} True if the sound was stopped, false otherwise
   */
  stopSound(name) {
    const sound = this.sounds[name];
    
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return false;
    }
    
    if (sound.isPlaying) {
      sound.stop();
      return true;
    }
    
    return false;
  }
  
  /**
   * Set the volume of a specific sound
   * @param {string} name - Name of the sound
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setSoundVolume(name, volume) {
    const sound = this.sounds[name];
    
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return;
    }
    
    sound.setVolume(Math.max(0, Math.min(1, volume)));
  }
  
  /**
   * Set the master volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMasterVolume(volume) {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain) {
      this.masterGain.gain.value = this.settings.masterVolume;
    }
  }
  
  /**
   * Set the music volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMusicVolume(volume) {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.musicGain) {
      this.musicGain.gain.value = this.settings.musicVolume;
    }
  }
  
  /**
   * Set the sound effects volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setSFXVolume(volume) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.settings.sfxVolume;
    }
  }
  
  /**
   * Mute/unmute all audio
   * @param {boolean} muted - Whether audio should be muted
   */
  setMuted(muted) {
    this.settings.muted = muted;
    
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.settings.masterVolume;
    }
  }
  
  /**
   * Toggle mute state
   * @returns {boolean} The new mute state
   */
  toggleMute() {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }
  
  /**
   * Handle XR session start
   * @param {XRSession} session - The WebXR session
   */
  onXRSessionStarted(session) {
    // Resume audio context if it was suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  /**
   * Handle XR session end
   */
  onXRSessionEnded() {
    // No specific action needed
  }
  
  /**
   * Update audio system
   * @param {THREE.Vector3} listenerPosition - The current listener position
   */
  update(listenerPosition) {
    // Update listener position if needed
    if (listenerPosition && this.listener) {
      // The listener is already attached to the camera, so it moves with it
      // No need to manually update position
    }
    
    // Update any dynamic audio parameters here
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Stop all sounds
    Object.values(this.sounds).forEach((sound) => {
      if (sound.isPlaying) {
        sound.stop();
      }
      
      // Clean up any dummy sounds
      if (sound.userData && sound.userData.isDummy) {
        if (sound.userData.oscillator) {
          sound.userData.oscillator.stop();
          sound.userData.oscillator.disconnect();
        }
        if (sound.userData.gainNode) {
          sound.userData.gainNode.disconnect();
        }
      }
    });
    
    // Remove listener from camera
    if (this.listener && this.camera) {
      this.camera.remove(this.listener);
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    // Clear sounds collection
    this.sounds = {};
    
    console.log('Audio system disposed');
  }
}