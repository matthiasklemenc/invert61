

import React, { useState, useEffect } from 'react';
import { GENERAL_QUIZ_QUESTIONS, QuizQuestion, GENERAL_PRIZES } from './generalQuizData';

type Props = {
    onClose: () => void;
};

const GeneralQuizPage: React.FC<Props> = ({ onClose }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
    const [currentLevel, setCurrentLevel] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [wrongAnswersEliminated, setWrongAnswersEliminated] = useState<number[]>([]);
    const [lang, setLang] = useState<'en' | 'es' | 'de'>('en');
    
    // Lifelines
    const [hasFiftyFifty, setHasFiftyFifty] = useState(true);
    const [hasFriend, setHasFriend] = useState(true);

    // Select random question when level changes or game starts
    useEffect(() => {
        if (gameState === 'playing') {
            const targetLevel = currentLevel + 1;
            const pool = GENERAL_QUIZ_QUESTIONS.filter(q => q.level === targetLevel);
            
            if (pool.length > 0) {
                // 1. Pick a random question from the 100 available
                const randomIndex = Math.floor(Math.random() * pool.length);
                const rawQuestion = pool[randomIndex];

                // 2. Shuffle the answer indices [0, 1, 2, 3]
                const indices = [0, 1, 2, 3];
                for (let i = indices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                }

                // 3. Map the answers (and translations) to the new shuffled order
                const shuffledAnswers = indices.map(i => rawQuestion.answers[i]);
                const shuffledAnswersEs = rawQuestion.answers_es ? indices.map(i => rawQuestion.answers_es![i]) : undefined;
                const shuffledAnswersDe = rawQuestion.answers_de ? indices.map(i => rawQuestion.answers_de![i]) : undefined;
                
                // 4. Find where the correct answer moved to
                const newCorrectIndex = indices.indexOf(rawQuestion.correctIndex);

                // 5. Set the question state with shuffled answers
                setCurrentQuestion({
                    ...rawQuestion,
                    answers: shuffledAnswers,
                    answers_es: shuffledAnswersEs,
                    answers_de: shuffledAnswersDe,
                    correctIndex: newCorrectIndex
                });
            } else {
                console.error(`No questions found for level ${targetLevel}`);
                // Fallback without shuffling if pool is empty (shouldn't happen)
                setCurrentQuestion(GENERAL_QUIZ_QUESTIONS[0]);
            }
        }
    }, [currentLevel, gameState]);

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null || !currentQuestion) return;
        setSelectedAnswer(index);

        setTimeout(() => {
            if (index === currentQuestion.correctIndex) {
                if (currentLevel === GENERAL_PRIZES.length - 1) {
                    setGameState('won');
                } else {
                    setCurrentLevel(prev => prev + 1);
                    setSelectedAnswer(null);
                    setWrongAnswersEliminated([]);
                }
            } else {
                setGameState('lost');
            }
        }, 1500);
    };

    const handleFiftyFifty = () => {
        if (!hasFiftyFifty || !currentQuestion) return;
        const incorrectIndices = currentQuestion.answers
            .map((_, idx) => idx)
            .filter(idx => idx !== currentQuestion.correctIndex);
        
        const toEliminate = incorrectIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
        setWrongAnswersEliminated(toEliminate);
        setHasFiftyFifty(false);
    };

    const handleFriendShare = async () => {
        if (!hasFriend || !currentQuestion) return;
        
        const questionText = getQuestionText(currentQuestion);
        const shareData = {
            title: 'INVERT FM General Quiz',
            text: `Help! I'm stuck on this question: ${questionText}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.text);
                alert("Question copied! Send it to a friend.");
            }
            setHasFriend(false);
            setSelectedAnswer(currentQuestion.correctIndex);
            setTimeout(() => {
                if (currentLevel === GENERAL_PRIZES.length - 1) {
                    setGameState('won');
                } else {
                    setCurrentLevel(prev => prev + 1);
                    setSelectedAnswer(null);
                    setWrongAnswersEliminated([]);
                }
            }, 1000);

        } catch (err) {
            console.log('Share canceled or failed', err);
        }
    };

    const restartGame = () => {
        setGameState('intro');
        setCurrentLevel(0);
        setSelectedAnswer(null);
        setWrongAnswersEliminated([]);
        setHasFiftyFifty(true);
        setHasFriend(true);
    };

    const getQuestionText = (q: QuizQuestion) => {
        if (lang === 'es') return q.question_es || q.question;
        if (lang === 'de') return q.question_de || q.question;
        return q.question;
    };

    const getAnswers = (q: QuizQuestion) => {
        if (lang === 'es') return q.answers_es || q.answers;
        if (lang === 'de') return q.answers_de || q.answers;
        return q.answers;
    };

    if (gameState === 'intro') {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 to-gray-900 z-0" />
                <div className="z-10 text-center max-w-md w-full">
                    <h1 className="text-5xl font-black mb-2 tracking-tighter">
                        <span className="text-white">GENERAL</span>
                        <span className="text-blue-500"> QUIZ</span>
                    </h1>
                    <p className="text-xl text-white font-semibold mb-6 tracking-wide">
                        Test your general knowledge
                    </p>
                    <p className="text-gray-400 mb-8 text-lg">
                        1500 Questions.<br/>
                        15 Levels of difficulty.<br/>
                        Become Omniscient.
                    </p>
                    <button 
                        onClick={() => setGameState('playing')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-xl transition-transform transform active:scale-95 shadow-lg mb-4"
                    >
                        START GAME
                    </button>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">Back to Menu</button>
                </div>
            </div>
        );
    }

    if (gameState === 'won' || gameState === 'lost') {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-4xl font-bold mb-4">
                    {gameState === 'won' ? 'OMNISCIENT!' : 'GAME OVER'}
                </h2>
                <p className="text-xl text-gray-300 mb-2">
                    You reached level {currentLevel + 1}
                </p>
                <p className="text-blue-500 font-bold text-2xl mb-8">
                    {GENERAL_PRIZES[Math.max(0, currentLevel - (gameState === 'lost' ? 1 : 0))]}
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button 
                        onClick={restartGame}
                        className="bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200"
                    >
                        Try Again
                    </button>
                    <button 
                        onClick={onClose}
                        className="border border-gray-600 text-gray-400 font-bold py-3 rounded-lg hover:border-white hover:text-white"
                    >
                        Exit
                    </button>
                </div>
            </div>
        );
    }

    if (!currentQuestion) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <div className="flex justify-between items-center p-4 bg-gray-800/50 backdrop-blur-sm">
                <span className="font-bold text-lg text-blue-400">Lv. {currentLevel + 1} / 15</span>
                <div className="flex gap-2">
                    <button onClick={() => setLang('en')} className={`px-2 py-1 rounded text-xs font-bold ${lang === 'en' ? 'bg-white text-black' : 'bg-gray-700 text-gray-400'}`}>EN</button>
                    <button onClick={() => setLang('es')} className={`px-2 py-1 rounded text-xs font-bold ${lang === 'es' ? 'bg-white text-black' : 'bg-gray-700 text-gray-400'}`}>ES</button>
                    <button onClick={() => setLang('de')} className={`px-2 py-1 rounded text-xs font-bold ${lang === 'de' ? 'bg-white text-black' : 'bg-gray-700 text-gray-400'}`}>DE</button>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">Exit</button>
            </div>

            <div className="flex-grow flex flex-col md:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
                <div className="md:order-2 md:w-64 flex-shrink-0 flex flex-col-reverse gap-1 p-4 bg-black/20 rounded-xl border border-white/5 overflow-y-auto max-h-[30vh] md:max-h-none">
                    {GENERAL_PRIZES.map((prize, index) => {
                        let stateClass = "text-gray-600 bg-gray-800/50"; 
                        if (index < currentLevel) stateClass = "text-blue-300 font-bold bg-blue-900/20 border border-blue-500/30";
                        if (index === currentLevel) stateClass = "text-white font-bold bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105 z-10";

                        return (
                            <div key={index} className={`flex justify-between px-3 py-1.5 rounded text-xs md:text-sm transition-all ${stateClass}`}>
                                <span>{index + 1}</span>
                                <span>{prize}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex-grow flex flex-col justify-center md:order-1">
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 p-6 md:p-10 rounded-2xl shadow-2xl text-center mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                        <h2 className="text-xl md:text-3xl font-bold leading-relaxed">
                            {getQuestionText(currentQuestion)}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getAnswers(currentQuestion).map((answer, index) => {
                            const isSelected = selectedAnswer === index;
                            const isCorrect = index === currentQuestion.correctIndex;
                            const isEliminated = wrongAnswersEliminated.includes(index);
                            const showResult = selectedAnswer !== null;

                            let btnClass = "bg-gray-800 border-2 border-gray-700 hover:border-gray-500 hover:bg-gray-750";
                            
                            if (isEliminated) {
                                btnClass = "bg-gray-900 border-transparent opacity-0 pointer-events-none";
                            } else if (showResult) {
                                if (isSelected) {
                                    btnClass = isCorrect 
                                        ? "bg-green-600 border-green-400 animate-pulse" 
                                        : "bg-red-600 border-red-400";
                                } else if (isCorrect) {
                                    btnClass = "bg-green-600 border-green-400";
                                } else {
                                    btnClass = "bg-gray-800 border-gray-700 opacity-50";
                                }
                            } else if (isSelected) {
                                btnClass = "bg-blue-600 border-white";
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(index)}
                                    disabled={selectedAnswer !== null || isEliminated}
                                    className={`py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 flex items-center gap-4 text-left ${btnClass}`}
                                >
                                    <span className="text-blue-400 font-black text-xl">
                                        {String.fromCharCode(65 + index)}:
                                    </span>
                                    {answer}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-center gap-4 mt-8">
                        <button 
                            onClick={handleFiftyFifty}
                            disabled={!hasFiftyFifty || selectedAnswer !== null}
                            className={`flex flex-col items-center gap-1 transition-opacity ${hasFiftyFifty ? 'opacity-100 hover:scale-105' : 'opacity-30 cursor-not-allowed'}`}
                            title="50/50"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-blue-500 flex items-center justify-center font-bold text-xl bg-gray-800">
                                50:50
                            </div>
                        </button>
                        
                        <button 
                            onClick={handleFriendShare}
                            disabled={!hasFriend || selectedAnswer !== null}
                            className={`flex flex-col items-center gap-1 transition-opacity ${hasFriend ? 'opacity-100 hover:scale-105' : 'opacity-30 cursor-not-allowed'}`}
                            title="Ask a Friend"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-blue-500 flex items-center justify-center bg-gray-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralQuizPage;