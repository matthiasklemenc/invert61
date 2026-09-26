
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
        resetGameProgress
    } = useSkateGame();

    // -------------------------------------------------------
    // 🔥 REAL MOBILE CANVAS FIX — RESIZE OBSERVER
    // -------------------------------------------------------
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // The game simulation uses a 360-unit-tall coordinate system
        // (BASE_FLOOR_Y is 250). Keep that coordinate system intact and only
        // stretch the canvas element to the available screen area.
        const LOGICAL_HEIGHT = 360;

        const resizeCanvasToDisplaySize = (entries: ResizeObserverEntry[]) => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                const height = entry.contentRect.height;

                if (width === 0 || height === 0) continue;

                const logicalWidth = Math.max(1, Math.round((width / height) * LOGICAL_HEIGHT));

                if (canvas.width !== logicalWidth || canvas.height !== LOGICAL_HEIGHT) {
                    canvas.width = logicalWidth;
                    canvas.height = LOGICAL_HEIGHT;
                    canvas.getContext("2d")?.setTransform(1, 0, 0, 1, 0, 0);
                }
            }
        };

        const observer = new ResizeObserver(resizeCanvasToDisplaySize);
        observer.observe(canvas);

        return () => {
            observer.disconnect();
        };
    }, [canvasRef]);

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

            {/* PAUSE OVERLAY */}
            {isPaused && uiState === "PLAYING" && (
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
                className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
            >
                <canvas
                    ref={canvasRef}
                    className="block bg-gray-900"
                    style={{
                        touchAction: "none",
                        width: "min(100%, calc((100dvh - 90px) * 16 / 9))",
                        height: "min(calc(100dvh - 90px), 56.25vw)",
                        aspectRatio: "16 / 9",
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
