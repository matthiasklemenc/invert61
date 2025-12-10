import React, { useState, useMemo } from 'react';
import useLocalStorage from './useLocalStorage';
import { TrainedTricks } from './types';

type Props = {
  onSelectTrick: (trickName: string) => void;
  onClose: () => void;
};

const DEFAULT_TRICKS = [
    "Ollie", "Pumping", "Slam", "FS Grind", "BS Grind", "FS 50/50", "BS 50/50",
    "Rock 'n' Roll", "Fakie Rock", "Tail Tap", "Nose Tap", "Disaster",
    "Fakie Disaster", "FS Disaster", "BS Disaster", "FS Boardslide", "BS Boardslide",
    "FS Smith", "BS Smith", "FS Feeble", "BS Feeble", "BS Air", "FS Air"
];

const SlamModal = ({ onClose }: { onClose: () => void }) => {
    const [lang, setLang] = useState<'en' | 'es' | 'de'>('en');

    const translations = {
        en: {
            title: "DO NOT TRAIN TO SLAM",
            body: [
                "You should not actively train to \"slam\" (fall hard) on a skateboard. Instead, you should focus on learning how to fall correctly and safely to minimize injury, as falling is an inevitable part of skateboarding progression.",
                "Learning to manage falls without getting seriously hurt is a crucial skill that builds confidence and allows you to progress faster and keep skating for longer."
            ],
            sections: [
                {
                    title: "Why You Shouldn't \"Train to Slam\"",
                    points: [
                        "Injury Risk: Hard slams, especially when unexpected or unmanaged, are associated with serious injuries, from sprains and bruises to concussions and broken bones.",
                        "Chronic Impact: Repeatedly slamming hard puts significant stress on your joints, back, and neck, which can lead to long-term issues.",
                        "Inefficient Progress: Progression comes from learning from your attempts (bails and small falls), not from taking unnecessary abuse. Consistently falling badly often means you are trying things too far beyond your current skill level."
                    ]
                },
                {
                    title: "How to Train for Falls (a controlled slam is called a bail)",
                    intro: "The goal is to turn a potential slam into a controlled bail or a roll.",
                    points: [
                        "Practice Rolling: Learn to roll out of a fall, similar to a judo or gymnastics roll, to dissipate energy and avoid direct impact on a single body part. You can practice this on soft surfaces like grass or carpeted floors.",
                        "Stay Loose: Tensing up or going rigid is the worst thing to do during a fall. Keeping your body loose and using your arms and legs to cushion the impact helps absorb the shock.",
                        "Fall Forward: Falling forward is generally safer than falling backward, as it's easier to protect yourself with your hands and arms and roll out of the momentum.",
                        "Wear Protective Gear: Always wear appropriate safety gear. A helmet is essential, and knee pads, elbow pads, and wrist guards are highly recommended, especially when learning. The pads are designed to slide and protect your joints on impact.",
                        "Learn to \"Bail Out\": Recognize when a trick is going wrong and eject from the board before you lose all control. This is a deliberate choice that often prevents a hard slam."
                    ]
                }
            ],
            footer: "Ultimately, falling is part of the process, but learning the correct techniques will help you minimize pain and maximize your time on the board. You can find numerous video tutorials on YouTube that demonstrate proper falling techniques."
        },
        es: {
            title: "NO ENTRENES PARA CAER FUERTE (SLAM)",
            body: [
                "No deberías entrenar activamente para \"caer fuerte\" (slam) en un monopatín. En su lugar, deberías centrarte en aprender a caer correctamente y de forma segura para minimizar las lesiones, ya que caer es una parte inevitable de la progresión en el skateboarding.",
                "Aprender a gestionar las caídas sin lesionarte gravemente es una habilidad crucial que genera confianza y te permite progresar más rápido y seguir patinando por más tiempo."
            ],
            sections: [
                {
                    title: "¿Por qué no deberías \"entrenar para caer fuerte\"?",
                    points: [
                        "Riesgo de Lesión: Las caídas fuertes, especialmente cuando son inesperadas o no se gestionan, se asocian con lesiones graves, desde esguinces y moratones hasta conmociones cerebrales y fracturas.",
                        "Impacto Crónico: Caer fuerte repetidamente ejerce una tensión significativa en tus articulaciones, espalda y cuello, lo que puede provocar problemas a largo plazo.",
                        "Progreso Ineficiente: La progresión proviene de aprender de tus intentos (abandonos y pequeñas caídas), no de recibir abusos innecesarios. Caer mal constantemente a menudo significa que estás intentando cosas muy por encima de tu nivel de habilidad actual."
                    ]
                },
                {
                    title: "Cómo entrenar para las caídas (una caída controlada se llama 'bail')",
                    intro: "El objetivo es convertir una posible caída fuerte en un abandono controlado o una rodada.",
                    points: [
                        "Practica Rodar: Aprende a rodar para salir de una caída, similar a una rodada de judo o gimnasia, para disipar la energía y evitar el impacto directo en una sola parte del cuerpo. Puedes practicar esto en superficies blandas como césped o suelos alfombrados.",
                        "Mantente Relajado: Ponerse tenso o rígido es lo peor que puedes hacer durante una caída. Mantener el cuerpo relajado y usar los brazos y las piernas para amortiguar el impacto ayuda a absorber el golpe.",
                        "Cae hacia Adelante: Caer hacia adelante es generalmente más seguro que caer hacia atrás, ya que es más fácil protegerse con las manos y los brazos y rodar para salir del impulso.",
                        "Usa Equipo de Protección: Siempre usa el equipo de seguridad adecuado. Un casco es esencial, y se recomiendan encarecidamente rodilleras, coderas y muñequeras, especialmente al aprender. Las protecciones están diseñadas para deslizarse y proteger tus articulaciones en el impacto.",
                        "Aprende a \"Abandonar\" (Bail Out): Reconoce cuándo un truco va mal y salta de la tabla antes de perder todo el control. Esta es una elección deliberada que a menudo previene una caída fuerte."
                    ]
                }
            ],
            footer: "En última instancia, caer es parte del proceso, pero aprender las técnicas correctas te ayudará a minimizar el dolor y maximizar tu tiempo sobre la tabla. Puedes encontrar numerosos tutoriales en video en YouTube que demuestran las técnicas adecuadas para caer."
        },
        de: {
            title: "TRAINIERE NICHT, HART ZU STÜRZEN (SLAM)",
            body: [
                "Du solltest nicht aktiv trainieren, auf einem Skateboard hart zu stürzen (\"slam\"). Stattdessen solltest du dich darauf konzentrieren, richtig und sicher zu fallen, um Verletzungen zu minimieren, da Stürze ein unvermeidlicher Teil des Fortschritts beim Skateboarden sind.",
                "Zu lernen, wie man Stürze ohne schwere Verletzungen meistert, ist eine entscheidende Fähigkeit, die Selbstvertrauen aufbaut und es dir ermöglicht, schneller voranzukommen und länger skaten zu können."
            ],
            sections: [
                {
                    title: "Warum du nicht \"trainieren solltest, hart zu stürzen\"",
                    points: [
                        "Verletzungsrisiko: Harte Stürze, besonders wenn sie unerwartet oder unkontrolliert sind, werden mit schweren Verletzungen in Verbindung gebracht, von Verstauchungen und Prellungen bis hin zu Gehirnerschütterungen und Knochenbrüchen.",
                        "Chronische Belastung: Wiederholt hartes Stürzen belastet deine Gelenke, deinen Rücken und deinen Nacken erheblich, was zu langfristigen Problemen führen kann.",
                        "Ineffizienter Fortschritt: Fortschritt entsteht durch das Lernen aus deinen Versuchen (Bails und kleine Stürze), nicht durch unnötige Strapazen. Ständig schlecht zu fallen bedeutet oft, dass du Dinge versuchst, die weit über deinem aktuellen Können liegen."
                    ]
                },
                {
                    title: "Wie man für Stürze trainiert (ein kontrollierter Sturz wird als 'Bail' bezeichnet)",
                    intro: "Das Ziel ist es, einen potenziellen harten Sturz in einen kontrollierten Bail oder eine Rolle umzuwandeln.",
                    points: [
                        "Rollen üben: Lerne, dich aus einem Sturz abzurollen, ähnlich wie bei einer Judo- oder Gymnastikrolle, um Energie abzubauen und den direkten Aufprall auf einen einzelnen Körperteil zu vermeiden. Du kannst dies auf weichen Oberflächen wie Gras oder Teppichböden üben.",
                        "Bleib locker: Sich anzuspannen oder steif zu machen ist das Schlimmste, was du bei einem Sturz tun kannst. Den Körper locker zu halten und Arme und Beine zur Dämpfung des Aufpralls zu benutzen, hilft, den Schock zu absorbieren.",
                        "Nach vorne fallen: Nach vorne zu fallen ist im Allgemeinen sicherer als nach hinten, da es einfacher ist, sich mit Händen und Armen zu schützen und aus dem Schwung abzurollen.",
                        "Schutzausrüstung tragen: Trage immer die richtige Schutzausrüstung. Ein Helm ist unerlässlich, und Knie-, Ellbogen- und Handgelenkschützer sind besonders beim Lernen sehr zu empfehlen. Die Schützer sind so konzipiert, dass sie beim Aufprall rutschen und deine Gelenke schützen.",
                        "Lerne, \"abzuspringen\" (Bail Out): Erkenne, wenn ein Trick schief geht, und springe vom Board, bevor du die gesamte Kontrolle verlierst. Dies ist eine bewusste Entscheidung, die oft einen harten Sturz verhindert."
                    ]
                }
            ],
            footer: "Letztendlich ist Stürzen Teil des Prozesses, aber das Erlernen der richtigen Techniken wird dir helfen, Schmerzen zu minimieren und deine Zeit auf dem Board zu maximieren. Auf YouTube findest du zahlreiche Video-Tutorials, die richtige Falltechniken demonstrieren."
        }
    };
    const content = translations[lang];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-red-500/30 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-red-400">{content.title}</h2>
                    <div className="flex gap-2 items-center">
                        <div className="flex gap-1">
                            <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'en' ? 'bg-white text-black' : 'bg-gray-700'}`}>E</button>
                            <button onClick={() => setLang('es')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'es' ? 'bg-white text-black' : 'bg-gray-700'}`}>ES</button>
                            <button onClick={() => setLang('de')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'de' ? 'bg-white text-black' : 'bg-gray-700'}`}>D</button>
                        </div>
                        <button onClick={onClose} className="text-3xl text-gray-400 hover:text-white">&times;</button>
                    </div>
                </div>
                <div className="text-gray-300 space-y-4 text-sm">
                    {content.body.map((p, i) => <p key={`p-${i}`}>{p}</p>)}
                    {content.sections.map(sec => (
                        <div key={sec.title}>
                            <h3 className="font-bold text-white mb-2">{sec.title}</h3>
                            {sec.intro && <p className="mb-2 italic">{sec.intro}</p>}
                            <ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">
                                {sec.points.map((point, i) => <li key={`pt-${i}`}>{point}</li>)}
                            </ul>
                        </div>
                    ))}
                    <p className="pt-2 border-t border-gray-700/50">{content.footer}</p>
                </div>
            </div>
        </div>
    );
};

const AddTrickInfoModal = ({ onClose }: { onClose: (dontShowAgain: boolean) => void }) => {
    const [lang, setLang] = useState<'en' | 'es' | 'de'>('en');
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const translations = {
        en: {
            title: "Adding a Custom Trick",
            body: "Keep in mind that the tracker uses your phone's motion sensors (gyroscope & accelerometer). It's great at detecting body movements like rotations, jumps, and impacts, but it cannot see what the board is doing independently (e.g., flip tricks).",
            checkbox: "Do not show this again",
            button: "Continue"
        },
        es: {
            title: "Añadir un Truco Personalizado",
            body: "Ten en cuenta que el rastreador utiliza los sensores de movimiento de tu teléfono (giroscopio y acelerómetro). Es excelente para detectar movimientos del cuerpo como rotaciones, saltos e impactos, pero no puede ver lo que la tabla está haciendo de forma independiente (por ejemplo, trucos de flip).",
            checkbox: "No mostrar de nuevo",
            button: "Continuar"
        },
        de: {
            title: "Eigenen Trick hinzufügen",
            body: "Denk daran, dass der Tracker die Bewegungssensoren deines Handys (Gyroskop & Beschleunigungsmesser) verwendet. Er ist großartig darin, Körperbewegungen wie Rotationen, Sprünge und Stöße zu erkennen, kann aber nicht sehen, was das Board unabhängig davon tut (z.B. Flip-Tricks).",
            checkbox: "Nicht erneut anzeigen",
            button: "Weiter"
        }
    };
    const content = translations[lang];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-indigo-500/30">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-indigo-400">{content.title}</h2>
                    <div className="flex gap-1">
                        <button onClick={() => setLang('en')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'en' ? 'bg-white text-black' : 'bg-gray-700'}`}>E</button>
                        <button onClick={() => setLang('es')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'es' ? 'bg-white text-black' : 'bg-gray-700'}`}>ES</button>
                        <button onClick={() => setLang('de')} className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'de' ? 'bg-white text-black' : 'bg-gray-700'}`}>D</button>
                    </div>
                </div>
                <p className="text-gray-300 text-sm mb-6">{content.body}</p>
                <div className="flex flex-col items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} />
                        {content.checkbox}
                    </label>
                    <button onClick={() => onClose(dontShowAgain)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded-lg w-full">
                        {content.button}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddTrickModal = ({ onAdd, onClose }: { onAdd: (name: string) => void, onClose: () => void }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
                <h2 className="font-bold text-lg mb-4">Add Custom Trick</h2>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., Blunt to Fakie"
                    className="w-full bg-gray-700 p-2 rounded mb-4"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-gray-600 py-2 rounded">Cancel</button>
                    <button onClick={() => { if (name.trim()) onAdd(name.trim()); }} disabled={!name.trim()} className="flex-1 bg-indigo-600 py-2 rounded disabled:opacity-50">Add</button>
                </div>
            </div>
        </div>
    );
};

const TrickTrainingPage: React.FC<Props> = ({ onSelectTrick, onClose }) => {
    const [trainedTricks] = useLocalStorage<TrainedTricks>('invert-trained-tricks', {});
    const [userTricks, setUserTricks] = useLocalStorage<string[]>('invert-user-tricks', []);
    const [deletedDefaultTricks, setDeletedDefaultTricks] = useLocalStorage<string[]>('invert-deleted-tricks', []);
    
    const [showSlamModal, setShowSlamModal] = useState(false);
    const [showAddTrickModal, setShowAddTrickModal] = useState(false);
    const [showAddTrickInfo, setShowAddTrickInfo] = useLocalStorage('invert-add-trick-info', true);

    const displayTricks = useMemo(() => {
        const defaultVisible = DEFAULT_TRICKS.filter(t => !deletedDefaultTricks.includes(t));
        return [...defaultVisible, ...userTricks].sort((a, b) => a.localeCompare(b));
    }, [userTricks, deletedDefaultTricks]);

    const handleDelete = (trickName: string) => {
        if (DEFAULT_TRICKS.includes(trickName)) {
            setDeletedDefaultTricks(prev => [...prev, trickName]);
        } else {
            setUserTricks(prev => prev.filter(t => t !== trickName));
        }
    };
    
    const handleAddTrick = (name: string) => {
        if (name && ![...DEFAULT_TRICKS, ...userTricks].includes(name)) {
            setUserTricks(prev => [...prev, name]);
        }
        setShowAddTrickModal(false);
    };

    const openAddTrickFlow = () => {
        const seenInfo = localStorage.getItem('invert-add-trick-info-seen') === 'true';
        if (seenInfo) {
            setShowAddTrickModal(true);
        } else {
            setShowAddTrickInfo(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
            {showSlamModal && <SlamModal onClose={() => setShowSlamModal(false)} />}
            {showAddTrickModal && <AddTrickModal onAdd={handleAddTrick} onClose={() => setShowAddTrickModal(false)} />}
            {showAddTrickInfo && <AddTrickInfoModal onClose={(dontShow) => {
                if (dontShow) {
                    localStorage.setItem('invert-add-trick-info-seen', 'true');
                }
                setShowAddTrickInfo(false);
                setShowAddTrickModal(true);
            }} />}


            <header className="flex items-center justify-between mb-8 relative h-10">
                <button onClick={onClose} className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold tracking-wider text-gray-100 text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    Train Tricks
                </h1>
            </header>
            
            <main className="w-full max-w-4xl mx-auto flex-grow">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {displayTricks.map(trickName => {
                        const takesCount = trainedTricks[trickName]?.filter(Boolean).length || 0;
                        return (
                            <div
                                key={trickName}
                                className="relative group bg-neutral-800 p-3 rounded-lg border border-white/5 h-20 flex flex-col justify-between"
                            >
                                <button
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('.delete-trick-btn')) return;
                                        if (trickName === 'Slam') {
                                            setShowSlamModal(true);
                                        } else {
                                            onSelectTrick(trickName);
                                        }
                                    }}
                                    className="w-full h-full text-left flex flex-col justify-between"
                                >
                                    <span className="font-bold text-sm leading-tight text-white">{trickName}</span>
                                    <div className="flex items-center gap-1 mt-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < takesCount ? 'bg-green-500' : 'bg-neutral-700'}`}></div>
                                        ))}
                                    </div>
                                </button>
                                
                                {trickName !== 'Slam' && (
                                <button
                                    onClick={() => handleDelete(trickName)}
                                    className="delete-trick-btn absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Delete ${trickName}`}
                                >
                                    <span className="text-2xl font-bold leading-none">&times;</span>
                                </button>
                                )}
                            </div>
                        );
                    })}
                    <button
                         onClick={openAddTrickFlow}
                        className="bg-neutral-800/50 border-2 border-dashed border-neutral-700 p-3 rounded-lg text-neutral-500 hover:text-white hover:border-neutral-500 transition-colors h-20 flex flex-col items-center justify-center"
                    >
                        <span className="text-2xl font-bold">+</span>
                        <span className="text-xs">Add a trick</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default TrickTrainingPage;