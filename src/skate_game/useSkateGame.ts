
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getSoundManager } from './SoundManager';
import { drawStickman, drawObstacle, drawCityBackground, drawUnderworldBackground, drawSpaceBackground, drawCollectible, drawTransitionPipe, drawLaser, drawBeamDownSequence, CharacterType, ObstacleType, getOxxoPosition, getSpaceSignalX } from './DrawingHelpers';
import { GameState, PlayerState, WorldState, Player, Obstacle, Collectible, FloatingText, GameStats, Projectile, Powerups } from './GameTypes';
import { GRAVITY, JUMP_FORCE, BASE_FLOOR_Y, SPEED, STANDARD_OBSTACLES } from './GameConstants';
import { GameProgress, loadGameProgress, saveGameProgress, addInventoryItem, discoverCode, awardKnowledge, awardSkill, unlockAchievement, unlockArea } from './GameProgress';
import { drawSecretObject, drawSpaceSignalTransmitter } from './SecretObjects';

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
        touchStartTime: number,
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
        spaceEntryScroll: number,
        playerSpeedControl: number,
        horizontalVelocity: number,
        leftPressed: boolean,
        rightPressed: boolean,
        facingLeft: boolean,
        touchSteerDirection: number,
        touchSteerTimer: number,
        lastSteeringDirection: number,
        underworldHighFireballs: number,
        normalObstacleIndex: number,
        secretHydrantHits: number,
        secretKeyAvailable: boolean,
        secretKeyCollected: boolean,
        secretGarageOpen: boolean,
        secretVhsCollected: boolean,
        secretQuestionSolved: boolean,
        secretHydrantWorldX: number,
        secretGarageWorldX: number,
        secretVhsWorldX: number,
        spaceSignalWorldX: number,
        spaceSignalActive: boolean,
        spaceSignalTimer: number,
        spaceSignalTriggered: boolean,
        spaceSignalQuestionSolved: boolean,
        skillGameActive: boolean,
        skillGameAttempts: number,
        skillGameHits: number,
        skillGameCharge: number,
        skillGameCharging: boolean,
        skillGameShotActive: boolean,
        skillGameBallX: number,
        skillGameBallY: number,
        skillGameBallVx: number,
        skillGameBallVy: number,
        skillGameShotElapsed: number,
        skillGameResult: string,
        skillGameResultTimer: number,
        skillGameChargeStart: number,
        skillPointEarned: boolean
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
            platformId: null,
            isCrouching: false,
            isSpinReady: false
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
        touchStartTime: 0,
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
        spaceEntryScroll: 0,
        playerSpeedControl: 1,
        horizontalVelocity: 0,
        leftPressed: false,
        rightPressed: false,
        facingLeft: false,
        touchSteerDirection: 0,
        touchSteerTimer: 0,
        lastSteeringDirection: 0,
        underworldHighFireballs: 0,
        normalObstacleIndex: 0,
        secretHydrantHits: 0,
        secretKeyAvailable: false,
        secretKeyCollected: false,
        secretGarageOpen: false,
        secretVhsCollected: false,
        secretQuestionSolved: false,
        secretHydrantWorldX: 900,
        secretGarageWorldX: 2500,
        secretVhsWorldX: 2580,
        spaceSignalWorldX: 1150,
        spaceSignalActive: false,
        spaceSignalTimer: 0,
        spaceSignalTriggered: false,
        spaceSignalQuestionSolved: false,
        skillGameActive: false,
        skillGameAttempts: 0,
        skillGameHits: 0,
        skillGameCharge: 0,
        skillGameCharging: false,
        skillGameShotActive: false,
        skillGameBallX: 0,
        skillGameBallY: 0,
        skillGameBallVx: 0,
        skillGameBallVy: 0,
        skillGameShotElapsed: 0,
        skillGameResult: '',
        skillGameResultTimer: 0,
        skillGameChargeStart: 0,
        skillPointEarned: false
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
    const [progress, setProgress] = useState<GameProgress>(() => {
        const loaded = loadGameProgress();
        if (loaded.achievements.includes('SECRET_HUNTER')) {
            return {
                ...loaded,
                inventory: loaded.inventory.includes('Garage Key') ? loaded.inventory : [...loaded.inventory, 'Garage Key'],
                achievements: loaded.achievements.filter(id => id !== 'SECRET_HUNTER'),
            };
        }
        return loaded;
    });
    const [secretQuestionOpen, setSecretQuestionOpen] = useState(false);
    const [secretQuestionFeedback, setSecretQuestionFeedback] = useState('');
    const [secretQuestionType, setSecretQuestionType] = useState<'GARAGE' | 'SPACE'>('GARAGE');

    useEffect(() => {
        saveGameProgress(progress);
    }, [progress]);

    const resetGameProgress = useCallback(() => {
        const emptyProgress: GameProgress = {
            version: 1,
            knowledgePoints: 0,
            skillPoints: 0,
            inventory: [],
            codes: [],
            achievements: [],
            unlockedAreas: [],
        };
        setProgress(emptyProgress);
        const state = stateRef.current;
        state.secretHydrantHits = 0;
        state.secretKeyAvailable = false;
        state.secretKeyCollected = false;
        state.secretGarageOpen = false;
        state.secretVhsCollected = false;
        state.secretQuestionSolved = false;
        state.spaceSignalActive = false;
        state.spaceSignalTimer = 0;
        state.spaceSignalTriggered = false;
        state.spaceSignalQuestionSolved = false;
        state.skillGameActive = false;
        state.skillGameAttempts = 0;
        state.skillGameHits = 0;
        state.skillGameCharge = 0;
        state.skillGameCharging = false;
        state.skillGameShotActive = false;
        state.skillGameResult = '';
        state.skillGameResultTimer = 0;
        state.skillPointEarned = false;
    }, []);

    const addItem = useCallback((item: string) => {
        setProgress(prev => addInventoryItem(prev, item));
    }, []);

    const addCode = useCallback((code: string) => {
        setProgress(prev => discoverCode(prev, code));
    }, []);

    const addKnowledge = useCallback((amount = 1) => {
        setProgress(prev => awardKnowledge(prev, amount));
    }, []);

    const achievement = useCallback((id: string) => {
        setProgress(prev => unlockAchievement(prev, id));
    }, []);

    const unlock = useCallback((id: string) => {
        setProgress(prev => unlockArea(prev, id));
    }, []);

    const answerSecretQuestion = useCallback((answer: string) => {
        const state = stateRef.current;
        const isSpaceQuestion = secretQuestionType === 'SPACE';
        const isCorrect = isSpaceQuestion ? answer === 'SOS_NONE' : answer === '1955';

        if (isCorrect) {
            setSecretQuestionFeedback('');
            setSecretQuestionOpen(false);
            setIsPaused(false);
            state.spaceSignalActive = false;
            getSoundManager().resumeMusic();
            setProgress(prev => {
                let next = awardKnowledge(prev, 1);
                if (isSpaceQuestion) {
                    next = unlockAchievement(next, 'SOS_QUESTION');
                    next = unlockArea(next, 'SPACE_SIGNAL');
                } else {
                    next = unlockAchievement(next, 'OLD_SCHOOL');
                    next = unlockArea(next, 'GARAGE_BASEMENT');
                }
                return next;
            });
            if (isSpaceQuestion) {
                state.spaceSignalQuestionSolved = true;
                state.spaceSignalTriggered = true;
            } else {
                state.secretQuestionSolved = true;
            }
            addFloatingText(state.player.x, state.currentFloorY - 110, 'KNOWLEDGE +1', '#22d3ee');
            getSoundManager().playMetalHit();
        } else {
            setSecretQuestionFeedback(isSpaceQuestion ? 'Not quite. The signal keeps transmitting... try again.' : 'Nope. The tape rewinds... try again.');
        }
    }, [secretQuestionType]);

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
            setProgress(prev => unlockAchievement(prev, 'FIRST_SHOP_PURCHASE'));
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
        state.jumpInputConsumed = false;
        state.playerSpeedControl = 1;
        state.horizontalVelocity = 0;
        state.facingLeft = false;
        state.leftPressed = false;
        state.rightPressed = false;
        state.touchSteerDirection = 0;
        state.touchSteerTimer = 0;
        state.spawnedExit = false;
        getSoundManager().playMetalHit();
        getSoundManager().playUnderworldMusic();
    };

    const exitUnderworld = () => {
        const state = stateRef.current;
        state.world = 'NORMAL';
        state.player.x = canvasRef.current ? canvasRef.current.width / 3 : 100; 
        state.player.vy = -25; 
        state.player.y = 0; 
        state.player.state = 'JUMPING'; 
        state.player.platformId = null;
        state.playerSpeedControl = 1;
        state.horizontalVelocity = 0;
        state.leftPressed = false;
        state.rightPressed = false;
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
        // Place the SOS transmitter a fixed distance into the Space section, independent of the global scroll.
        state.spaceSignalWorldX = state.totalScroll;

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
        state.player.x = canvasRef.current ? canvasRef.current.width / 3 : 100;
        state.player.y = 0;
        state.player.vy = 0;
        state.player.state = 'RUNNING';
        state.player.pushTimer = 0;
        state.jumpInputConsumed = false;
        state.player.rotation = 0;
        state.player.trickName = '';
        state.spawnedExit = false;
        state.underworldHighFireballs = 0;
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

    const addFloatingText = (x: number, y: number, text: string, color: string, fontSize = 24) => {
        stateRef.current.floatingTexts.push({
            id: Date.now(),
            x, y, text, color,
            life: 60,
            fontSize,
        });
    };

    const handleCrash = () => {
        const state = stateRef.current;
        if (state.player.state === 'CRASHED') return; 

        state.player.state = 'CRASHED';
        state.player.isCrouching = false;
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
                state.player.isCrouching = false;
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

    const startSkillGame = useCallback(() => {
        const state = stateRef.current;
        if (state.skillPointEarned) {
            exitUnderworld();
            return;
        }
        state.skillGameActive = true;
        state.skillGameAttempts = 0;
        state.skillGameHits = 0;
        state.skillGameCharge = 0;
        state.skillGameCharging = false;
        state.skillGameShotActive = false;
        state.skillGameBallX = 0;
        state.skillGameBallY = 0;
        state.skillGameBallVx = 0;
        state.skillGameBallVy = 0;
        state.skillGameShotElapsed = 0;
        state.skillGameResult = '';
        state.skillGameResultTimer = 0;
        state.skillGameChargeStart = 0;
        state.player.state = 'RUNNING';
        state.player.y = 0;
        state.player.vy = 0;
        state.player.platformId = null;
        state.player.rotation = 0;
        state.player.trickName = '';
        state.player.isCrouching = false;
    }, [exitUnderworld]);

    const finishSkillGame = useCallback((success: boolean) => {
        const state = stateRef.current;
        state.skillGameActive = false;
        state.skillGameCharging = false;
        state.skillGameShotActive = false;
        state.skillGameResult = '';
        state.skillGameResultTimer = 0;
        if (success) {
            state.skillPointEarned = true;
            setProgress(prev => {
                let next = awardSkill(prev, 1);
                next = unlockAchievement(next, 'FIREBALL_HOOPER');
                return next;
            });
            addFloatingText(state.player.x, state.currentFloorY - 100, 'SKILL POINT +1', '#f59e0b');
        } else {
            addFloatingText(state.player.x, state.currentFloorY - 100, 'CHALLENGE FAILED', '#ef4444');
        }
        exitUnderworld();
    }, [exitUnderworld]);

    const releaseSkillShot = useCallback(() => {
        const state = stateRef.current;
        if (!state.skillGameActive || !state.skillGameCharging || state.skillGameShotActive) return;
        const charge = Math.max(0, Math.min(1, (Date.now() - state.skillGameChargeStart) / 1200));
        state.skillGameCharge = charge;
        state.skillGameCharging = false;
        state.skillGameShotActive = true;
        state.skillGameAttempts += 1;
        state.skillGameShotElapsed = 0;
        const canvas = canvasRef.current;
        const canvasWidth = canvas ? canvas.width : 1080;
        const startX = canvasWidth * 0.28;
        const basketX = canvasWidth * 0.75;
        const basketY = 180;
        const startY = 205;
        const sweetSpot = 0.5;
        const chargeOffset = charge - sweetSpot;
        const skillGravity = 2.89;
        state.skillGameBallX = startX + 22;
        state.skillGameBallY = startY;
        // Use one fixed flight time and horizontal speed so the 50% sweet spot
        // always crosses the rim at the exact same point. The high gravity
        // creates a pronounced real-world-style arc instead of a straight shot.
        const targetTime = 20;
        state.skillGameBallVx = (basketX - state.skillGameBallX) / targetTime;
        const sweetSpotVy = (basketY - startY - 0.5 * skillGravity * targetTime * targetTime) / targetTime;
        state.skillGameBallVy = sweetSpotVy - chargeOffset * 22;
    }, []);

    const startSkillCharge = useCallback(() => {
        const state = stateRef.current;
        if (!state.skillGameActive || state.skillGameShotActive || state.skillGameCharging || state.skillGameResultTimer > 0) return;
        if (state.skillGameAttempts >= 5) return;
        state.skillGameCharging = true;
        state.skillGameChargeStart = Date.now();
        state.skillGameCharge = 0;
    }, []);

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

        const skillDt = state.skillGameActive && state.status === 'PLAYING' ? Math.min(deltaTimeMs / 16.667, 4.0) : 0;
        const dt = isPaused && !state.skillGameActive || state.status !== 'PLAYING' ? 0 : Math.min(deltaTimeMs / 16.667, 4.0);

        if (state.skillGameActive && state.status === 'PLAYING') {
            state.frame += skillDt;
            if (state.skillGameCharging) {
                state.skillGameCharge = Math.min(1, (Date.now() - state.skillGameChargeStart) / 1200);
            }
            if (state.skillGameShotActive) {
                state.skillGameBallX += state.skillGameBallVx * skillDt;
                state.skillGameBallY += state.skillGameBallVy * skillDt;
                state.skillGameBallVy += 2.89 * skillDt;
                state.skillGameShotElapsed += skillDt;
                const basketX = canvas.width * 0.75;
                const basketY = 180;
                const inSweetSpot = state.skillGameCharge >= 0.47 && state.skillGameCharge <= 0.55;
                if (inSweetSpot &&
                    state.skillGameBallX >= basketX - 18 && state.skillGameBallX <= basketX + 28 &&
                    state.skillGameBallY >= basketY - 18 && state.skillGameBallY <= basketY + 18) {
                    state.skillGameHits += 1;
                    state.skillGameShotActive = false;
                    state.skillGameResult = 'SWISH!';
                    state.skillGameResultTimer = 45;
                } else if (state.skillGameBallX > basketX + 60 || state.skillGameBallY > canvas.height + 40 || state.skillGameShotElapsed > 100) {
                    state.skillGameShotActive = false;
                    state.skillGameResult = 'MISS';
                    state.skillGameResultTimer = 45;
                }
            }
            if (state.skillGameResultTimer > 0) {
                state.skillGameResultTimer -= skillDt;
                if (state.skillGameResultTimer <= 0) {
                    state.skillGameResultTimer = 0;
                    if (state.skillGameHits >= 3) {
                        finishSkillGame(true);
                    } else if (state.skillGameAttempts >= 5) {
                        finishSkillGame(false);
                    } else {
                        state.skillGameResult = '';
                    }
                }
            }
            draw(ctx, state);
            requestRef.current = requestAnimationFrame(loop);
            return;
        }

        if (state.status === 'PLAYING' && !isPaused) {
            if (state.spaceSignalActive) {
                state.spaceSignalTimer += deltaTimeMs / 1000;
                if (state.spaceSignalTimer >= 3.3) {
                    state.spaceSignalActive = false;
                    state.spaceSignalTriggered = true;
                    setSecretQuestionFeedback('');
                    setSecretQuestionType('SPACE');
                    setSecretQuestionOpen(true);
                    setIsPaused(true);
                }
            }

            // Classic auto-ride navigation: Kai always travels forward at the
            // normal game speed. There is deliberately no left/right steering.
            // The world scrolls continuously, while Kai stays at one fixed
            // position near the end of the first horizontal third of the screen.
            const baseSpeed = state.powerups.speedBoostTimer > 0 ? SPEED * 2 : SPEED;
            const steeringDirection = 1;
            const worldIsMoving = !state.spaceSignalActive;
            const currentSpeed = baseSpeed;
            state.horizontalVelocity = baseSpeed;
            state.facingLeft = false;

            // Jump/trick physics can still animate while the world scrolls.
            if (worldIsMoving || state.player.state === 'JUMPING' ||
                state.player.state === 'GRINDING' || state.player.state === 'NATAS_SPIN' ||
                state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED') {
                state.frame += dt;
            }

            if (state.touchSteerTimer > 0) {
                state.touchSteerTimer -= dt;
                if (state.touchSteerTimer <= 0) {
                    state.touchSteerTimer = 0;
                    state.touchSteerDirection = 0;
                }
            }
            
            if (state.shopCooldown > 0) {
                state.shopCooldown -= dt;
            }
            
            if (state.powerups.speedBoostTimer > 0) {
                state.powerups.speedBoostTimer -= (deltaTimeMs / 1000);
            }
            const isNatas = state.player.state === 'NATAS_SPIN';
            const isArrested = state.player.state === 'ARRESTED';
            const isAbducted = state.player.state === 'ABDUCTED';

            // Police arrest sequence: pause briefly on BUSTED, then return to play.
            if (isArrested) {
                state.arrestTimer += dt;
                if (state.arrestTimer >= 45) {
                    state.arrestTimer = 0;
                    state.player.state = 'RUNNING';
                    state.player.y = 0;
                    state.player.vy = 0;
                    state.player.rotation = 0;
                    state.player.trickName = '';
                    state.player.platformId = null;
                    state.player.isCrouching = false;
                    state.currentFloorY = BASE_FLOOR_Y;
                    if (state.nextObstacleDist < 400) state.nextObstacleDist = 400;
                    getSoundManager().playMainMusic();
                }
            }

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
                // Camera/beam sequence: the skater visibly travels downward through the beam.
                state.beamDownTimer += dt;
                const duration = 180;
                const progress = Math.min(1, state.beamDownTimer / duration);

                state.player.x = canvas.width / 2;
                state.player.y = -40 + progress * (canvas.height + 80);
                state.player.vy = 0;
                state.player.state = 'ABDUCTED';
                state.player.rotation += 0.04 * dt;

                if (progress >= 1) {
                    state.world = 'NORMAL';
                    state.obstacles = [];
                    state.collectibles = [];
                    state.projectiles = [];
                    state.player.state = 'JUMPING';
                    state.player.rotation = 0;
                    state.player.x = canvasRef.current ? canvasRef.current.width / 3 : 100;
                    state.player.y = -200;
                    state.player.vy = 0;
                    state.player.platformId = null;
                    state.currentFloorY = BASE_FLOOR_Y;
                    state.nextObstacleDist = 500;
                    state.transitionY = 0;
                    state.spaceDuration = 0;
                    state.beamDownTimer = 0;
                    state.abductionActive = false;
                    state.ufoLocked = false;
                    state.player.isCrouching = false;

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
                     state.player.x = canvasRef.current ? canvasRef.current.width / 3 : 100;
                     state.player.isCrouching = false;
                     
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
                if (!isNatas && !isArrested && !state.ufoLocked && state.player.state !== 'CRASHED' && worldIsMoving) {
                    const scrollAmount = currentSpeed * dt * steeringDirection;
                    
                    state.totalScroll += scrollAmount;
                    state.nextObstacleDist -= Math.abs(scrollAmount);
                    state.obstacles.forEach(obs => {
                        // Police cars are world objects. They receive the same camera
                        // scroll as every other obstacle, so Kai's input never directly
                        // moves the police car in the same screen direction.
                        obs.x -= scrollAmount;
                        if (obs.type === 'police_car') {
                            const baseY = BASE_FLOOR_Y - obs.h;
                            obs.y = baseY + Math.sin(state.frame * 0.22 + obs.id * 0.01) * 1.5;
                        }

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

                // Garage entry is automatic: touching the garage with the Garage Key
                // stops the ride and opens the knowledge question.
                if (state.world === 'NORMAL' && !state.ufoLocked && state.player.state !== 'CRASHED' && !state.abductionActive) {
                    const secretInteractionTriggered = trySecretInteraction();
                    if (secretInteractionTriggered && state.secretGarageOpen && !state.secretQuestionSolved && !secretQuestionOpen) {
                        draw(ctx, state);
                        requestRef.current = requestAnimationFrame(loop);
                        return;
                    }
                }

                // While Kai is stopped, police cars also remain fixed in world space.
                if (!isNatas && !isArrested && !state.ufoLocked && state.player.state !== 'CRASHED' && !worldIsMoving) {
                    state.obstacles.forEach(obs => {
                        if (obs.type === 'police_car') {
                            const baseY = BASE_FLOOR_Y - obs.h;
                            obs.y = baseY + Math.sin(state.frame * 0.22 + obs.id * 0.01) * 1.5;
                        }
                    });
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
                     if (!state.spaceSignalQuestionSolved && !state.spaceSignalTriggered && !state.spaceSignalActive) {
                         const signalX = getSpaceSignalX(canvas.width, state.totalScroll, state.spaceEntryScroll);
                         const playerWorldY = state.currentFloorY + state.player.y;
                         // The transmitter is mounted near the top of the space scene.
                         // Kai must jump high enough to reach it; passing underneath does not trigger it.
                         if (Math.abs(signalX - state.player.x) < 55 && playerWorldY < 165) {
                             setSecretQuestionType('SPACE');
                             state.spaceSignalActive = true;
                             state.spaceSignalTimer = 0;
                             getSoundManager().pauseMusic();
                             getSoundManager().playSOSSignal();
                         }
                     }

                     if (state.shopCooldown <= 0 && !state.spaceSignalActive && !state.abductionActive && !state.ufoLocked && state.player.state !== 'CRASHED' && !state.hasVisitedShop) {
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

                                                                                            if (state.spaceDuration > 25 && !state.spaceSignalActive && !state.abductionActive) {
                             // The large UFO arrives after a longer, calmer stretch of Space gameplay. It automatically abducts the skater.
                             state.abductionActive = true;
                             state.beamDownTimer = 0;
                             state.obstacles.push({
                                 id: Date.now(),
                                 x: canvas.width + 200,
                                 y: 70,
                                 w: 300, h: 120,
                                 type: 'big_ufo', isGrindable: false, isGap: false, isPlatform: false, passed: false
                             });
                             addFloatingText(canvas.width - 100, 200, "UFO INCOMING!", "#ef4444");
                         }

                         if (state.abductionActive) {
                             const bigUfo = state.obstacles.find(o => o.type === 'big_ufo');
                             if (bigUfo) {
                                 const isValidState = state.player.state !== 'CRASHED' &&
                                     state.player.state !== 'TUMBLING' &&
                                     state.player.state !== 'ARRESTED' &&
                                     state.player.state !== 'ABDUCTED';

                                 const targetCenterX = state.player.x;
                                 const targetUfoX = targetCenterX - bigUfo.w / 2;

                                 // Fly in from the right and stop above the skater.
                                 if (bigUfo.x > targetUfoX) {
                                     bigUfo.x = Math.max(targetUfoX, bigUfo.x - currentSpeed * dt);
                                 } else {
                                     bigUfo.x = targetUfoX;
                                 }

                                 if ((isValidState || state.ufoLocked) && bigUfo.x <= targetUfoX + 1) {
                                     // The UFO now pulls the skater in automatically. No jump/input is required.
                                     state.ufoLocked = true;
                                     state.beamDownTimer += dt;

                                     const beamCenterX = bigUfo.x + bigUfo.w / 2;
                                     state.player.x += (beamCenterX - state.player.x) * Math.min(1, 0.12 * dt);
                                     state.player.y += (-35 - state.player.y) * Math.min(1, 0.08 * dt);
                                     state.player.vy = -2;
                                     state.player.state = 'ABDUCTED';
                                     state.player.rotation += 0.08 * dt;

                                     // Once the pull-in has completed, switch to the actual beam-down sequence.
                                     if (state.beamDownTimer >= 45) {
                                         state.world = 'BEAM_DOWN';
                                         state.transitionY = 180;
                                         state.beamDownTimer = 0;
                                         state.player.x = canvas.width / 2;
                                         state.player.y = -40;
                                         state.player.vy = 0;
                                         state.player.state = 'ABDUCTED';
                                         state.player.rotation = 0;
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

                // Kai stays horizontally centered.  This is the camera rule
                // that keeps upcoming obstacles visible and makes left/right
                // steering feel like a classic side-scrolling platform game.
                if (state.world === 'NORMAL' || state.world === 'UNDERWORLD') {
                    state.player.x = canvas.width / 3;
                }
                if (worldIsMoving) {
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
                }

                // Obstacles are generated only while the world is moving.
                // Starting the game therefore shows a completely still scene.
                if (worldIsMoving && state.nextObstacleDist <= 0 && !isArrested && !state.abductionActive && !isAbducted) {
                    // Spawn well ahead of Kai. With Kai at one-third of the screen,
                    // this gives the player substantially more reaction time.
                    const spawnAhead = Math.max(650, canvas.width * 0.72);
                    const spawnX = state.player.x + spawnAhead;
                    
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

                         // Space UFOs: keep normal UFOs at their existing small size.
                         // The only large UFO is the final abduction UFO.
                         // The opening is calm, then UFOs become a regular part of the level.
                         const spaceSeconds = state.spaceDuration;
                         let ufoChance = 0;
                         let baseCount = 0;

                         if (spaceSeconds < 5) {
                             // UFOs are present immediately when entering Space.
                             ufoChance = 0.65;
                             baseCount = 1;
                         } else if (spaceSeconds < 12) {
                             ufoChance = 0.85;
                             baseCount = 1;
                         } else {
                             // From 12s onward UFOs are a constant part of Space gameplay.
                             ufoChance = 1.0;
                             baseCount = 1;
                         }

                         if (baseCount > 0 && Math.random() < ufoChance) {
                             const ufoCount = state.powerups.doubleSpawnRate ? (baseCount * 3) : baseCount;

                             for(let k=0; k<ufoCount; k++) {
                                 const randomOffsetX = (Math.random() * 800) - 200;
                                 const randomOffsetY = (Math.random() * 150) - 50;
                                 const alienX = spawnX + randomOffsetX;
                                 const alienY = platY - 200 + randomOffsetY;

                                 // Normal UFOs are deliberately never larger than before.
                                 // Some can be even smaller for visual variety.
                                 const isMiniUfo = Math.random() < 0.30;
                                 const ufoW = isMiniUfo ? 30 : 40;
                                 const ufoH = isMiniUfo ? 15 : 20;

                                 state.obstacles.push({
                                     id: Date.now() + 999 + k,
                                     x: alienX,
                                     y: alienY,
                                     w: ufoW, h: ufoH,
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
                                 if (Math.random() > 0.08) {
                                     state.collectibles.push({
                                         id: Date.now() + i * 10,
                                         x: spawnX + 50 + (i * coinSpacing),
                                         y: platY - 40,
                                         type: Math.random() < 0.28 ? 'DIAMOND' : 'COIN',
                                         collected: false
                                     });
                                 }
                             }

                             // Most fireballs are low and designed to be cleared with
                             // a normal jump. Only 2-4 per run are exceptionally high.
                             const gapCenterX = spawnX + platW + gapSize / 2;
                             const baseFireY = BASE_FLOOR_Y + 300;
                             const remainingHigh = Math.max(0, 4 - state.underworldHighFireballs);
                             const minimumHigh = Math.max(0, 2 - state.underworldHighFireballs);
                             const canSpawnHigh = state.underworldTimer > 300 && remainingHigh > 0;
                             let isHighFireball = false;

                             if (canSpawnHigh) {
                                 const highChance = minimumHigh > 0 ? 0.18 : 0.07;
                                 if (Math.random() < highChance) {
                                     isHighFireball = true;
                                     state.underworldHighFireballs++;
                                 }
                             }

                             // Normal fireballs must rise into the skater's jump path.
                             // They are still clearly lower than the rare high fireballs,
                             // but a small jump should NOT be enough to ignore them.
                             const targetHeight = isHighFireball
                                 ? 480 + Math.random() * 50
                                 :  440 + Math.random() * 40;

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
                                 fireballSpeed: isHighFireball
                                     ? 0.018 + Math.random() * 0.008
                                     : 0.012 + Math.random() * 0.008,
                                 fireballOffset: Math.random() * Math.PI * 2
                             });

                             state.nextObstacleDist = platW + gapSize;
                         }
                    } else {
                        // Normal city: keep the classic dense stream of obstacles.
                        // Every spawn advances through the full obstacle set so ramps,
                        // gaps, rails, ledges, hydrants, bins, trucks, carts and police
                        // all appear regularly. No extra random branch can create long gaps.
                        const obstacleSequence: Array<ObstacleType | 'structure'> = [
                            'police_car',
                            'ledge',
                            'ramp',
                            'gap',
                            'flat_rail',
                            'cybertruck',
                            'rail',
                            'curb',
                            'bin',
                            'cart',
                            'grey_bin',
                            'ramp',
                            'ledge',
                            'structure',
                            'flat_rail',
                            'police_car',
                            'rail',
                            'gap'
                        ];

                        const sequenceIndex = state.normalObstacleIndex % obstacleSequence.length;
                        const sequenceType = obstacleSequence[sequenceIndex];
                        state.normalObstacleIndex++;

                        // Keep the regular obstacle sequence predictable, but make
                        // hydrants independent and random. They are deliberately
                        // skipped after gaps and the stair/structure section so the
                        // player always has a realistic chance to land on them.
                        const canSpawnHydrant = sequenceType !== 'gap' && sequenceType !== 'structure';
                        const spawnHydrant = canSpawnHydrant && Math.random() < 0.28;
                        const obstacleType: ObstacleType | 'structure' = spawnHydrant ? 'hydrant' : sequenceType;

                        if (obstacleType === 'structure') {
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
                                id: Date.now() + 1,
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
                                id: Date.now() + 2,
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

                            state.nextObstacleDist = 300 + Math.random() * 100;
                        } else {
                            const template = STANDARD_OBSTACLES.find(o => o.type === obstacleType)!;

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
                                    id: Date.now() + 99,
                                    x: spawnX + template.w / 2,
                                    y: BASE_FLOOR_Y - template.h - 60,
                                    type: 'COIN',
                                    collected: false
                                });
                            }

                            // Dense, regular spacing like the original game.
                            state.nextObstacleDist = 240 + Math.random() * 140;
                        }

                    }
                }

                state.obstacles = state.obstacles.filter(obs =>
                    obs.x + obs.w > -200
                );
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
                                    if (state.skillPointEarned) {
                                        exitUnderworld();
                                    } else {
                                        startSkillGame();
                                        draw(ctx, state);
                                        requestRef.current = requestAnimationFrame(loop);
                                        return;
                                    }
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

                if (!state.player.platformId && state.player.state !== 'GRINDING' && state.player.state !== 'NATAS_SPIN' && state.player.state !== 'ARRESTED' && state.player.state !== 'ABDUCTED' && !state.ufoLocked && !state.spaceSignalActive) {
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

                     // The first rotation is automatic. Extra rotations are
                     // appended by clicks during the spin (see touch handler).
                     // The player can complete up to 3 rotations in total.
                     const fullRotations = Math.floor(state.player.rotation / (Math.PI * 2));
                     if (fullRotations > state.player.natasSpinCount) {
                          state.player.natasSpinCount = fullRotations;

                          // Every completed hydrant rotation awards 300 points.
                          state.score += 300;
                          addFloatingText(120, state.currentFloorY - 80, "SPIN +300", "#fbbf24");
                          getSoundManager().playGrind();

                          // Five completed rotations solve the hydrant secret.
                          if (fullRotations >= 5 && !state.secretKeyAvailable && !state.secretKeyCollected) {
                               state.secretHydrantHits = 5;
                               state.secretKeyAvailable = false;
                               state.secretKeyCollected = true;
                               addItem('Garage Key');
                               state.score += 250;
                               addFloatingText(state.player.x, state.currentFloorY - 105, '🔑', '#facc15', 44);
                               addFloatingText(state.player.x, state.currentFloorY - 150, 'GARAGE KEY', '#facc15', 22);
                          }
                     }

                     if (state.player.rotation >= state.player.natasSpinTarget) {
                          // The automatic hydrant 360 ends with Kai dropping back
                          // to the ground and continuing to roll. Only a click
                          // during the spin can extend the rotation target.
                          state.player.state = 'COASTING';
                          state.player.vy = 0;
                          state.player.y = 0;
                          state.player.platformId = null;
                          state.player.rotation = 0;
                          state.player.trickName = '';
                          state.player.isSpinReady = false;
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
                             if (state.world === 'UNDERWORLD') {
                                 state.jumpInputConsumed = false;
                             }
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
                                state.player.isSpinReady = false;
                                state.jumpInputConsumed = false;
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

                // Secret hydrant: landing on it is the only interaction. A
                // normal click/tap near the hydrant must never count as a hit.
                if (state.world === 'NORMAL' && !state.secretKeyAvailable && !state.secretKeyCollected &&
                    state.player.state === 'JUMPING' && state.player.vy > 0) {
                    const hydrantX = state.secretHydrantWorldX - state.totalScroll;
                    const feetY = state.currentFloorY + state.player.y;
                    const landingOnHydrant = Math.abs(state.player.x - hydrantX) < 32 &&
                        feetY >= BASE_FLOOR_Y - 55 && feetY <= BASE_FLOOR_Y - 8;
                    if (landingOnHydrant && state.player.state !== 'NATAS_SPIN') {
                        state.player.x = canvas.width / 3;
                        state.player.y = -40;
                        state.player.vy = 0;
                        state.player.state = 'NATAS_SPIN';
                        state.player.rotation = 0;
                        state.player.natasSpinCount = 0;
                        state.player.natasSpinTarget = Math.PI * 2;
                        state.player.natasTapCount = 0;
                        // Landing starts the hydrant spin. The five secret
                        // inputs are counted separately as clicks during the spin.
                        getSoundManager().playMetalHit();
                    }
                }
                
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

                        // A hydrant is a jump-only interaction. Standing inside it,
                        // touching it from the side, or clicking/tapping nearby must
                        // never trigger the secret/Natas interaction.
                        if (obs.type === 'hydrant') {
                            const landingOnHydrant = state.player.vy > 0 &&
                                feetY >= obs.y - 22 && feetY <= obs.y + 18 &&
                                pHit.x + pHit.w > obs.x + 4 && pHit.x < obs.x + obs.w - 4;
                            if (!landingOnHydrant) {
                                continue;
                            }
                        }
                        
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
                                        // The catching car is consumed by the arrest.
                                        // Move it off-screen so Kai cannot be arrested
                                        // again by the same car after the 45-frame pause.
                                        obs.x = -10000;
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

    const drawSkillGame = (ctx: CanvasRenderingContext2D, state: any) => {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);
        drawUnderworldBackground(ctx, w, h, state.totalScroll);

        const floorY = 300;
        const playerX = w * 0.28;
        const basketX = w * 0.75;
        const basketY = 180;

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 UNDERWORLD // SKILL CHALLENGE', w / 2, 48);
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`HITS ${state.skillGameHits}/3    •    ATTEMPTS ${state.skillGameAttempts}/5`, w / 2, 70);

        // Side-on basketball hoop: the backboard is shown edge-on and the rim
        // projects toward the player, so the whole assembly reads as one unit.
        const boardX = basketX + 28;
        const boardTop = basketY - 72;
        const boardH = 62;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(boardX, boardTop, 9, boardH);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.strokeRect(boardX, boardTop, 9, boardH);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(boardX + 4, boardTop + boardH);
        ctx.lineTo(boardX + 4, floorY);
        ctx.stroke();

        // Rim seen from the side: a short horizontal hoop with a small
        // elliptical edge at its front.
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(boardX, basketY);
        ctx.lineTo(basketX, basketY);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(basketX, basketY, 7, 3, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const x = basketX - 5 + i * 3;
            ctx.beginPath();
            ctx.moveTo(x, basketY + 3);
            ctx.lineTo(x - 3, basketY + 28);
            ctx.stroke();
        }

        // Player remains side-on, holding the fireball while charging.
        drawStickman(ctx, state.selectedChar, playerX, floorY - 25, state.frame, 'RUNNING', 0, '', false, false, false);

        const ballX = state.skillGameShotActive ? state.skillGameBallX : playerX + 22;
        const ballY = state.skillGameShotActive ? state.skillGameBallY : 205;
        ctx.save();
        ctx.shadowColor = '#fb923c';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(ballX - 3, ballY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Charge bar. The middle is the calibrated sweet spot.
        const barX = playerX - 85;
        const barY = floorY + 25;
        const barW = 170;
        const barH = 14;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(barX + 2, barY + 2, (barW - 4) * state.skillGameCharge, barH - 4);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(barX + barW * 0.47, barY - 4, barW * 0.08, barH + 8);
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#fde68a';
        ctx.fillText('SWEET SPOT', barX + barW * 0.51, barY + 32);

        if (!state.skillGameShotActive && state.skillGameAttempts < 5 && state.skillGameResult === '') {
            ctx.font = 'bold 7px Arial';
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'left';
            ctx.fillText('HOLD TO CHARGE  •  RELEASE TO SHOOT', barX + barW + 24, barY + 10);
            ctx.textAlign = 'center';
        }
        if (state.skillGameResult) {
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = state.skillGameResult === 'SWISH!' ? '#facc15' : '#ef4444';
            ctx.fillText(state.skillGameResult, w / 2, 90);
        }
        ctx.textAlign = 'left';
    };

    const draw = (ctx: CanvasRenderingContext2D, state: any) => {
        if (state.skillGameActive) {
            drawSkillGame(ctx, state);
            return;
        }
        let viewOffsetY = state.transitionY; 
        if (state.player.y < -150) {
            viewOffsetY = -state.player.y - 150; 
        }

        if (state.world === 'BEAM_DOWN') {
            drawBeamDownSequence(ctx, ctx.canvas.width, ctx.canvas.height, state.transitionY);
            // Keep the UFO visible at the top of the beam so the abduction reads clearly.
            drawObstacle(ctx, 'big_ufo', ctx.canvas.width / 2 - 150, -5, 300, 120, false, false);
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

        if ((state.world as string) === 'SPACE') {
            const signalX = getSpaceSignalX(ctx.canvas.width, state.totalScroll, state.spaceEntryScroll);
            if (signalX > -140 && signalX < ctx.canvas.width + 140 && !state.spaceSignalQuestionSolved) {
                const oxxoPos = getOxxoPosition(ctx.canvas.width, ctx.canvas.height, state.totalScroll, 0, state.spaceEntryScroll);
                drawSpaceSignalTransmitter(ctx, signalX, oxxoPos.y, state.frame, state.spaceSignalTimer);
            }
        }

        if (state.world === 'NORMAL') {
            // Draw the garage BEFORE regular obstacles so police cars and other
            // moving objects visibly pass in front of the garage.
            const garageX = state.secretGarageWorldX - state.totalScroll;
            if (garageX > -220 && garageX < ctx.canvas.width + 100) {
                drawSecretObject(ctx, 'garage', garageX, BASE_FLOOR_Y, state.frame);
            }
        }

        if (state.world !== 'TRANSITION_DOWN' && state.world !== 'BEAM_DOWN') {
             state.obstacles.forEach((obs: Obstacle) => {
                drawObstacle(ctx, obs.type, obs.x, obs.y, obs.w, obs.h, obs.sprayingWater, obs.doorOpen);
             });
        }

        if (state.world === 'NORMAL') {
            const hydrantX = state.secretHydrantWorldX - state.totalScroll;
            if (hydrantX > -100 && hydrantX < ctx.canvas.width + 100 && !state.secretKeyCollected) {
                drawSecretObject(ctx, 'hydrant', hydrantX, BASE_FLOOR_Y, state.frame, state.secretHydrantHits);
            }
            if (state.secretKeyAvailable && !state.secretKeyCollected) {
                const keyX = state.secretHydrantWorldX + 8 - state.totalScroll;
                if (keyX > -80 && keyX < ctx.canvas.width + 80) drawSecretObject(ctx, 'key', keyX, BASE_FLOOR_Y, state.frame);
            }
            if (state.secretGarageOpen && !state.secretVhsCollected) {
                const vhsX = state.secretVhsWorldX - state.totalScroll;
                if (vhsX > -100 && vhsX < ctx.canvas.width + 100) drawSecretObject(ctx, 'vhs', vhsX, BASE_FLOOR_Y, state.frame);
            }
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
                    state.player.isFakie,
                    state.facingLeft,
                    state.player.isCrouching
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
            ctx.font = `bold ${ft.fontSize ?? 24}px Arial`;
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
                false,
                false
            );
        }
    };

    const trySecretInteraction = useCallback(() => {
        const state = stateRef.current;
        if (state.world !== 'NORMAL' || state.player.state === 'CRASHED' || state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED') return false;

        const playerX = state.player.x;
        const playerY = state.currentFloorY + state.player.y;
        const near = (worldX: number, range: number) => Math.abs((worldX - state.totalScroll) - playerX) < range && playerY > state.currentFloorY - 120;

        // The hydrant is NOT activated by clicking. It is activated only by
        // landing on it from above (handled in the game loop).

        // Pick up the key.
        if (state.secretKeyAvailable && !state.secretKeyCollected && near(state.secretHydrantWorldX + 8, 70)) {
            state.secretKeyCollected = true;
            state.secretKeyAvailable = false;
            addItem('Garage Key');
            addFloatingText(playerX, state.currentFloorY - 100, 'KEY + INVENTORY', '#facc15');
            getSoundManager().playMetalHit();
            return true;
        }

        // 3) Garage. The Garage Key is the only way in. Touching the garage
        // opens it and immediately stops the game for the knowledge question.
        if (near(state.secretGarageWorldX, 35)) {
            if (!state.secretKeyCollected) {
                addFloatingText(playerX, state.currentFloorY - 135, 'LOCKED. SOMETHING FITS HERE...', '#94a3b8');
                getSoundManager().playMetalHit();
                return true;
            }

            if (!state.secretGarageOpen) {
                state.secretGarageOpen = true;
                state.score += 500;
                unlock('GARAGE');
                setProgress(prev => unlockAchievement(prev, 'GARAGE_BREAKIN'));
                addFloatingText(playerX, state.currentFloorY - 135, 'GARAGE UNLOCKED', '#22d3ee');
                getSoundManager().playMetalHit();
            }

            if (!state.secretQuestionSolved && !secretQuestionOpen) {
                setSecretQuestionType('GARAGE');
                setSecretQuestionFeedback('');
                setSecretQuestionOpen(true);
                setIsPaused(true);
                getSoundManager().pauseMusic();
            }
            return true;
        }

        return false;
    }, [addItem, unlock]);

    const triggerAction = useCallback(() => {
        const state = stateRef.current;
        
        if (state.world === 'SPACE') {
            fireLaser();
            return;
        }

        if (trySecretInteraction()) return;

        // Normal mouse/tap input is handled by the jump handler below.
        // Never turn a normal click into a kickflip.
        return;
    }, [trySecretInteraction]);

    const triggerJump = useCallback(() => {
        if (uiState !== 'PLAYING' || isPaused) return;

        const state = stateRef.current;
        if (state.skillGameActive) return;
        if (state.spaceSignalActive) return;
        if (state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED' || state.abductionActive) return;
        if (state.player.state === 'JUMPING' || state.player.state === 'NATAS_SPIN') return;

        // Space uses the same immediate bounce as the mouse/touch control.
        if ((state.world as string) === 'SPACE') {
            if (state.player.platformId) {
                const absY = state.currentFloorY + state.player.y;
                state.player.platformId = null;
                state.player.y = absY - state.currentFloorY;
            }
            state.player.rotation = 0;
            state.player.trickName = '';
            state.player.vy = JUMP_FORCE * 0.5;
            state.player.state = 'JUMPING';
            getSoundManager().playJump();
            state.jumpsPerformed++;
            state.player.isCrouching = false;
            return;
        }

        if (state.player.platformId) {
            const activePlat = state.obstacles.find(o => o.id === state.player.platformId);
            const isRidingRamp = activePlat && activePlat.type === 'ramp';
            const absY = state.currentFloorY + state.player.y;
            state.player.platformId = null;
            state.currentFloorY = BASE_FLOOR_Y;
            state.player.y = absY - state.currentFloorY;

            if (isRidingRamp) {
                state.score += 500;
                addFloatingText(state.player.x, state.currentFloorY - 100, 'BOOST +500', '#3b82f6');
                enterSpace();
                state.jumpsPerformed++;
                state.player.isCrouching = false;
                state.jumpInputConsumed = true;
                state.player.isSpinReady = false;
                return;
            }
        }

        if (state.player.y < -2 || Math.abs(state.player.vy) >= 1) return;
        if (state.jumpInputConsumed) return;

        state.player.rotation = 0;
        state.player.trickName = '';
        // Arrow-up is a quick, mouse-click-equivalent jump.
        state.player.vy = JUMP_FORCE * 0.45;
        getSoundManager().playJump();
        state.jumpsPerformed++;
        state.player.isCrouching = false;
        state.jumpInputConsumed = true;
        state.player.isSpinReady = false;
    }, [uiState, isPaused, addFloatingText, enterSpace]);

    // Keyboard jump uses the same charge/release behavior as the mouse,
    // without changing the existing mouse/touch jump code.
    const keyboardJumpStartRef = useRef<number | null>(null);

    const startKeyboardJump = useCallback(() => {
        if (uiState !== 'PLAYING' || isPaused) return false;

        const state = stateRef.current;
        if (state.skillGameActive || state.spaceSignalActive) return false;
        if (state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED' || state.abductionActive) return false;

        // Match the existing mouse jump: keydown only starts the charge.
        // The actual jump happens on keyup, using the held duration.
        if ((state.world as string) === 'SPACE') {
            keyboardJumpStartRef.current = Date.now();
            return true;
        }

        if (state.player.state === 'JUMPING' || state.player.state === 'NATAS_SPIN') return false;
        if (state.jumpInputConsumed) return false;
        if (state.player.y < -2 || Math.abs(state.player.vy) >= 1) return false;

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

        // Exactly like the mouse: crouch/charge now, jump only on release.
        state.touchStartTime = Date.now();
        state.player.isCrouching = true;
        state.jumpInputConsumed = false;
        state.player.rotation = 0;
        state.player.trickName = '';
        keyboardJumpStartRef.current = state.touchStartTime;
        return true;
    }, [uiState, isPaused]);

    const releaseKeyboardJump = useCallback((pressDuration: number) => {
        if (uiState !== 'PLAYING' || isPaused) return;

        const state = stateRef.current;
        if ((state.world as string) === 'SPACE') {
            // Space keeps its existing bounce behavior, but only after keyup.
            if (state.player.platformId) {
                const absY = state.currentFloorY + state.player.y;
                state.player.platformId = null;
                state.player.y = absY - state.currentFloorY;
            }
            state.player.rotation = 0;
            state.player.trickName = '';
            state.player.vy = JUMP_FORCE * 0.5;
            state.player.state = 'JUMPING';
            getSoundManager().playJump();
            state.jumpsPerformed++;
            state.player.isCrouching = false;
            keyboardJumpStartRef.current = null;
            return;
        }

        if (!state.player.isCrouching) {
            keyboardJumpStartRef.current = null;
            return;
        }

        // This is the same variable jump calculation used by the mouse release.
        const activePlat = state.obstacles.find(o => o.id === state.player.platformId);
        const isRidingRamp = activePlat && activePlat.type === 'ramp';

        if (state.player.platformId) {
            const absY = state.currentFloorY + state.player.y;
            state.player.platformId = null;
            state.currentFloorY = BASE_FLOOR_Y;
            state.player.y = absY - state.currentFloorY;
        }

        if (isRidingRamp) {
            state.score += 500;
            addFloatingText(state.player.x, state.currentFloorY - 100, 'BOOST +500', '#3b82f6');
            enterSpace();
        } else {
            state.player.rotation = 0;
            state.player.trickName = '';
            const maxChargeMs = 350;
            const minJumpRatio = 0.45;
            const charge = Math.min(Math.max(pressDuration, 0), maxChargeMs) / maxChargeMs;
            const force = JUMP_FORCE * (minJumpRatio + (1 - minJumpRatio) * charge);
            state.player.vy = force;
            state.player.state = 'JUMPING';
            getSoundManager().playJump();
        }

        state.jumpsPerformed++;
        state.player.isCrouching = false;
        state.jumpInputConsumed = true;
        state.player.isSpinReady = false;
        keyboardJumpStartRef.current = null;
    }, [uiState, isPaused, addFloatingText, enterSpace]);

    // Keyboard jump is a true keydown/keyup equivalent of the existing mouse
    // jump. ArrowUp does not jump on keydown; release determines jump height.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'ArrowUp' || e.repeat) return;
            e.preventDefault();
            if (keyboardJumpStartRef.current !== null) return;
            startKeyboardJump();
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key !== 'ArrowUp') return;
            e.preventDefault();
            const startedAt = keyboardJumpStartRef.current;
            if (startedAt === null) return;
            releaseKeyboardJump(Date.now() - startedAt);
            keyboardJumpStartRef.current = null;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [startKeyboardJump, releaseKeyboardJump]);

    // Arrow keys intentionally do not steer Kai anymore. Navigation is
    // automatic; jumping remains the only normal gameplay input.

    const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('.hud-button') || target.closest('.c3d-area')) return;

        if (uiState === 'OXXO_SHOP') return;

        if (uiState !== 'PLAYING') return;
        const state = stateRef.current;

        if (state.skillGameActive) {
            startSkillCharge();
            return;
        }
        if (isPaused) return;
        
        if (state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED' || state.abductionActive) return; 

        if ('touches' in e) {
            state.touchStartY = e.touches[0].clientY;
            state.touchStartX = e.touches[0].clientX;
        } else {
            state.touchStartY = e.clientY;
            state.touchStartX = e.clientX;
        }
        
        state.touchStartTime = Date.now();
        const now = Date.now();
        if (now - state.lastTapTime < 400) state.tapCount++; // Increased tap window slightly for combos
        else state.tapCount = 1;
        state.lastTapTime = now;

        const currentState = state.player.state; 

        // --- SPACE JUMP LOGIC (MOVED TO TOUCH END) ---
        if ((state.world as string) === 'SPACE') {
             // Space bounce is handled on touch end so a completed click/tap
             // always produces one immediate bounce.
             return;
        }

        // --- NATAS / HYDRANT SPIN ---
        // The first 360° starts automatically when landing on the hydrant.
        // Clicks are counted on release so every completed click counts.
        if (currentState === 'NATAS_SPIN') {
            return;
        }

        // --- GROUND LOGIC (Charge/Crouch) ---
        if ((currentState === 'RUNNING' || currentState === 'COASTING' || currentState === 'GRINDING') &&
            !state.jumpInputConsumed &&
            state.player.y >= -2 &&
            Math.abs(state.player.vy) < 1) {
            state.player.isCrouching = true;
            // DO NOT JUMP YET. Jump happens on Release.
        } 
        // --- AIR LOGIC ---
        // A normal click while airborne must NOT create another jump or rotation.
        // Air tricks are triggered only by their dedicated gesture/input.
        else if (currentState === 'JUMPING') {
            return;
        }
    }, [uiState, isPaused, startSkillCharge]);

    const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
         if (uiState !== 'PLAYING') return;
         const state = stateRef.current;

         if (state.skillGameActive) {
             releaseSkillShot();
             return;
         }
         if (isPaused) return;
         
         if (state.player.state === 'ARRESTED' || state.player.state === 'ABDUCTED' || state.abductionActive) return;

         let clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
         let clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

         const deltaX = clientX - state.touchStartX;
         const deltaY = clientY - state.touchStartY;

         // Vertical swipe keeps the existing trick/action gesture.
         if (Math.abs(deltaY) > 30) {
             triggerAction();
             state.player.isCrouching = false;
             return;
         }

         const pressDuration = Date.now() - state.touchStartTime;

         // --- NATAS / HYDRANT SPIN ---
        // Each click while spinning adds one more 360°. Up to five rotations
        // can be completed; if the player stops clicking, the current target ends normally.
        if (state.player.state === 'NATAS_SPIN') {
             if (state.player.natasTapCount < 4 && state.player.natasSpinTarget < Math.PI * 10) {
                 state.player.natasSpinTarget += Math.PI * 2;
                 state.player.natasTapCount++;
                 getSoundManager().playDoubleJump();
             } else {
                 getSoundManager().playMetalHit();
             }
             state.player.isCrouching = false;
             return;
        }

        // In NORMAL/UNDERWORLD a click in the air is never another jump/trick.
         // SPACE is intentionally handled below and is the only place where
         // repeated taps can bounce Kai higher.
         if ((state.world as string) !== 'SPACE' && state.player.state === 'JUMPING') {
             state.player.isCrouching = false;
             return;
         }

         if (Math.abs(deltaX) <= 30 && Math.abs(deltaY) <= 30 && trySecretInteraction()) {
             return;
         }

         // --- SPACE LOGIC ---
         // Every completed click/tap gives an immediate air bounce. Repeated
         // clicks therefore let the player keep floating between platforms.
         if ((state.world as string) === 'SPACE') {
             if (state.player.platformId) {
                 const absY = state.currentFloorY + state.player.y;
                 state.player.platformId = null;
                 state.player.y = absY - state.currentFloorY;
             }

             state.player.rotation = 0;
             state.player.trickName = '';
             state.player.vy = JUMP_FORCE * 0.5;
             state.player.state = 'JUMPING';
             getSoundManager().playJump();
             state.jumpsPerformed++;
             state.player.isCrouching = false;
             return;
         }

         // Normal/Underworld airborne taps are ignored. This prevents repeated
         // mouse clicks from adding jump height or triggering a rotation.
         if (state.player.state === 'JUMPING') {
             state.player.isCrouching = false;
             return;
         }

         // Handle Ground Release (Jump)
         if (state.player.isCrouching) {
             
             // Trigger Jump
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
                 // A normal jump never inherits a trick rotation.
                 state.player.rotation = 0;
                 state.player.trickName = '';
                 // Preserve state.player.isFakie / facing direction.

                 // Variable Jump Height Logic
                 const maxChargeMs = 350; // Max height reached at 350ms hold
                 const minJumpRatio = 0.45; // Tapping results in 45% of max jump force
                 
                 // Normalize press duration to 0-1 range
                 const charge = Math.min(pressDuration, maxChargeMs) / maxChargeMs;
                 
                 // Linear interpolation: minJump + (diff * charge)
                 const force = JUMP_FORCE * (minJumpRatio + (1 - minJumpRatio) * charge);
                 
                 state.player.vy = force;
                 getSoundManager().playJump();
             }

             // One physical click produces one jump. No air spin is primed.
             state.jumpsPerformed++;
             state.player.isCrouching = false;
             state.jumpInputConsumed = true;
             state.player.isSpinReady = false;
         } else {
             // Air tap release - nothing special unless variable jump height logic needed
             if ((state.world as string) !== 'SPACE' && state.player.state === 'JUMPING' && state.player.vy < -5) {
                 // Variable jump height cut-off if tap was super short? 
                 // We keep it simple for now.
             }
         }

    }, [uiState, isPaused, triggerAction, trySecretInteraction, releaseSkillShot]);

    const startGame = () => {
        const state = stateRef.current;
        state.status = 'PLAYING';
        state.score = 0;
        state.lives = 3;
        state.obstacles = [];
        state.player.x = canvasRef.current ? canvasRef.current.width / 3 : 100;
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
        state.horizontalVelocity = 0;
        state.facingLeft = false;
        state.touchSteerDirection = 0;
        state.touchSteerTimer = 0;
        state.lastSteeringDirection = 0;
        state.leftPressed = false;
        state.rightPressed = false;
        if (progress.inventory.includes('Garage Key')) {
            state.secretHydrantHits = 5;
            state.secretKeyCollected = true;
            state.secretKeyAvailable = false;
        } else {
            // Do not erase partial secret progress or a dropped key on restart.
            state.secretKeyCollected = false;
            state.secretKeyAvailable = state.secretKeyAvailable || state.secretHydrantHits >= 5;
        }
        state.secretGarageOpen = progress.unlockedAreas.includes('GARAGE') || progress.unlockedAreas.includes('GARAGE_BASEMENT');
        state.secretVhsCollected = progress.inventory.includes('VHS_ARCHIVE_01');
        state.secretQuestionSolved = progress.unlockedAreas.includes('GARAGE_BASEMENT');
        state.spaceSignalQuestionSolved = progress.unlockedAreas.includes('SPACE_SIGNAL');
        state.skillPointEarned = progress.skillPoints > 0;
        state.spaceSignalTriggered = state.spaceSignalQuestionSolved;
        state.spaceSignalActive = false;
        state.spaceSignalTimer = 0;
        state.player.pushTimer = 0;
        state.player.pushCount = 0;
        state.player.targetPushes = 3;
        state.jumpInputConsumed = false;
        state.arrestTimer = 0;
        state.player.natasSpinCount = 0;
        state.player.natasSpinTarget = 0;
        state.player.natasTapCount = 0;
        state.player.lastNatasTapTime = 0;
        state.player.platformId = null;
        state.player.isCrouching = false;
        state.player.isSpinReady = false;
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
        progress,
        secretQuestionOpen,
        secretQuestionFeedback,
        secretQuestionType,
        answerSecretQuestion,
        addItem,
        addCode,
        addKnowledge,
        achievement,
        unlock,
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
        triggerJump,
        startKeyboardJump,
        releaseKeyboardJump,
        buyItem, // Export for shop
        closeShop, // Export for shop
        resetGameProgress
    };
}
