export type Lane = -1 | 0 | 1; // -1: Left, 0: Center, 1: Right

export type ObstacleType = 'rickshaw' | 'bus' | 'barrier' | 'ramp';

export type PowerupType = 'nitro' | 'magnet' | 'shield';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  lane: Lane;
  z: number;
  speed: number;
  color: string;
  width: number;
  height: number;
  depth: number;
  wobble?: number;
  passed?: boolean;
}

export interface Coin {
  id: string;
  lane: Lane;
  z: number;
  y: number;
  collected: boolean;
  angle: number;
}

export interface PowerupItem {
  id: string;
  type: PowerupType;
  lane: Lane;
  z: number;
  y: number;
  collected: boolean;
}

export interface Mission {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
}

export interface CarCustomization {
  bodyColor: string;
  accentColor: string;
  glowColor: string;
  name: string;
  unlocked: boolean;
  cost: number;
}

export interface Upgrades {
  nitroDuration: number; // level 1 to 5
  magnetDuration: number; // level 1 to 5
  coinMultiplier: number; // level 1 to 5
}

export type CameraViewMode = 'low-angle' | 'chase' | 'top-down' | 'cinematic';

export interface GameStats {
  score: number;
  highScore: number;
  coins: number;
  totalCoins: number;
  distance: number;
  multiplier: number;
  nearMisses: number;
  rickshawsDodged: number;
  busesDodged: number;
  nitroUsed: number;
}

export interface ActivePowerups {
  nitro: number; // Remaining seconds
  magnet: number; // Remaining seconds
  shield: boolean;
}
