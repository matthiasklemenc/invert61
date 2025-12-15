import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getSoundManager } from './SoundManager';
import { drawStickman, drawObstacle, drawCityBackground, drawUnderworldBackground, drawSpaceBackground, drawCollectible, drawTransitionPipe, drawLaser, drawBeamDownSequence, CharacterType, ObstacleType, getOxxoPosition } from './DrawingHelpers';
import { GameState, PlayerState, WorldState, Player, Obstacle, Collectible, FloatingText, GameStats, Projectile, Powerups } from './GameTypes';
import { GRAVITY, JUMP_FORCE, BASE_FLOOR_Y, SPEED, STANDARD_OBSTACLES } from './GameConstants';

export function useSkateGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    const stateRef = useRef<{
        status: GameState,
        score: number,
        jumpsPerformed: number,
        count180: number, 
        count360: number, 
        grindsPerformed: number,
        lives: number,
        frame: number,
        player: Player,
        obstacles: Obstacle[],
        collectibles: Collectible[],
        projectiles: Projectile[],
        floatingTexts: FloatingText[],
        selectedChar: CharacterType,
        lastTapTime: number,
        tapCount: number, 
        touchStartY: number,
        touchStartX: number,
        currentFloorY: number, 
        nextObstacleDist: number,
        totalScroll: number,
        arrestTimer: number,
        world: WorldState,
        underworldTimer: number,
        spawnedExit: boolean,
        transitionY: number,
        ufoKillCount: number,
        spaceDuration: number,
        abductionActive: boolean,
        beamDownTimer: number,
        ufoLocked: boolean,
        powerups: Powerups,
        shopCooldown: number,
        hasVisitedShop: boolean,
        spaceEntryScroll: number
    }>({
        status: 'MENU',
        score: 0,
        jumpsPerformed: 0,
        count180: 0,
        count360: 0,
        grindsPerformed: 0,
        lives: 3,
        frame: 0,
        player: { 
            x: 100,
            y: 0, vy: 0, state: 'RUNNING', rotation: 0, trickName: '', isFakie: false,
            pushTimer: 0, pushCount: 0, targetPushes: 3, coastingDuration: 0,
            natasSpinCount: 0, natasSpinTarget: 0,
            natasTapCount: 0, lastNatasTapTime: 0,
            platformId: null
        },
        obstacles: [],
        collectibles: [],
        projectiles: [],
        floatingTexts: [],
        selectedChar: 'male_cap',
        lastTapTime: 0,
        tapCount: 0,
        touchStartY: 0,
        touchStartX: 0,
        currentFloorY: BASE_FLOOR_Y,
        nextObstacleDist: 0,
        totalScroll: 0,
        arrestTimer: 0,
        world: 'NORMAL',
        underworldTimer: 0,
        spawnedExit: false,
        transitionY: 0,
        ufoKillCount: 0,
        spaceDuration: 0,
        abductionActive: false,
        beamDownTimer: 0,
        ufoLocked: false,
        powerups: {
            has360Laser: false,
            speedBoostTimer: 0,
            psychedelicMode: false,
            doubleSpawnRate: false,
            doubleCoins: false
        },
        shopCooldown: 0,
        hasVisitedShop: false,
        spaceEntryScroll: 0
    });

    const [uiState, setUiState] = useState<GameState>('MENU');
    const [score, setScore] = useState(0);
    const [stats, setStats] = useState<GameStats>({ grinds: 0, jumps: 0, c180: 0, c360: 0 });
    const [lives, setLives] = useState(3);
    const [character, setCharacter] = useState<CharacterType>('male_cap');
    const [highScore, setHighScore] = useState(0);
    const [userName, setUserName] = useState("");
    
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(getSoundManager().isMuted);

    useEffect(() => {
        try {
            const storedScore = localStorage.getItem('invert-skate-highscore');
            if (storedScore) setHighScore(parseInt(storedScore, 10));
            const storedName = localStorage.getItem('invert-skate-username');
            if (storedName) setUserName(storedName);
        } catch(e) { console.error(e); }
        
        return () => {
            try { getSoundManager().stopMusic(); } catch {}
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const saveHighScore = (newScore: number) => {
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('invert-skate-highscore', newScore.toString());
        }
    };

    const togglePause = () => {
        const nextPaused = !isPaused;
        setIsPaused(nextPaused);
        if (nextPaused) {
            getSoundManager().pauseMusic();
        } else {
            getSoundManager().resumeMusic();
            lastTimeRef.current = 0; 
        }
    };

    const toggleMute = () => {
        const sm = getSoundManager();
        sm.toggleMute();
        setIsMuted(sm.isMuted);
    };
    
    // --- Shop Actions ---
    const buyItem = (item: 'CHIPS' | 'COKE' | 'KOROVA' | 'LIFE') => {
        const state = stateRef.current;
        let cost = 0;
        let purchased = false;

        if (item === 'CHIPS') {
            cost = 5000;
            if (state.score >= cost) {
                state.powerups.has360Laser = true;
                state.powerups.doubleSpawnRate = true; 
                addFloatingText(state.player.x, state.currentFloorY - 100, "LASER + TRIPLE UFOs!", "#fbbf24");
                purchased = true;
            }
        } else if (item === 'COKE') {
            cost = 10000;
            if (state.score >= cost) {
                state.powerups.speedBoostTimer = 20; // 20 seconds speed
                state.powerups.doubleCoins = true;   // Persistent double coins for session
                addFloatingText(state.player.x, state.currentFloorY - 100, "SPEED + RICHES!", "#ef4444");
                purchased = true;
            }
        } else if (item === 'KOROVA') {
            cost = 67;
            if (state.score >= cost) {
                state.powerups.psychedelicMode = true;
                addFloatingText(state.player.x, state.currentFloorY - 100, "WHOA... DUDE...", "#a855f7");
                purchased = true;
            }
        } else if (item === 'LIFE') {
            cost = 50000;
            if (state.score >= cost) {
                state.lives += 1;
                setLives(state.lives);
                addFloatingText(state.player.x, state.currentFloorY - 100, "1-UP!", "#22c55e");
                purchased = true;
            }
        }

        if (purchased) {
            state.score -= cost;
            state.spaceDuration -= 20; // Extend time
            setScore(state.score); 
        } 
    };

    const closeShop = () => {
        const state = stateRef.current;
        setUiState('PLAYING');
        state.status = 'PLAYING';
        state.shopCooldown = 300; 
        state.hasVisitedShop = true; // Mark as visited on exit so we don't re-enter
        getSoundManager().resumeMusic();
        lastTimeRef.current = 0;
    };

    const enterUnderworld = () => {
        const state = stateRef.current;
        state.world = 'TRANSITION_DOWN';
        state.transitionY = 0;
        state.player.x = 180;
        state.player.state = 'COASTING';
        state.player.vy = 0;
        state.player.platformId = null;
        state.spawnedExit = false;
        getSoundManager().playMetalHit();
        getSoundManager().playUnderworldMusic();
    };

    const exitUnderworld = () => {
        const state = stateRef.current;
        state.world = 'NORMAL';
        state.player.x = 100; 
        state.player.vy = -25; 
        state.player.y = 0; 
        state.player.state = 'JUMPING'; 
        state.player.platformId = null;
        state.player.rotation = 0;
        state.transitionY = 0; 
        state.underworldTimer = 0;
        state.spawnedExit = false;
        state.nextObstacleDist = 400;
        state.obstacles = []; 
        state.collectibles = [];
        state.projectiles = [];
        getSoundManager().playLaunch();
        getSoundManager().playMainMusic(); 
    };

    const enterSpace = () => {
        const state = stateRef.current;
        state.world = 'SPACE';
        state.obstacles = [];
        state.collectibles = [];
        state.projectiles = [];
        
        state.spaceEntryScroll = state.totalScroll;

        const startPlatY = 250; 
        const startPlat = {
             id: Date.now(), x: 200, y: startPlatY, w: 1500, 
             h: 20, 
             type: 'space_platform' as ObstacleType, isGrindable: true, isGap: false, isPlatform: true, passed: false
        };
        state.obstacles.push(startPlat);
        
        state.currentFloorY = startPlatY;
        state.player.platformId = null; 
        
        state.player.vy = JUMP_FORCE * 1.0; 
        state.player.state = 'JUMPING'; 
        state.player.x = 100; 
        state.player.y = -10; 
        
        state.nextObstacleDist = 1200; 
        state.transitionY = 0;
        state.spaceDuration = 0; 
        state.abductionActive = false;
        state.ufoLocked = false;
        state.shopCooldown = 0; 
        state.hasVisitedShop = false; 
        
        state.powerups.has360Laser = false;
        state.powerups.speedBoostTimer = 0;
        state.powerups.psychedelicMode = false;
        state.powerups.doubleSpawnRate = false;
        state.powerups.doubleCoins = false;
        
        getSoundManager().playLaunch();
        getSoundManager().playSpaceMusic();
    };

    const fallFromSpace = () => {
         const state = stateRef.current;
         state.world = 'NORMAL';
         state.obstacles = [];
         state.collectibles = [];
         state.projectiles = [];
         state.player.platformId = null;
         state.player.state = 'TUMBLING';
         state.player.x = 100;
         state.player.y = -2500; 
         state.player.vy = 0; 
         state.currentFloorY = BASE_FLOOR_Y;
         state.nextObstacleDist = 1000; 
         state.transitionY = 0; 
         state.ufoKillCount = 0; 
         state.spaceDuration = 0;
         state.abductionActive = false;
         state.ufoLocked = false;
         
         state.powerups.has360Laser = false;
         state.powerups.speedBoostTimer = 0;
         state.powerups.psychedelicMode = false;
         state.powerups.doubleSpawnRate = false;
         state.powerups.doubleCoins = false;

         getSoundManager().playCrash();
         addFloatingText(200, 200, "RE-ENTRY!", "#ef4444");
         getSoundManager().playMainMusic(); 
    };
    
    const forceUnderworldRespawn = () => {
        const state = stateRef.current;
        state.obstacles = [];
        state.collectibles = [];
        state.projectiles = [];
        const safePlatY = BASE_FLOOR_Y - 50;
        const safePlat = {
            id: Date.now(), x: 0, y: safePlatY, w: 1000, h: 20,
            type: 'platform' as ObstacleType, isGrindable: false, isGap: false, isPlatform: true, passed: false
        };
        state.obstacles.push(safePlat);
        state.player.platformId = safePlat.id;
        state.currentFloorY = safePlatY; 
        state.player.x = 100;
        state.player.y = 0;
        state.player.vy = 0;
        state.player.state = 'RUNNING';
        state.player.pushTimer = 0;
        state.player.rotation = 0;
        state.player.trickName = '';
        state.spawnedExit = false;
        state.nextObstacleDist = 0; 
        state.lives--;
        setLives(state.lives);
        if (state.lives <= 0) {
            state.status = 'GAME_OVER';
            setUiState('GAME_OVER');
            saveHighScore(state.score);
            getSoundManager().stopMusic();
        }
        getSoundManager().playCrash();
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
        stateRef.current.floatingTexts.push({
            id: Date.now(),
            x, y, text, color,
            life: 60 
        });
    };

    const handleCrash = () => {
        const state = stateRef.current;
        if (state.player.state === 'CRASHED') return; 

        state.player.state = 'CRASHED';
        getSoundManager().playCrash();
        state.lives--;
        setLives(state.lives);

        if (state.lives <= 0) {
            state.status = 'GAME_OVER';
            setUiState('GAME_OVER');
            saveHighScore(state.score);
            getSoundManager().stopMusic();
        } else {
            setTimeout(() => {
                if (state.world === 'UNDERWORLD') {
                    forceUnderworldRespawn();
                } else if ((state.world as string) === 'SPACE') {
                     fallFromSpace();
                } else {
                    state.player.y = -200; 
                    state.player.vy = 0;
                    state.player.state = 'JUMPING';
                    state.player.platformId = null; 
                    state.obstacles = state.obstacles.filter(o => o.x > 400); 
                }
                if (state.nextObstacleDist > 2000) state.nextObstacleDist = 500;
                state.player.rotation = 0;
                state.player.trickName = '';
                state.player.isFakie = false; 
            }, 250);
        }
    };

    const fireLaser = () => {
        const state = stateRef.current;
        if (state.world !== 'SPACE' || state.player.state === 'CRASHED' || state.player.state === 'ABDUCTED' || state.abductionActive) return;

        if (state.powerups.has360Laser) {
            const directions = 16;
            for (let i = 0; i < directions; i++) {
                const angle = (Math.PI * 2 / directions) * i;
                state.projectiles.push({
                    id: Date.now() + i,
                    x: state.player.x + 30,
                    y: state.currentFloorY + state.player.y - 35,
                    vx: Math.cos(angle) * 20,
                    vy: Math.sin(angle) * 20,
                    life: 2.0
                });
            }
        } else {
            const offsets = [0, -20, 20];
            offsets.forEach((off, idx) => {
                state.projectiles.push({
                    id: Date.now() + idx,
                    x: state.player.x + 30,
                    y: state.currentFloorY + state.player.y - 35 + off,
                    vx: 20, 
                    vy: 0,
                    life: 2.0 
                });
            });
        }
        getSoundManager().playLaunch(); 
    };

    const loop = (timestamp: number) => {
        const state = stateRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!lastTimeRef.current) {
            lastTimeRef.current = timestamp;
        }
        const deltaTimeMs = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        const dt = isPaused || state.status !== 'PLAYING' ? 0 : Math.min(deltaTimeMs / 16.667, 4.0);

        if (state.status === 'PLAYING' && !isPaused) {
            state.frame += dt;
            
            if (state.shopCooldown > 0) {
                state.shopCooldown -= dt;
            }
            
            if (state.powerups.speedBoostTimer > 0) {
                state.powerups.speedBoostTimer -= (deltaTimeMs / 1000);
            }
            const currentSpeed = state.powerups.speedBoostTimer > 0 ? SPEED * 2 : SPEED;

            const isNatas = state.player.state === 'NATAS_SPIN';
            const isArrested = state.player.state === 'ARRESTED';
            const isAbducted = state.player.state === 'ABDUCTED';

            state.projectiles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt / 60;
            });
            state.projectiles = state.projectiles.filter(p => p.life > 0);

            state.projectiles.forEach(p => {
                for (let i = state.obstacles.length - 1; i >= 0; i--) {
                    const obs = state.obstacles[i];
                    if (obs.type === 'alien_ship') {
                        if (p.x + 30 > obs.x && p.x < obs.x + obs.w && Math.abs(p.y - obs.y) < 40) {
                            state.obstacles.splice(i, 1);
                            p.life = 0;
                            state.score += 500;
                            state.ufoKillCount++;
                            addFloatingText(obs.x, obs.y, "BLASTED! +500", "#a3e635");
                            getSoundManager().playMetalHit();
                            break;
                        }
                    }
                }
            });
            state.projectiles = state.projectiles.filter(p => p.life > 0);

            if (state.world === 'BEAM_DOWN') {
                const beamSpeed = 15;
                state.transitionY -= beamSpeed * dt;
                
                state.player.x = canvas.width / 2;
                state.player.y = canvas.height / 2; 
                state.player.state = 'ABDUCTED';
                state.player.rotation += 0.05 * dt;

                if (state.transitionY <= 0) {
                    state.world = 'NORMAL';
                    state.obstacles = [];
                    state.collectibles = [];
                    state.projectiles = [];
                    state.player.state = 'JUMPING';
                    state.player.rotation = 0;
                    state.player.x = 100;
                    state.player.y = -200;
                    state.player.vy = 0;
                    state.player.platformId = null;
                    state.currentFloorY = BASE_FLOOR_Y;
                    state.nextObstacleDist = 500;
                    state.transitionY = 0;
                    state.spaceDuration = 0;
                    state.abductionActive = false;
                    state.ufoLocked = false;
                    
                    state.powerups.has360Laser = false;
                    state.powerups.speedBoostTimer = 0;
                    state.powerups.psychedelicMode = false;
                    state.powerups.doubleSpawnRate = false;
                    state.powerups.doubleCoins = false;

                    getSoundManager().playMainMusic();
                    addFloatingText(200, 200, "TOUCHDOWN!", "#38bdf8");
                }
            } else if (state.world === 'TRANSITION_DOWN') {
                const startX = 180;
                const startY = 250; 
                const endX = startX + 300;
                const endY = 1000;
                const totalDistX = endX - startX;
                const slope = (endY - startY) / totalDistX;
                state.player.x += 6 * dt; 
                const currentPipeY = startY + (state.player.x - startX) * slope;
                state.player.y = currentPipeY - BASE_FLOOR_Y;
                state.player.rotation = Math.atan(slope);
                state.player.state = 'JUMPING'; 
                const progress = (state.player.x - startX) / totalDistX;
                state.transitionY = -progress * 750;

                if (progress >= 1 || state.player.x >= endX) {
                     state.world = 'UNDERWORLD';
                     state.obstacles = [];
                     state.collectibles = [];
                     state.projectiles = [];
                     state.underworldTimer = 0;
                     state.transitionY = 0;
                     state.currentFloorY = BASE_FLOOR_Y;
                     state.player.rotation = 0;
                     state.player.x = 100;
                     
                     const startPlatY = BASE_FLOOR_Y - 50;
                     const startPlat = {
                        id: Date.now(), x: 50, y: startPlatY, w: 800, h: 20, 
                        type: 'platform' as ObstacleType, isGrindable: false, isGap: false, isPlatform: true, passed: false
                     };
                     state.obstacles.push(startPlat);
                     
                     state.player.platformId = startPlat.id;
                     state.currentFloorY = startPlatY;
                     state.player.y = 0; 
                     state.player.vy = 0;
                     state.player.state = 'RUNNING';
                     state.player.pushTimer = 0;
                     state.nextObstacleDist = 0; 
                     state.spawnedExit = false;
                }
            } else {
                if (!isNatas && !isArrested && !state.ufoLocked && state.player.state !== 'CRASHED') {
                    const scrollAmount = currentSpeed * dt;
                    
                    state.totalScroll += scrollAmount;
                    state.nextObstacleDist -= scrollAmount;
                    state.obstacles.forEach(obs => {
                        obs.x -= scrollAmount;
                        
                        if (obs.type === 'fireball') {
                            const speed = obs.fireballSpeed || 0.005;
                            const offset = obs.fireballOffset || 0;
                            const height = obs.fireballHeight || 200;
                            const base = obs.fireballBaseY || 400;
                            
                            const dy = Math.abs(Math.sin(state.frame * speed + offset)) * height;
                            obs.y = base - dy;
                        }
                    });
                    state.collectibles.forEach(c => c.x -= scrollAmount);
                }

                if (state.world === 'UNDERWORLD') {
                    state.underworldTimer += dt;
                    if (state.player.y > 200) {
                        forceUnderworldRespawn();
                        requestRef.current = requestAnimationFrame(loop);
                        return; 
                    }
                    if (state.underworldTimer > 1020 && !state.spawnedExit) {
                        if (state.nextObstacleDist > 0) state.nextObstacleDist = 0;
                    }
                } else if ((state.world as string) === 'SPACE') {
                     if (state.shopCooldown <= 0 && !state.abductionActive && !state.ufoLocked && state.player.state !== 'CRASHED' && !state.hasVisitedShop) {
                         const oxxoPos = getOxxoPosition(canvas.width, canvas.height, state.totalScroll, 0, state.spaceEntryScroll); 
                         const playerAbsX = state.player.x;
                         const playerAbsY = state.currentFloorY + state.player.y;
                         const shopCenterY = oxxoPos.y - 88;
                         const shopCenterX = oxxoPos.x;
                         const dist = Math.sqrt(Math.pow(playerAbsX - shopCenterX, 2) + Math.pow(playerAbsY - shopCenterY, 2));
                         
                         if (dist < 60) { 
                             setUiState('OXXO_SHOP');
                             state.status = 'OXXO_SHOP';
                             getSoundManager().pauseMusic();
                         }
                     }

                     state.spaceDuration += dt / 60; 

                     if (state.spaceDuration > 20 && !state.abductionActive) {
                         state.abductionActive = true;
                         state.obstacles.push({
                             id: Date.now(),
                             x: canvas.width + 200, 
                             y: 100, 
                             w: 300, h: 120,
                             type: 'big_ufo', isGrindable: false, isGap: false, isPlatform: false, passed: false
                         });
                         addFloatingText(canvas.width - 100, 200, "ABDUCTION IMMINENT!", "#ef4444");
                     }

                     if (state.abductionActive) {
                         const bigUfo = state.obstacles.find(o => o.type === 'big_ufo');
                         if (bigUfo) {
                             const ufoCenterX = bigUfo.x + bigUfo.w/2;
                             const screenCenter = canvas.width / 2;
                             const isValidState = state.player.state !== 'CRASHED' && state.player.state !== 'TUMBLING' && state.player.state !== 'ARRESTED';

                             if (ufoCenterX <= screenCenter && !state.ufoLocked && isValidState) {
                                 state.ufoLocked = true;
                                 const shift = screenCenter - ufoCenterX;
                                 bigUfo.x += shift;
                             }
                             
                             if (state.ufoLocked && !isValidState) {
                                 state.ufoLocked = false;
                             }

                             if (state.ufoLocked) {
                                 state.player.platformId = null;
                                 state.player.vy = 0;
                                 
                                 const targetX = bigUfo.x + bigUfo.w/2;
                                 const targetY = bigUfo.y + bigUfo.h/2 + 40; 
                                 
                                 const currentAbsY = state.currentFloorY + state.player.y;
                                 
                                 const dx = targetX - state.player.x;
                                 const dy = targetY - currentAbsY;
                                 
                                 state.player.x += dx * 0.05 * dt;
                                 state.player.y += dy * 0.05 * dt;
                                 state.player.rotation += 0.15 * dt;
                                 
                                 if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                                     state.world = 'BEAM_DOWN';
                                     state.transitionY = 3000; 
                                     getSoundManager().playLaunch();
                                 }
                             }
                         }
                     } else {
                         if (state.player.y > 600) {
                              fallFromSpace();
                              requestRef.current = requestAnimationFrame(loop);
                              return;
                         }
                         if (state.player.y < -350) {
                             if (state.player.vy < 0) state.player.vy = 0;
                             state.player.y = -350;
                         }
                     }
                }

                if (isArrested) {
                     state.arrestTimer += dt;
                     const policeCar = state.obstacles.find(o => o.type === 'police_car' && o.doorOpen);
                     if (policeCar) {
                          const targetX = policeCar.x + policeCar.w / 2;
                          if (state.player.x < targetX) state.player.x += 2 * dt;
                          if (state.arrestTimer > 120) {
                              const resetAfterArrest = () => {
                                const s = stateRef.current;
                                s.player.state = 'RUNNING';
                                s.player.x = 100;
                                s.player.y = 0;
                                s.player.vy = 0;
                                s.player.rotation = 0;
                                s.obstacles = s.obstacles.filter(o => o.x > 400); 
                                s.arrestTimer = 0;
                              };
                              resetAfterArrest();
                          }
                     } else {
                          const resetAfterArrest = () => {
                            const s = stateRef.current;
                            s.player.state = 'RUNNING';
                            s.player.x = 100;
                            s.player.y = 0;
                            s.player.vy = 0;
                            s.player.rotation = 0;
                            s.obstacles = s.obstacles.filter(o => o.x > 400); 
                            s.arrestTimer = 0;
                          };
                          resetAfterArrest();
                     }
                }

                if (state.player.state === 'RUNNING') {
                    if (state.player.isFakie) {
                        state.player.state = 'COASTING';
                    } else {
                        state.player.pushTimer += dt;
                        
                        if (state.selectedChar === 'male_cap') {
                             if (state.player.pushTimer > 60) {
                                 state.player.state = 'COASTING';
                                 state.player.pushTimer = 0;
                                 state.player.coastingDuration = 300; 
                             }
                        } else {
                             if (state.player.pushTimer > 90) {
                                 state.player.state = 'COASTING';
                                 state.player.pushTimer = 0;
                                 state.player.coastingDuration = 120 + Math.random() * 180; 
                             }
                        }
                    }
                } else if (state.player.state === 'COASTING') {
                    state.player.pushTimer += dt;
                    if (state.player.pushTimer > state.player.coastingDuration) {
                        if (!state.player.isFakie) {
                            state.player.state = 'RUNNING';
                        }
                        state.player.pushTimer = 0;
                    }
                }

                // Obstacle Spawning
                if (state.nextObstacleDist <= 0 && !isArrested && !state.abductionActive && !isAbducted) {
                    const spawnX = canvas.width + 50;
                    
                    if ((state.world as string) === 'SPACE') {
                         const platW = 200 + Math.random() * 300; 
                         const gapW = 150 + Math.random() * 250;

                         const lastPlat = state.obstacles[state.obstacles.length - 1];
                         let platY = 250;
                         
                         if (lastPlat && (lastPlat.isPlatform || lastPlat.isGrindable)) {
                             platY = lastPlat.y + (Math.random() * 200 - 100);
                             if (platY < 100) platY = 100;
                             if (platY > 320) platY = 320;
                         }
                         
                         const isGirder = Math.random() > 0.6;
                         const objType = isGirder ? 'station_girder' : 'solar_panel';
                         const objH = isGirder ? 40 : 20; 
                         
                         state.obstacles.push({
                             id: Date.now(), x: spawnX, y: platY, w: platW, h: objH,
                             type: objType as ObstacleType, 
                             isGrindable: true, 
                             isGap: false, 
                             isPlatform: true, 
                             passed: false
                         });
                         
                         // Double Coins Logic
                         const coinSpacing = state.powerups.doubleCoins ? 30 : 60;
                         const numCoins = Math.floor(platW / coinSpacing);
                         
                         for(let i=0; i<numCoins; i++) {
                             if (Math.random() > 0.3) {
                                 const randomYOffset = 50 + Math.random() * 100; 
                                 state.collectibles.push({
                                     id: Date.now() + i * 10,
                                     x: spawnX + 30 + i * coinSpacing,
                                     y: platY - randomYOffset,
                                     type: Math.random() > 0.9 ? 'DIAMOND' : 'COIN',
                                     collected: false
                                 });
                             }
                         }

                         if (Math.random() > 0.2) { 
                             const baseCount = 3;
                             const ufoCount = state.powerups.doubleSpawnRate ? (baseCount * 3) : baseCount; 
                             
                             for(let k=0; k<ufoCount; k++) {
                                 const randomOffsetX = (Math.random() * 800) - 200; 
                                 const randomOffsetY = (Math.random() * 150) - 50; 
                                 const alienX = spawnX + randomOffsetX; 
                                 const alienY = platY - 200 + randomOffsetY; 
                                 
                                 state.obstacles.push({
                                     id: Date.now() + 999 + k,
                                     x: alienX, 
                                     y: alienY,
                                     w: 40, h: 20,
                                     type: 'alien_ship', isGrindable: false, isGap: false, isPlatform: false, passed: false
                                 });
                             }
                         }

                         state.nextObstacleDist = platW + gapW;

                    } else if (state.world === 'UNDERWORLD') {
                         if (state.underworldTimer > 1020 && !state.spawnedExit) {
                             const lastPlat = state.obstacles.filter(o => o.isPlatform).pop();
                             const surfaceY = lastPlat ? lastPlat.y : BASE_FLOOR_Y;
                             const rampH = 250;
                             state.obstacles.push({
                                id: Date.now(), x: spawnX, 
                                y: surfaceY - rampH, 
                                w: 300, h: rampH, 
                                type: 'mega_ramp', isGrindable: false, isGap: false, isPlatform: true, passed: false
                             });
                             state.spawnedExit = true; 
                             state.nextObstacleDist = 99999; 
                         } else if (!state.spawnedExit) {
                             const gapSize = 60 + Math.random() * 100; 
                             const platW = 300 + Math.random() * 200; 
                             const lastPlat = state.obstacles[state.obstacles.length - 1];
                             let platY = BASE_FLOOR_Y - 80;
                             if (lastPlat && lastPlat.isPlatform) {
                                 platY = lastPlat.y + (Math.random() > 0.5 ? 30 : -30);
                                 if (platY > BASE_FLOOR_Y - 40) platY = BASE_FLOOR_Y - 40;
                                 if (platY < BASE_FLOOR_Y - 150) platY = BASE_FLOOR_Y - 150;
                             }
                             state.obstacles.push({
                                id: Date.now(), x: spawnX, y: platY, w: platW, h: 20, 
                                type: 'platform', isGrindable: false, isGap: false, isPlatform: true, passed: false
                             });
                             const coinSpacing = 50;
                             const numCoins = Math.floor((platW - 100) / coinSpacing);
                             for(let i = 0; i < numCoins; i++) {
                                 if (Math.random() > 0.1) { 
                                     state.collectibles.push({
                                         id: Date.now() + i * 10, 
                                         x: spawnX + 50 + (i * coinSpacing), 
                                         y: platY - 40, 
                                         type: 'COIN', 
                                         collected: false
                                     });
                                 }
                             }
                             const currentDiamonds = state.collectibles.filter(c => c.type === 'DIAMOND').length; 
                             if (Math.random() > 0.9 && currentDiamonds === 0) {
                                  state.collectibles.push({
                                     id: Date.now() + 999, x: spawnX + platW/2, y: platY - 80, type: 'DIAMOND', collected: false
                                 });
                             }

                             const gapCenterX = spawnX + platW + gapSize / 2;
                             const baseFireY = BASE_FLOOR_Y + 300; 
                             const targetHeight = 450 + Math.random() * 200; 
                             
                             state.obstacles.push({
                                 id: Date.now() + 1234,
                                 x: gapCenterX - 15, 
                                 y: baseFireY,
                                 w: 30, 
                                 h: 30,
                                 type: 'fireball',
                                 isGrindable: false, isGap: false, isPlatform: false, passed: false,
                                 fireballBaseY: baseFireY,
                                 fireballHeight: targetHeight,
                                 fireballSpeed: 0.02 + Math.random() * 0.02,
                                 fireballOffset: Math.random() * Math.PI * 2
                             });

                             state.nextObstacleDist = platW + gapSize;
                         }
                    } else {
                        if (Math.random() < 0.15) {
                            const rampW = 100;
                            const platW = Math.random() > 0.5 ? 150 : 300;
                            const totalW = rampW + platW;
                            const structureHeight = 50;
                            state.obstacles.push({
                                id: Date.now(),
                                x: spawnX,
                                y: BASE_FLOOR_Y - structureHeight,
                                w: totalW,
                                h: structureHeight,
                                type: 'concrete_structure',
                                isGrindable: false,
                                isGap: false,
                                isPlatform: true,
                                passed: false
                            });
                            const stairW = 120;
                            state.obstacles.push({
                                id: Date.now()+1,
                                x: spawnX + totalW,
                                y: BASE_FLOOR_Y - structureHeight, 
                                w: stairW,
                                h: structureHeight,
                                type: 'stairs_down',
                                isGrindable: true, 
                                isGap: false,
                                isPlatform: true, 
                                passed: false
                            });
                            state.obstacles.push({
                                id: Date.now()+2,
                                x: spawnX + totalW + stairW,
                                y: BASE_FLOOR_Y, 
                                w: 200,
                                h: 0, 
                                type: 'platform',
                                isGrindable: false,
                                isGap: false,
                                isPlatform: true,
                                passed: false
                            });
                            state.nextObstacleDist = totalW + stairW + 300; 
                        } 
                        else {
                            const template = STANDARD_OBSTACLES[Math.floor(Math.random() * STANDARD_OBSTACLES.length)];
                            state.obstacles.push({
                                id: Date.now(),
                                x: spawnX,
                                y: BASE_FLOOR_Y - template.h + (template.yOffset || 0),
                                w: template.w,
                                h: template.h,
                                type: template.type,
                                isGrindable: template.grind,
                                isGap: template.gap,
                                isPlatform: template.isPlatform,
                                passed: false
                            });
                            if (Math.random() > 0.5) {
                                state.collectibles.push({
                                    id: Date.now() + 99, x: spawnX + template.w/2, y: BASE_FLOOR_Y - template.h - 60, type: 'COIN', collected: false
                                });
                            }
                            state.nextObstacleDist = Math.random() * 300 + 300; 
                        }
                    }
                }

                state.obstacles = state.obstacles.filter(obs => obs.x + obs.w > -200);
                state.collectibles = state.collectibles.filter(c => c.x > -200 && !c.collected);

                state.floatingTexts.forEach(ft => {
                    ft.y -= 1 * dt;
                    ft.life -= dt;
                });
                state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);

                const playerX = state.player.x;
                
                // Prevent platform snapping during abduction
                if (!state.ufoLocked) {
                    const megaRamp = state.obstacles.find(o => o.type === 'mega_ramp' && playerX >= o.x && playerX <= o.x + o.w + 50);
                    if (megaRamp) {
                        state.player.platformId = megaRamp.id;
                    } else if (!state.player.platformId) {
                        if (state.player.y > -20 && state.player.vy >= 0) {
                            const ramp = state.obstacles.find(o => 
                                (o.type === 'ramp' || o.type === 'ramp_up' || o.type === 'concrete_structure') && 
                                playerX >= o.x && 
                                playerX <= o.x + o.w
                            );
                            
                            if (ramp) {
                                state.player.platformId = ramp.id;
                                let newY = ramp.y;
                                if (ramp.type === 'concrete_structure') {
                                    const rampW = 100;
                                    const relativeX = playerX - ramp.x;
                                    if (relativeX < rampW) {
                                        const progress = Math.max(0, relativeX / rampW);
                                        newY = (ramp.y + ramp.h) - (ramp.h * progress);
                                    } else {
                                        newY = ramp.y;
                                    }
                                } else { 
                                    const progress = (playerX - ramp.x) / ramp.w;
                                    newY = (ramp.y + ramp.h) - (ramp.h * progress);
                                }
                                
                                state.currentFloorY = newY;
                                state.player.y = 0;
                                state.player.vy = 0;
                            }
                        }
                    }

                    if (state.player.platformId) {
                        const activePlatform = state.obstacles.find(o => o.id === state.player.platformId);
                        if (activePlatform) {
                            if (playerX < activePlatform.x || playerX > activePlatform.x + activePlatform.w) {
                                if (activePlatform.type === 'mega_ramp' && playerX > activePlatform.x + activePlatform.w) {
                                    exitUnderworld();
                                }
                                else if (activePlatform.type === 'ramp' && playerX > activePlatform.x + activePlatform.w) {
                                    state.player.vy = JUMP_FORCE;
                                    state.player.state = 'JUMPING';
                                    state.player.platformId = null;
                                    getSoundManager().playLaunch();
                                } else {
                                    const nextPlat = state.obstacles.find(o => 
                                        o.isPlatform && 
                                        o.id !== activePlatform.id &&
                                        playerX >= o.x && 
                                        playerX <= o.x + o.w
                                    );

                                    if (nextPlat) {
                                        state.player.platformId = nextPlat.id;
                                        let newFloorY = nextPlat.y;
                                        if (nextPlat.type === 'ramp' || nextPlat.type === 'ramp_up') {
                                            const progress = (playerX - nextPlat.x) / nextPlat.w;
                                            newFloorY = (nextPlat.y + nextPlat.h) - (nextPlat.h * progress);
                                        } else if (nextPlat.type === 'mega_ramp') {
                                            const rampW = nextPlat.w;
                                            const rampH = nextPlat.h;
                                            const relativeX = playerX - nextPlat.x;
                                            const safeW = Math.max(rampW, 1);
                                            const safeH = Math.max(rampH, 1);
                                            const xc = (safeW*safeW - safeH*safeH) / (2*safeW);
                                            const R = safeW - xc;
                                            const distFromCenterX = relativeX - xc;
                                            const term = R*R - distFromCenterX*distFromCenterX;
                                            if (term >= 0) {
                                                newFloorY = nextPlat.y + Math.sqrt(term);
                                            } else {
                                                const progress = Math.max(0, Math.min(1, relativeX / rampW));
                                                newFloorY = (nextPlat.y + nextPlat.h) - (nextPlat.h * progress);
                                            }
                                        } else if (nextPlat.type === 'stairs_down') {
                                            const progress = (playerX - nextPlat.x) / nextPlat.w;
                                            newFloorY = nextPlat.y + (nextPlat.h * progress);
                                        } else if (nextPlat.type === 'concrete_structure') {
                                            const rampW = 100;
                                            const relativeX = playerX - nextPlat.x;
                                            if (relativeX < rampW) {
                                                const progress = relativeX / rampW;
                                                newFloorY = (nextPlat.y + nextPlat.h) - (nextPlat.h * progress);
                                            } else {
                                                newFloorY = nextPlat.y;
                                            }
                                        } else if (nextPlat.type === 'space_platform' || nextPlat.type === 'solar_panel' || nextPlat.type === 'station_girder') {
                                            newFloorY = nextPlat.y;
                                        }

                                        state.currentFloorY = newFloorY;
                                        state.player.y = 0;
                                        state.player.vy = 0;
                                    } else {
                                        const prevY = state.currentFloorY;
                                        state.player.platformId = null;
                                        
                                        if ((state.world as string) === 'SPACE') {
                                        } else {
                                            state.currentFloorY = BASE_FLOOR_Y;
                                        }
                                        
                                        if (prevY < state.currentFloorY) {
                                            state.player.y = prevY - state.currentFloorY; 
                                        } else {
                                            state.player.y = 0;
                                        }
                                    }
                                }
                            } else {
                                if (activePlatform.type === 'ramp' || activePlatform.type === 'ramp_up') {
                                    const progress = (playerX - activePlatform.x) / activePlatform.w;
                                    state.currentFloorY = (activePlatform.y + activePlatform.h) - (activePlatform.h * progress);
                                } else if (activePlatform.type === 'mega_ramp') {
                                    const rampW = activePlatform.w;
                                    const rampH = activePlatform.h;
                                    const relativeX = playerX - activePlatform.x;
                                    const safeW = Math.max(rampW, 1);
                                    const safeH = Math.max(rampH, 1);
                                    const xc = (safeW*safeW - safeH*safeH) / (2*safeW);
                                    const R = safeW - xc;
                                    const distFromCenterX = relativeX - xc;
                                    const term = R*R - distFromCenterX*distFromCenterX;
                                    if (term >= 0) {
                                        state.currentFloorY = activePlatform.y + Math.sqrt(term);
                                        const y_rel = Math.sqrt(term);
                                        const x_rel_center = relativeX - xc;
                                        const slope = -x_rel_center / y_rel; 
                                        state.player.rotation = -Math.atan(slope);
                                    } else {
                                        const progress = Math.max(0, Math.min(1, relativeX / rampW));
                                        state.currentFloorY = (activePlatform.y + activePlatform.h) - (activePlatform.h * progress);
                                    }
                                } else if (activePlatform.type === 'stairs_down') {
                                    const progress = (playerX - activePlatform.x) / activePlatform.w;
                                    state.currentFloorY = activePlatform.y + (activePlatform.h * progress);
                                    if (Math.random() < 0.2 * dt && (state.player.state === 'RUNNING' || state.player.state === 'COASTING')) {
                                        state.score += 10;
                                        getSoundManager().playFirecracker();
                                        if (!activePlatform.firecrackerTriggered) {
                                            activePlatform.firecrackerTriggered = true;
                                            addFloatingText(playerX, state.currentFloorY - 80, "Firecracker +100", "#ef4444");
                                            state.score += 100;
                                        }
                                    }
                                } else if (activePlatform.type === 'concrete_structure') {
                                    const rampW = 100;
                                    const relativeX = playerX - activePlatform.x;
                                    if (relativeX < rampW) {
                                        const progress = Math.max(0, relativeX / rampW);
                                        state.currentFloorY = (activePlatform.y + activePlatform.h) - (activePlatform.h * progress);
                                    } else {
                                        state.currentFloorY = activePlatform.y;
                                    }
                                } else {
                                    state.currentFloorY = activePlatform.y;
                                }
                                state.player.y = 0;
                                state.player.vy = 0;
                            }
                        } else {
                            state.player.platformId = null;
                            if ((state.world as string) !== 'SPACE') state.currentFloorY = BASE_FLOOR_Y;
                        }
                    } else {
                        if ((state.world as string) !== 'SPACE') {
                            state.currentFloorY = BASE_FLOOR_Y;
                        }
                    }
                }

                if (!state.player.platformId && state.player.state !== 'GRINDING' && state.player.state !== 'NATAS_SPIN' && state.player.state !== 'ARRESTED' && state.player.state !== 'ABDUCTED' && !state.ufoLocked) {
                    const currentGravity = state.world === 'SPACE' ? GRAVITY * 0.5 : GRAVITY;
                    state.player.vy += currentGravity * dt;
                    state.player.y += state.player.vy * dt;
                }
                
                const absFeetY = state.currentFloorY + state.player.y;

                if (state.player.state === 'TUMBLING') {
                    state.player.rotation += 0.4 * dt; 
                    if ((state.world as string) !== 'SPACE' && state.player.y >= 0 && state.player.vy > 0) {
                        state.player.y = 0;
                        state.player.vy = 0;
                        state.player.rotation = 0;
                        state.player.state = 'RUNNING';
                        state.player.pushTimer = 0;
                    }
                }
                else if (state.player.state === 'NATAS_SPIN') {
                     state.player.rotation += 0.1 * dt; 
                     if (state.player.rotation >= state.player.natasSpinTarget) {
                          if (state.player.rotation >= state.player.natasSpinTarget) {
                              state.player.state = 'JUMPING';
                              state.player.vy = -5; 
                              state.player.rotation = 0;
                              state.player.trickName = '';
                          }
                     }
                     const fullRotations = Math.floor(state.player.rotation / (Math.PI * 2));
                     if (fullRotations > state.player.natasSpinCount) {
                          state.player.natasSpinCount = fullRotations;
                          if (fullRotations <= 3) { 
                               state.score += 300;
                               addFloatingText(120, state.currentFloorY - 80, "SPIN +300", "#fbbf24");
                               getSoundManager().playGrind(); 
                          }
                     }
                }
                else if (state.player.vy > 0 && !state.player.platformId && !isAbducted) {
                     const potentialPlatforms = state.obstacles.filter(o => 
                         o.isPlatform && 
                         playerX >= o.x && 
                         playerX <= o.x + o.w
                     );
                     
                     for (const plat of potentialPlatforms) {
                         let platY = plat.y;
                         if (plat.type === 'ramp' || plat.type === 'ramp_up') {
                            const progress = (playerX - plat.x) / plat.w;
                            platY = (plat.y + plat.h) - (plat.h * progress);
                         } else if (plat.type === 'mega_ramp') {
                            const rampW = plat.w;
                            const rampH = plat.h;
                            const relativeX = playerX - plat.x;
                            const safeW = Math.max(rampW, 1);
                            const safeH = Math.max(rampH, 1);
                            const xc = (safeW*safeW - safeH*safeH) / (2*safeW);
                            const R = safeW - xc;
                            const distFromCenterX = relativeX - xc;
                            const term = R*R - distFromCenterX*distFromCenterX;
                            if (term >= 0) {
                                 platY = plat.y + Math.sqrt(term);
                            } else {
                                 const progress = Math.max(0, Math.min(1, relativeX / rampW));
                                 platY = (plat.y + plat.h) - (plat.h * progress);
                            }
                         } else if (plat.type === 'stairs_down') {
                            const progress = (playerX - plat.x) / plat.w;
                            platY = plat.y + (plat.h * progress);
                         } else if (plat.type === 'concrete_structure') {
                             const rampW = 100;
                             const relativeX = playerX - plat.x;
                             if (relativeX < rampW) {
                                 const progress = Math.max(0, relativeX / rampW);
                                 platY = (plat.y + plat.h) - (plat.h * progress);
                             } else {
                                 platY = plat.y;
                             }
                         } else {
                             platY = plat.y;
                         }
                         
                         const prevAbsY = absFeetY - state.player.vy * dt;
                         const threshold = (plat.type === 'space_platform' || plat.type === 'solar_panel' || plat.type === 'station_girder') ? 5 : 15;
                         
                         if (prevAbsY <= platY + threshold && absFeetY >= platY) {
                             state.player.platformId = plat.id;
                             state.currentFloorY = platY;
                             state.player.y = 0;
                             state.player.vy = 0;
                             state.player.rotation = 0; 
                             state.player.state = 'RUNNING';
                             state.player.pushTimer = 0;
                             getSoundManager().playGrind();
                             break;
                         }
                     }
                }
                
                if (state.player.y > 0 && !state.player.platformId && (state.world as string) !== 'SPACE') { 
                    if (state.world === 'UNDERWORLD') {
                    } else {
                        let inGap = false;
                        for (const obs of state.obstacles) {
                            if (obs.isGap && playerX > obs.x && playerX < obs.x + obs.w) {
                                inGap = true;
                                break;
                            }
                        }
                        if (inGap) {
                            if (state.player.state !== 'CRASHED') {
                                 state.player.vy += 1.5 * dt; 
                                 handleCrash(); 
                            }
                        } else {
                            state.player.y = 0;
                            state.player.vy = 0;
                            if (state.player.trickName) {
                                const rot = Math.abs(state.player.rotation % (Math.PI * 2));
                                const dist0 = rot; 
                                const dist180 = Math.abs(rot - Math.PI);
                                const dist360 = Math.abs(rot - Math.PI * 2);
                                const threshold = 0.6;
                                const isLanded = dist0 < threshold || dist180 < threshold || dist360 < threshold;
                                if (isLanded) {
                                    if (state.player.trickName === '180') {
                                        state.score += 50;
                                        state.count180++;
                                        addFloatingText(playerX, state.currentFloorY - 80, "180 +50", "#fbbf24");
                                    } else if (state.player.trickName === '360') {
                                        state.score += 100;
                                        state.count360++;
                                        addFloatingText(playerX, state.currentFloorY - 80, "360 +100", "#fbbf24");
                                    } else {
                                        state.score += 500; 
                                    }
                                } else {
                                     addFloatingText(playerX, state.currentFloorY - 80, "Sketchy", "#94a3b8");
                                }
                                state.player.rotation = 0; 
                                state.player.trickName = '';
                                getSoundManager().playGrind(); 
                            }
                            
                            if (state.player.state !== 'CRASHED' && state.player.state !== 'ARRESTED' && state.player.state !== 'TUMBLING') {
                                state.player.rotation = 0; 
                                state.player.state = state.player.isFakie ? 'COASTING' : 'RUNNING';
                                state.player.pushTimer = 0;
                            } 
                        }
                    }
                }

                if (state.player.trickName === 'KICKFLIP') {
                    state.player.rotation += 0.4 * dt; 
                    if (state.player.rotation > Math.PI * 2) {
                        state.player.rotation = 0;
                        state.player.trickName = '';
                        state.score += 100; 
                    }
                } else if (state.player.trickName === '180') {
                    if (state.player.rotation < Math.PI) state.player.rotation += 0.15 * dt;
                } else if (state.player.trickName === '360') {
                    if (state.player.rotation < Math.PI * 2) state.player.rotation += 0.3 * dt;
                }

                const playerRect = { x: state.player.x, y: state.currentFloorY + state.player.y - 50, w: 30, h: 50 };
                state.collectibles.forEach(c => {
                    if (
                        playerRect.x < c.x + 20 &&
                        playerRect.x + playerRect.w > c.x - 20 &&
                        playerRect.y < c.y + 20 &&
                        playerRect.y + playerRect.h > c.y - 20
                    ) {
                        c.collected = true;
                        const points = c.type === 'COIN' ? 100 : 500;
                        state.score += points;
                        addFloatingText(c.x, c.y, `+${points}`, c.type === 'COIN' ? '#fbbf24' : '#22d3ee');
                        getSoundManager().playMetalHit();
                    }
                });

                const pHit = { x: state.player.x, y: state.currentFloorY + state.player.y - 40, w: 20, h: 40 }; 
                
                let onGrind = false;

                for (const obs of state.obstacles) {
                    if (obs.type === 'big_ufo') {
                        const ufoRect = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
                        if (state.abductionActive || state.player.state === 'ABDUCTED') continue;

                        if (pHit.x < ufoRect.x + ufoRect.w && pHit.x + pHit.w > ufoRect.x && 
                            Math.abs((state.currentFloorY + state.player.y) - obs.y) < obs.h/2) {
                             handleCrash();
                             continue; 
                        }
                    }

                    if (obs.type === 'alien_ship') {
                        const alienRect = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
                        const hOverlap = pHit.x < alienRect.x + alienRect.w + 20 && pHit.x + pHit.w > alienRect.x - 20;
                        const vOverlap = pHit.y < alienRect.y + alienRect.h && pHit.y + pHit.h > alienRect.y;
                        
                        if (hOverlap && vOverlap) {
                             const feetY = state.currentFloorY + state.player.y;
                             const ufoTop = obs.y;
                             const isLandingOnTop = state.player.vy > 0 && feetY >= ufoTop - 20 && feetY <= ufoTop + 30;

                             if (isLandingOnTop) {
                                  state.player.vy = -12; 
                                  state.player.state = 'JUMPING';
                                  state.player.platformId = null;
                                  getSoundManager().playMetalHit();
                                  continue;
                             } else {
                                  handleCrash(); // CHANGED: Lose life on collision instead of just falling
                                  continue;
                             }
                        }
                    }

                    if (obs.type === 'fireball') {
                        const fbRect = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
                        if (
                            pHit.x < fbRect.x + fbRect.w &&
                            pHit.x + pHit.w > fbRect.x &&
                            pHit.y < fbRect.y + fbRect.h &&
                            pHit.y + pHit.h > fbRect.y
                        ) {
                            handleCrash();
                            continue;
                        }
                    }

                    if (obs.type === 'stairs_down' && !obs.passed) {
                         if (playerX > obs.x + obs.w) {
                            obs.passed = true;
                            if (state.player.state === 'JUMPING') {
                                state.score += 200; 
                                addFloatingText(playerX, state.currentFloorY - 100, "STAIRS +200", "#22c55e");
                                getSoundManager().playJump();
                            }
                         }
                    }
                    
                    if (obs.isPlatform && !obs.isGrindable) continue; 

                    if (obs.x < pHit.x + pHit.w && obs.x + obs.w > pHit.x) {
                        
                        if ((state.player.state as PlayerState) === 'TUMBLING' || state.player.state === 'CRASHED' || state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED') continue;

                        if (obs.type === 'ramp' && state.player.y < -10) continue;

                        if (obs.isGap) {
                            const boardFront = state.player.x + 15;
                            if (boardFront > obs.x && boardFront < obs.x + 20 && state.player.y > 0) {
                                handleCrash();
                            }
                            continue;
                        }
                        
                        if (obs.type === 'bin' && state.world === 'NORMAL' && !obs.passed) {
                             const feetAbsY = state.currentFloorY + state.player.y;
                             const binTop = obs.y;
                             if (state.player.vy > 0 && Math.abs(feetAbsY - binTop) < 20) {
                                  enterUnderworld();
                                  obs.passed = true;
                                  continue; 
                             }
                        }

                        const feetY = state.currentFloorY + state.player.y;
                        
                        let targetGrindY = obs.y;
                        if (obs.type === 'stairs_down') {
                            const progress = Math.max(0, Math.min(1, (playerX - obs.x) / obs.w));
                            targetGrindY = (obs.y - 15) + (obs.h * progress);
                        } else if (obs.type === 'flat_rail') {
                             targetGrindY = obs.y + obs.h - 10;
                        } else if (obs.type === 'rail') {
                             targetGrindY = obs.y + 5;
                        } else if (obs.type === 'ledge' || obs.type === 'curb' || obs.type === 'cybertruck' || obs.type === 'hydrant') {
                             targetGrindY = obs.y;
                        } else if (obs.type === 'space_platform' || obs.type === 'solar_panel' || obs.type === 'station_girder') {
                             targetGrindY = obs.y;
                        }

                        const distY = Math.abs(feetY - targetGrindY);
                        const isCloseEnough = distY < 35; 
                        
                        if (isCloseEnough && obs.isGrindable && state.player.vy > 0) {
                            if (obs.type === 'hydrant') {
                                 state.player.y = obs.y - state.currentFloorY;
                                 state.player.vy = 0;
                                 state.player.state = 'NATAS_SPIN';
                                 state.player.rotation = 0;
                                 state.player.natasSpinCount = 0;
                                 state.player.natasSpinTarget = Math.PI * 2; 
                                 state.player.natasTapCount = 0;
                                 if (!obs.passed) {
                                     obs.passed = true;
                                     getSoundManager().playGrind();
                                 }
                            } else {
                                state.player.y = targetGrindY - state.currentFloorY;
                                state.player.vy = 0;
                                state.player.state = 'GRINDING';
                                onGrind = true;
                                if (!obs.passed) {
                                    getSoundManager().playGrind();
                                    obs.passed = true; 
                                    state.grindsPerformed++;
                                    
                                    if (obs.type === 'stairs_down') {
                                        state.score += 300;
                                        addFloatingText(120, state.currentFloorY - 50, "300", "#fbbf24");
                                    } else if (obs.type === 'rail') {
                                        state.score += 200;
                                        addFloatingText(120, state.currentFloorY - 50, "200", "#fbbf24");
                                    } else if (obs.type === 'flat_rail' || obs.type === 'ledge' || obs.type === 'curb' || obs.type === 'cybertruck') {
                                        state.score += 100;
                                        addFloatingText(120, state.currentFloorY - 50, "100", "#fbbf24");
                                    } else {
                                        state.score += 100;
                                    }
                                }
                            }
                        } else if (!isCloseEnough && !obs.isPlatform && obs.type !== 'ramp_up' && obs.type !== 'stairs_down' && obs.type !== 'concrete_structure' && obs.type !== 'alien_ship' && obs.type !== 'big_ufo' && obs.type !== 'fireball') {
                            if (obs.type === 'rail' || obs.type === 'flat_rail') {
                                 continue;
                            }
                            
                            const feetYCheck = state.currentFloorY + state.player.y;
                            const isInsideY = feetYCheck > obs.y + 5; 

                            if (isInsideY) {
                                if (obs.type === 'police_car') {
                                    if (!obs.passed) {
                                        obs.passed = true;
                                        obs.doorOpen = true;
                                        state.lives--; // Deduct life
                                        setLives(state.lives);
                                        
                                        if (state.lives <= 0) {
                                            state.status = 'GAME_OVER';
                                            setUiState('GAME_OVER');
                                            saveHighScore(state.score);
                                            getSoundManager().stopMusic();
                                        } else {
                                            state.player.state = 'ARRESTED';
                                            state.score -= 1000;
                                            addFloatingText(120, state.currentFloorY - 100, "BUSTED! -1 LIFE", "#ef4444");
                                            getSoundManager().playSiren();
                                            state.arrestTimer = 0;
                                        }
                                    }
                                } else if (obs.type === 'bin') {
                                    if (!obs.passed) {
                                        obs.passed = true;
                                        state.score -= 500;
                                        addFloatingText(120, state.currentFloorY - 50, "-500", "#ef4444");
                                        const triggerTumble = () => {
                                            const s = stateRef.current;
                                            s.player.state = 'TUMBLING';
                                            s.player.vy = -8; 
                                            s.player.rotation = 0;
                                            getSoundManager().playCrash(); 
                                        };
                                        triggerTumble();
                                    }
                                } else if (obs.type === 'grey_bin') {
                                    if (!obs.passed) {
                                        obs.passed = true;
                                        state.score -= 300;
                                        addFloatingText(120, state.currentFloorY - 50, "-300", "#94a3b8");
                                        const triggerTumble = () => {
                                            const s = stateRef.current;
                                            s.player.state = 'TUMBLING';
                                            s.player.vy = -8; 
                                            s.player.rotation = 0;
                                            getSoundManager().playCrash(); 
                                        };
                                        triggerTumble();
                                    }
                                } else if (obs.type === 'cart') {
                                    if (!obs.passed) {
                                        obs.passed = true;
                                        state.score -= 400;
                                        addFloatingText(120, state.currentFloorY - 50, "-400", "#cbd5e1");
                                        getSoundManager().playMetalHit();
                                        const triggerTumble = () => {
                                            const s = stateRef.current;
                                            s.player.state = 'TUMBLING';
                                            s.player.vy = -8; 
                                            s.player.rotation = 0;
                                            getSoundManager().playCrash(); 
                                        };
                                        triggerTumble();
                                    }
                                } else if (obs.type === 'cybertruck') {
                                    if (!obs.passed) {
                                        obs.passed = true;
                                        state.score -= 1000;
                                        addFloatingText(120, state.currentFloorY - 100, "-1000", "#ef4444");
                                        const triggerMarsLaunch = () => {
                                            const s = stateRef.current;
                                            s.player.state = 'TUMBLING';
                                            s.player.vy = -45; 
                                            s.player.rotation = 0;
                                            getSoundManager().playLaunch();
                                        };
                                        triggerMarsLaunch();
                                    }
                                } else if (obs.type === 'hydrant') {
                                     if (!obs.passed) {
                                         obs.passed = true;
                                         obs.sprayingWater = true;
                                         state.score -= 200;
                                         const triggerHydrantLaunch = () => {
                                             const s = stateRef.current;
                                             s.player.state = 'TUMBLING';
                                             s.player.vy = -25; 
                                             s.player.rotation = 0;
                                             getSoundManager().playLaunch();
                                             addFloatingText(120, s.currentFloorY - 80, "Slam!", "#38bdf8");
                                        };
                                        triggerHydrantLaunch();
                                     }
                                } else {
                                    handleCrash();
                                }
                            }
                        }
                    }
                }
                
                if (state.player.state === 'GRINDING' && !onGrind) {
                    state.player.state = 'JUMPING';
                }

                setScore(state.score);
                setStats({
                    grinds: state.grindsPerformed,
                    jumps: state.jumpsPerformed,
                    c180: state.count180,
                    c360: state.count360
                });
            }
        }

        draw(ctx, state);
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPaused]);

    const draw = (ctx: CanvasRenderingContext2D, state: any) => {
        let viewOffsetY = state.transitionY; 
        if (state.player.y < -150) {
            viewOffsetY = -state.player.y - 150; 
        }

        if (state.world === 'BEAM_DOWN') {
            drawBeamDownSequence(ctx, ctx.canvas.width, ctx.canvas.height, state.transitionY);
        } else if (state.world === 'UNDERWORLD') {
            drawUnderworldBackground(ctx, ctx.canvas.width, ctx.canvas.height, state.totalScroll);
        } else if (state.world === 'TRANSITION_DOWN') {
             drawTransitionPipe(ctx, ctx.canvas.width, ctx.canvas.height, viewOffsetY);
        } else if ((state.world as string) === 'SPACE') {
             // Pass the psychedelic mode and frame to drawSpaceBackground
             // ALSO PASS spaceEntryScroll here
             drawSpaceBackground(ctx, ctx.canvas.width, ctx.canvas.height, state.totalScroll, viewOffsetY, true, state.powerups.psychedelicMode, state.frame, state.spaceEntryScroll);
        } else {
            drawCityBackground(ctx, ctx.canvas.width, ctx.canvas.height, state.totalScroll, BASE_FLOOR_Y, viewOffsetY);
        }

        ctx.save();
        ctx.translate(0, viewOffsetY);

        if (state.world === 'NORMAL') {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const gaps = state.obstacles
                .filter((o: Obstacle) => o.type === 'gap')
                .sort((a: Obstacle, b: Obstacle) => a.x - b.x);

            let currentX = 0;
            const floorY = BASE_FLOOR_Y;

            gaps.forEach((gap: Obstacle) => {
                if (gap.x + gap.w > 0 && gap.x < ctx.canvas.width) {
                    if (gap.x > currentX) {
                        ctx.moveTo(currentX, floorY);
                        ctx.lineTo(gap.x, floorY);
                    }
                    currentX = Math.max(currentX, gap.x + gap.w);
                }
            });

            if (currentX < ctx.canvas.width) {
                ctx.moveTo(currentX, floorY);
                ctx.lineTo(ctx.canvas.width, floorY);
            }
            ctx.stroke();
        }

        if (state.world !== 'TRANSITION_DOWN' && state.world !== 'BEAM_DOWN') {
             state.obstacles.forEach((obs: Obstacle) => {
                drawObstacle(ctx, obs.type, obs.x, obs.y, obs.w, obs.h, obs.sprayingWater, obs.doorOpen);
             });
        }

        state.collectibles.forEach((c: Collectible) => {
            if (!c.collected) {
                drawCollectible(ctx, c.type, c.x, c.y, state.frame);
            }
        });

        if (state.status !== 'GAME_OVER' && state.world !== 'BEAM_DOWN' && state.status !== 'OXXO_SHOP') {
            const isHiddenInCar = state.player.state === 'ARRESTED' && state.arrestTimer > 40;
            
            if (!isHiddenInCar) {
                const drawY = state.currentFloorY + state.player.y;
                drawStickman(
                    ctx, 
                    state.selectedChar, 
                    state.player.x, 
                    drawY - 25, 
                    state.frame, 
                    state.player.state,
                    state.player.rotation,
                    state.player.trickName,
                    state.player.isFakie
                );
            }
        }
        
        // DRAW PROJECTILES (LASERS)
        state.projectiles.forEach((p: Projectile) => {
            // Draw rotating laser? Just simple for now
            drawLaser(ctx, p.x, p.y, 30);
        });
        
        if (state.player.trickName && state.player.state !== 'CRASHED') {
            ctx.fillStyle = '#c52323';
            ctx.font = 'bold 20px Arial';
            ctx.fillText(state.player.trickName, 90, state.currentFloorY + state.player.y - 70);
        }

        state.floatingTexts.forEach((ft: FloatingText) => {
            ctx.save();
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 24px Arial';
            ctx.globalAlpha = ft.life / 30; 
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });

        ctx.restore(); 
        
        if (state.world === 'BEAM_DOWN') {
             drawStickman(
                ctx, 
                state.selectedChar, 
                state.player.x, 
                state.player.y, 
                state.frame, 
                'ABDUCTED',
                state.player.rotation,
                '',
                false
            );
        }
    };

    const triggerAction = useCallback(() => {
        const state = stateRef.current;
        
        if (state.world === 'SPACE') {
            fireLaser();
            return;
        }

        if (state.player.state !== 'NATAS_SPIN' && state.player.state !== 'ARRESTED' && state.player.state !== 'CRASHED' && state.player.state !== 'ABDUCTED') {
             state.player.trickName = 'KICKFLIP';
             state.player.rotation = 0;
             getSoundManager().playTrick();
        }
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.hud-button') || target.closest('.c3d-area')) return;

        if (uiState === 'OXXO_SHOP') return;

        if (uiState !== 'PLAYING' || isPaused) return;
        const state = stateRef.current;
        
        if (state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED' || state.abductionActive) return; 

        if ('touches' in e) {
            state.touchStartY = e.touches[0].clientY;
            state.touchStartX = e.touches[0].clientX;
        } else {
            state.touchStartY = e.clientY;
            state.touchStartX = e.clientX;
        }
        
        const now = Date.now();
        if (now - state.lastTapTime < 300) state.tapCount++;
        else state.tapCount = 1;
        state.lastTapTime = now;

        if (state.player.state === 'NATAS_SPIN') {
             if (state.player.natasSpinCount < 3) {
                 const currentTime = Date.now();
                 if (currentTime - state.player.lastNatasTapTime > 200) {
                     state.player.natasTapCount = 0; 
                 }
                 state.player.natasTapCount++;
                 state.player.lastNatasTapTime = currentTime;

                 if (state.player.natasTapCount >= 3) {
                     if (state.player.natasSpinTarget < Math.PI * 6) {
                         state.player.natasSpinTarget += Math.PI * 2;
                         addFloatingText(state.player.x, state.currentFloorY - 120, "SPIN +1", "#fbbf24");
                         getSoundManager().playGrind();
                     }
                     state.player.natasTapCount = 0; 
                 }
             }
             return;
        }

        const currentState = state.player.state; 

        if ((state.world as string) === 'SPACE') {
             if (currentState === 'JUMPING' || currentState === 'RUNNING' || currentState === 'COASTING' || state.player.platformId) {
                 
                 if (state.player.platformId) {
                     const absY = state.currentFloorY + state.player.y;
                     state.player.platformId = null;
                     state.player.y = absY - state.currentFloorY; 
                 }

                 state.player.vy = JUMP_FORCE * 0.5; 
                 state.player.state = 'JUMPING';
                 getSoundManager().playJump();
                 state.jumpsPerformed++;
                 
                 if (state.tapCount === 2) {
                    state.player.trickName = '180';
                    state.player.rotation = 0;
                    state.player.isFakie = !state.player.isFakie;
                    getSoundManager().playDoubleJump();
                 } else if (state.tapCount === 3) {
                    state.player.trickName = '360';
                    state.player.rotation = 0;
                    state.player.isFakie = !state.player.isFakie;
                    getSoundManager().playDoubleJump();
                 }
             }
             return;
        }

        if (currentState === 'RUNNING' || currentState === 'COASTING' || currentState === 'GRINDING') {
            const activePlat = state.obstacles.find(o => o.id === state.player.platformId);
            const isRidingRamp = activePlat && activePlat.type === 'ramp';

            if (state.player.platformId) {
                 const absY = state.currentFloorY + state.player.y;
                 state.player.platformId = null;
                 
                 if (state.world !== 'SPACE') {
                      state.currentFloorY = BASE_FLOOR_Y;
                 }
                 
                 state.player.y = absY - state.currentFloorY;
            }

            if (isRidingRamp) {
                 state.score += 500;
                 addFloatingText(state.player.x, state.currentFloorY - 100, "BOOST +500", "#3b82f6");
                 enterSpace(); 
            } else {
                 state.player.vy = JUMP_FORCE;
                 getSoundManager().playJump();
            }

            state.player.state = 'JUMPING';
            state.player.y -= 1; 
            state.jumpsPerformed++;
            
            if (currentState === 'COASTING' && !state.player.isFakie) {
                 state.player.state = 'RUNNING';
            }

        } else if (currentState === 'JUMPING') {
            if (state.tapCount === 2) {
                state.player.trickName = '180';
                state.player.rotation = 0;
                state.player.isFakie = !state.player.isFakie;
                getSoundManager().playDoubleJump();
            } else if (state.tapCount === 3) {
                state.player.trickName = '360';
                state.player.rotation = 0;
                state.player.isFakie = !state.player.isFakie;
                getSoundManager().playDoubleJump();
            }
        }
    }, [uiState, isPaused]);

    const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
         if (uiState !== 'PLAYING' || isPaused) return;
         const state = stateRef.current;
         
         if (state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED' || state.abductionActive) return;

         let clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
         let clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

         const deltaX = clientX - state.touchStartX;
         const deltaY = clientY - state.touchStartY;

         if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
             triggerAction();
         } else {
             if ((state.world as string) !== 'SPACE' && state.player.state === 'JUMPING' && state.player.vy < -5) {
                 state.player.vy *= 0.4;
             }
         }
    }, [uiState, isPaused, triggerAction]);

    const startGame = () => {
        const state = stateRef.current;
        state.status = 'PLAYING';
        state.score = 0;
        state.lives = 3;
        state.obstacles = [];
        state.player.x = 100;
        state.player.y = 0;
        state.player.state = 'RUNNING';
        state.player.trickName = '';
        state.player.isFakie = false;
        state.selectedChar = character; 
        state.nextObstacleDist = 0;
        state.currentFloorY = BASE_FLOOR_Y;
        state.jumpsPerformed = 0;
        state.count180 = 0;
        state.count360 = 0;
        state.grindsPerformed = 0;
        state.totalScroll = 0;
        state.player.pushTimer = 0;
        state.player.pushCount = 0;
        state.player.targetPushes = 3; 
        state.arrestTimer = 0;
        state.player.natasSpinCount = 0;
        state.player.natasSpinTarget = 0;
        state.player.natasTapCount = 0;
        state.player.lastNatasTapTime = 0;
        state.player.platformId = null;
        state.world = 'NORMAL';
        state.underworldTimer = 0;
        state.spawnedExit = false;
        state.transitionY = 0;
        state.collectibles = [];
        state.projectiles = [];
        state.ufoKillCount = 0;
        state.spaceDuration = 0;
        state.abductionActive = false;
        state.ufoLocked = false;
        
        state.powerups.has360Laser = false;
        state.powerups.speedBoostTimer = 0;
        state.powerups.psychedelicMode = false;
        state.powerups.doubleSpawnRate = false;
        state.powerups.doubleCoins = false;
        state.shopCooldown = 0;
        state.hasVisitedShop = false;
        
        setScore(0);
        setStats({ grinds: 0, jumps: 0, c180: 0, c360: 0 });
        setLives(3);
        setUiState('PLAYING');
        setIsPaused(false);
        lastTimeRef.current = 0; 
        getSoundManager().startMusic();
    };

    return {
        canvasRef,
        uiState,
        setUiState,
        score,
        stats,
        lives,
        character,
        setCharacter,
        highScore,
        userName,
        setUserName,
        isPaused,
        isMuted,
        togglePause,
        toggleMute,
        startGame,
        handleTouchStart,
        handleTouchEnd,
        triggerAction,
        buyItem, // Export for shop
        closeShop // Export for shop
    };
}
