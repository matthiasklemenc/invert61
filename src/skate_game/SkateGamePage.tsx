
import React, { useState, useEffect } from "react";
import { useSkateGame } from "./useSkateGame";
import GameHUD from "./GameHUD";
import GameMenu from "./GameMenu";
import GameOver from "./GameOver";
import OxxoShopPopup from "./OxxoShopPopup";
import GameProgressPanel from "./GameProgressPanel";
import SecretQuestionModal from "./SecretQuestionModal";

export default function SkateGamePage({ onClose }: { onClose: () => void }) {
    const [isLandscape, setIsLandscape] = useState(
        typeof window !== "undefined"
            ? window.innerWidth > window.innerHeight
            : true
    );
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        const checkMobile = () => {
            const ua =
                typeof navigator !== "undefined"
                    ? navigator.userAgent ||
                      navigator.vendor ||
                      (window as any).opera ||
                      ""
                    : "";
            const isTouch =
                typeof window !== "undefined" &&
                window.matchMedia &&
                window.matchMedia("(pointer: coarse)").matches;
            const isMobileUA = /android|ipad|iphone|ipod|blackberry|iemobile|opera mini/i.test(
                ua.toLowerCase()
            );
            setIsMobile(!!(isTouch || isMobileUA));
        };

        checkMobile();
        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    // -----------------------------------------
    // 🔥 FIX 100VH BUG ON MOBILE
    // -----------------------------------------
    useEffect(() => {
        const fixVH = () => {
            document.documentElement.style.setProperty(
                "--vh",
                `${window.innerHeight * 0.01}px`
            );
        };
        fixVH();

        window.addEventListener("resize", fixVH);
        window.addEventListener("orientationchange", fixVH);

        return () => {
            window.removeEventListener("resize", fixVH);
            window.removeEventListener("orientationchange", fixVH);
        };
    }, []);

    const {
        canvasRef,
        progress,
        secretQuestionOpen,
        secretQuestionFeedback,
        secretQuestionType,
        answerSecretQuestion,
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
        buyItem,
        closeShop,
        resetGameProgress,
        levelComplete,
        playAgainFromLevelOne
    } = useSkateGame();

    // -------------------------------------------------------
    // MOBILE ONLY — TRUE RESPONSIVE CANVAS (RESIZE MODE)
    // -------------------------------------------------------
    // On mobile the canvas drawing area itself is resized to the exact
    // available game area. Nothing is stretched by CSS. This is the same
    // principle as a RESIZE game viewport: the world gets more horizontal
    // space on a wide phone while the existing game coordinates stay
    // undistorted.
    const mobileCanvasContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = mobileCanvasContainerRef.current;
        if (!canvas || !container || !isMobile) return;

        const resizeMobileCanvas = () => {
            const width = Math.max(1, Math.floor(container.clientWidth));
            const height = Math.max(1, Math.floor(container.clientHeight));

            // The canvas drawing coordinate system exactly matches the
            // displayed mobile viewport. There is therefore no CSS
            // aspect-ratio stretching and no cropping of the game height.
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d")?.setTransform(1, 0, 0, 1, 0, 0);
            }
        };

        const observer = new ResizeObserver(resizeMobileCanvas);
        observer.observe(container);

        window.addEventListener("resize", resizeMobileCanvas);
        window.addEventListener("orientationchange", resizeMobileCanvas);

        const frame = requestAnimationFrame(resizeMobileCanvas);
        resizeMobileCanvas();

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", resizeMobileCanvas);
            window.removeEventListener("orientationchange", resizeMobileCanvas);
            cancelAnimationFrame(frame);
        };
    }, [canvasRef, isMobile]);

    // -----------------------------------------
    // 🔥 DESKTOP KEYBOARD CONTROLS
    // -----------------------------------------
    useEffect(() => {
        let arrowUpDownAt = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (uiState === "PLAYING" && !isPaused) {
                    triggerAction();
                }
            } else if (e.code === "ArrowUp") {
                e.preventDefault();
                if (e.repeat || arrowUpDownAt !== 0) return;
                if (uiState === "PLAYING" && !isPaused && startKeyboardJump()) {
                    arrowUpDownAt = Date.now();
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code !== "ArrowUp") return;
            e.preventDefault();
            if (arrowUpDownAt !== 0) {
                const pressDuration = Date.now() - arrowUpDownAt;
                arrowUpDownAt = 0;
                if (uiState === "PLAYING" && !isPaused) {
                    releaseKeyboardJump(pressDuration);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [uiState, isPaused, triggerAction, startKeyboardJump, releaseKeyboardJump]);

    // -----------------------------------------
    // 🔥 ROTATE DEVICE SCREEN
    // -----------------------------------------
    if (isMobile && !isLandscape) {
        return (
            <div className="fixed inset-0 z-[100] bg-gray-900 text-white flex flex-col items-center justify-center p-6">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-16 h-16 mb-6 animate-pulse text-[#c52323]"
                >
                    <path d="M14.25 2.25H18a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V4.56l-2.65 2.65a.75.75 0 1 1-1.06-1.06l2.65-2.65h-1.94a.75.75 0 0 1 0-1.5Zm-10.5 4.5a.75.75 0 0 1 0-1.06l2.65-2.65h-1.94a.75.75 0 0 1 0-1.5h3.75a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V4.56l-2.65 2.65a.75.75 0 0 1-1.06 0ZM20.25 12v5.25c0 1.243-1.007 2.25-2.25 2.25H6c-1.243 0-2.25-1.007-2.25-2.25V12c0-1.243 1.007-2.25 2.25-2.25h12c1.243 0 2.25 1.007 2.25 2.25ZM18.75 12a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75V12Z" />
                </svg>
                <h2 className="text-2xl font-bold uppercase tracking-widest mb-2 text-center">
                    Rotate Device
                </h2>
                <p className="text-gray-400 text-center mb-8">
                    Please play in landscape mode.
                </p>
                <button
                    onClick={onClose}
                    className="border border-gray-600 text-gray-400 px-6 py-2 rounded hover:text-white hover:border-white transition-colors"
                >
                    Exit Game
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900 text-white flex flex-col z-0"
            style={{ touchAction: "none" }}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <GameProgressPanel progress={progress} onReset={resetGameProgress} />

            <GameHUD
                score={score}
                highScore={highScore}
                lives={lives}
                isMuted={isMuted}
                toggleMute={toggleMute}
                isPaused={isPaused}
                togglePause={togglePause}
                onExit={onClose}
                stats={stats}
                showStats={uiState === "PLAYING"}
            />

            {/* LEVEL COMPLETE */}
            {levelComplete && uiState === "PLAYING" && (
                <div className="absolute inset-0 z-[60] overflow-hidden bg-black/80 flex items-center justify-center">
                    {/* Fireworks */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[
                            ["14%", "22%", "text-cyan-300", "0s"],
                            ["84%", "20%", "text-yellow-300", "0.45s"],
                            ["24%", "72%", "text-pink-300", "0.9s"],
                            ["76%", "68%", "text-red-300", "0.2s"],
                            ["50%", "14%", "text-white", "0.65s"],
                            ["52%", "78%", "text-purple-300", "1.1s"],
                        ].map(([left, top, color, delay], index) => (
                            <div
                                key={index}
                                className={`absolute ${color}`}
                                style={{ left, top, animationDelay: delay }}
                            >
                                <div className="relative h-4 w-4 animate-ping">
                                    <div className="absolute inset-0 rounded-full bg-current shadow-[0_0_28px_10px_currentColor]" />
                                    <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 bg-current opacity-70 rotate-0" />
                                    <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 bg-current opacity-70 rotate-45" />
                                    <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 bg-current opacity-70 rotate-90" />
                                    <div className="absolute left-1/2 top-1/2 h-24 w-1 -translate-x-1/2 -translate-y-1/2 bg-current opacity-70 rotate-[135deg]" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative z-10 text-center px-6">
                        <div className="text-sm md:text-base font-black tracking-[0.35em] text-cyan-300 mb-4">
                            LEVEL 1 COMPLETE
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                            LEVEL COMPLETE!
                        </h2>
                        <div className="mt-5 text-2xl md:text-3xl font-black text-yellow-300">
                            LEVEL 2 UNLOCKED
                        </div>
                        <div className="mt-2 text-lg md:text-xl font-bold text-gray-300">
                            IN CONSTRUCTION
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={playAgainFromLevelOne}
                                className="bg-[#c52323] hover:bg-red-600 text-white font-black py-3 px-8 rounded-xl shadow-lg"
                            >
                                PLAY AGAIN
                            </button>
                            <button
                                onClick={onClose}
                                className="border border-gray-500 hover:border-white text-gray-200 font-bold py-3 px-8 rounded-xl"
                            >
                                EXIT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAUSE OVERLAY */}
            {isPaused && uiState === "PLAYING" && !levelComplete && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 text-center shadow-2xl">
                        <h2 className="text-3xl font-bold mb-4">PAUSED</h2>
                        <button
                            onClick={togglePause}
                            className="hud-button bg-[#c52323] text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:bg-red-600"
                        >
                            RESUME
                        </button>
                    </div>
                </div>
            )}

            {/* -----------------------------------------
               🔥 FIXED RESPONSIVE CANVAS
            ------------------------------------------ */}
            <div
                ref={mobileCanvasContainerRef}
                className={
                    isMobile
                        ? "absolute top-[90px] bottom-[64px] left-0 right-0 w-full overflow-hidden"
                        : "flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
                }
            >
                <canvas
                    ref={canvasRef}
                    className="block bg-gray-900"
                    style={{
                        touchAction: "none",
                        width: isMobile ? "100%" : "min(100%, calc((100dvh - 90px) * 16 / 9))",
                        height: isMobile ? "100%" : "min(calc(100dvh - 90px), 56.25vw)",
                        aspectRatio: isMobile ? "auto" : "16 / 9",
                        objectFit: "none",
                        display: "block",
                    }}
                />
            </div>

            {uiState === "MENU" && (
                <GameMenu
                    highScore={highScore}
                    userName={userName}
                    setUserName={setUserName}
                    character={character}
                    setCharacter={setCharacter}
                    startGame={startGame}
                    onExit={onClose}
                />
            )}

            {uiState === "GAME_OVER" && (
                <GameOver
                    score={score}
                    highScore={highScore}
                    stats={stats}
                    startGame={startGame}
                    onMenu={() => setUiState("MENU")}
                />
            )}

            {secretQuestionOpen && (
                <SecretQuestionModal
                    feedback={secretQuestionFeedback}
                    onAnswer={answerSecretQuestion}
                    questionType={secretQuestionType}
                />
            )}

            {uiState === "OXXO_SHOP" && (
                <OxxoShopPopup
                    onBuy={buyItem}
                    onClose={closeShop}
                    currentScore={score}
                />
            )}
        </div>
    );
}
