
export interface QuizQuestion {
    question: string;
    answers: string[];
    correctIndex: number;
    level: number;
    
    // Translations
    question_es?: string;
    answers_es?: string[];
    question_de?: string;
    answers_de?: string[];
}

export const GENERAL_PRIZES = [
    "Novice", "Beginner", "Learner", "Amateur", "Educated",
    "Competent", "Skilled", "Proficient", "Expert", "Scholar",
    "Master", "Grandmaster", "Genius", "Sage", "Omniscient"
];

// Base questions with translations
const BASE_QUESTIONS: QuizQuestion[] = [
    // Level 1 (Novice)
    { 
        level: 1, 
        question: "What is the capital of France?", 
        answers: ["Berlin", "Madrid", "Paris", "Rome"], 
        correctIndex: 2,
        question_es: "¿Cuál es la capital de Francia?",
        answers_es: ["Berlín", "Madrid", "París", "Roma"],
        question_de: "Was ist die Hauptstadt von Frankreich?",
        answers_de: ["Berlin", "Madrid", "Paris", "Rom"]
    },
    { 
        level: 1, 
        question: "How many legs does a spider have?", 
        answers: ["Six", "Eight", "Ten", "Twelve"], 
        correctIndex: 1,
        question_es: "¿Cuántas patas tiene una araña?",
        answers_es: ["Seis", "Ocho", "Diez", "Doce"],
        question_de: "Wie viele Beine hat eine Spinne?",
        answers_de: ["Sechs", "Acht", "Zehn", "Zwölf"]
    },
    { 
        level: 1, 
        question: "Which planet is known as the Red Planet?", 
        answers: ["Mars", "Jupiter", "Venus", "Saturn"], 
        correctIndex: 0,
        question_es: "¿Qué planeta es conocido como el Planeta Rojo?",
        answers_es: ["Marte", "Júpiter", "Venus", "Saturno"],
        question_de: "Welcher Planet ist als der Rote Planet bekannt?",
        answers_de: ["Mars", "Jupiter", "Venus", "Saturn"]
    },
    { 
        level: 1, 
        question: "What is H2O commonly known as?", 
        answers: ["Salt", "Sugar", "Water", "Gold"], 
        correctIndex: 2,
        question_es: "¿Cómo se conoce comúnmente al H2O?",
        answers_es: ["Sal", "Azúcar", "Agua", "Oro"],
        question_de: "Als was ist H2O gemeinhin bekannt?",
        answers_de: ["Salz", "Zucker", "Wasser", "Gold"]
    },
    // Level 2
    { 
        level: 2, 
        question: "Who painted the Mona Lisa?", 
        answers: ["Van Gogh", "Picasso", "Da Vinci", "Monet"], 
        correctIndex: 2,
        question_es: "¿Quién pintó la Mona Lisa?",
        answers_es: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
        question_de: "Wer malte die Mona Lisa?",
        answers_de: ["Van Gogh", "Picasso", "Da Vinci", "Monet"]
    },
    { 
        level: 2, 
        question: "What is the largest ocean on Earth?", 
        answers: ["Atlantic", "Indian", "Pacific", "Arctic"], 
        correctIndex: 2,
        question_es: "¿Cuál es el océano más grande de la Tierra?",
        answers_es: ["Atlántico", "Índico", "Pacífico", "Ártico"],
        question_de: "Welches ist der größte Ozean der Erde?",
        answers_de: ["Atlantik", "Indischer Ozean", "Pazifik", "Arktis"]
    },
    // Level 3
    { 
        level: 3, 
        question: "What is the chemical symbol for Gold?", 
        answers: ["Go", "Gd", "Au", "Ag"], 
        correctIndex: 2,
        question_es: "¿Cuál es el símbolo químico del oro?",
        answers_es: ["Go", "Gd", "Au", "Ag"],
        question_de: "Was ist das chemische Symbol für Gold?",
        answers_de: ["Go", "Gd", "Au", "Ag"]
    },
    { 
        level: 3, 
        question: "Which country invented pizza?", 
        answers: ["France", "Italy", "USA", "Greece"], 
        correctIndex: 1,
        question_es: "¿Qué país inventó la pizza?",
        answers_es: ["Francia", "Italia", "EE. UU.", "Grecia"],
        question_de: "Welches Land hat die Pizza erfunden?",
        answers_de: ["Frankreich", "Italien", "USA", "Griechenland"]
    },
    // Level 4
    { 
        level: 4, 
        question: "Who wrote 'Romeo and Juliet'?", 
        answers: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], 
        correctIndex: 1,
        question_es: "¿Quién escribió 'Romeo y Julieta'?",
        answers_es: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
        question_de: "Wer schrieb 'Romeo und Julia'?",
        answers_de: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"]
    },
    { 
        level: 4, 
        question: "How many continents are there?", 
        answers: ["5", "6", "7", "8"], 
        correctIndex: 2,
        question_es: "¿Cuántos continentes hay?",
        answers_es: ["5", "6", "7", "8"],
        question_de: "Wie viele Kontinente gibt es?",
        answers_de: ["5", "6", "7", "8"]
    },
    // Level 5
    { 
        level: 5, 
        question: "What year did World War II end?", 
        answers: ["1940", "1942", "1945", "1950"], 
        correctIndex: 2,
        question_es: "¿En qué año terminó la Segunda Guerra Mundial?",
        answers_es: ["1940", "1942", "1945", "1950"],
        question_de: "In welchem Jahr endete der Zweite Weltkrieg?",
        answers_de: ["1940", "1942", "1945", "1950"]
    },
    { 
        level: 5, 
        question: "What is the hardest natural substance?", 
        answers: ["Gold", "Iron", "Diamond", "Platinum"], 
        correctIndex: 2,
        question_es: "¿Cuál es la sustancia natural más dura?",
        answers_es: ["Oro", "Hierro", "Diamante", "Platino"],
        question_de: "Was ist die härteste natürliche Substanz?",
        answers_de: ["Gold", "Eisen", "Diamant", "Platin"]
    },
    // Level 6
    { 
        level: 6, 
        question: "Which element is needed for combustion?", 
        answers: ["Helium", "Oxygen", "Carbon", "Nitrogen"], 
        correctIndex: 1,
        question_es: "¿Qué elemento es necesario para la combustión?",
        answers_es: ["Helio", "Oxígeno", "Carbono", "Nitrógeno"],
        question_de: "Welches Element wird für die Verbrennung benötigt?",
        answers_de: ["Helium", "Sauerstoff", "Kohlenstoff", "Stickstoff"]
    },
    { 
        level: 6, 
        question: "What is the capital of Japan?", 
        answers: ["Beijing", "Seoul", "Tokyo", "Bangkok"], 
        correctIndex: 2,
        question_es: "¿Cuál es la capital de Japón?",
        answers_es: ["Pekín", "Seúl", "Tokio", "Bangkok"],
        question_de: "Was ist die Hauptstadt von Japan?",
        answers_de: ["Peking", "Seoul", "Tokio", "Bangkok"]
    },
    // Level 7
    { 
        level: 7, 
        question: "Who discovered penicillin?", 
        answers: ["Alexander Fleming", "Marie Curie", "Isaac Newton", "Albert Einstein"], 
        correctIndex: 0,
        question_es: "¿Quién descubrió la penicilina?",
        answers_es: ["Alexander Fleming", "Marie Curie", "Isaac Newton", "Albert Einstein"],
        question_de: "Wer entdeckte das Penicillin?",
        answers_de: ["Alexander Fleming", "Marie Curie", "Isaac Newton", "Albert Einstein"]
    },
    { 
        level: 7, 
        question: "How many bones are in the adult human body?", 
        answers: ["200", "206", "212", "250"], 
        correctIndex: 1,
        question_es: "¿Cuántos huesos tiene el cuerpo humano adulto?",
        answers_es: ["200", "206", "212", "250"],
        question_de: "Wie viele Knochen hat der erwachsene menschliche Körper?",
        answers_de: ["200", "206", "212", "250"]
    },
    // Level 8
    { 
        level: 8, 
        question: "What is the speed of light (approx)?", 
        answers: ["300,000 km/s", "150,000 km/s", "1,000 km/s", "Sound speed"], 
        correctIndex: 0,
        question_es: "¿Cuál es la velocidad de la luz (aprox)?",
        answers_es: ["300,000 km/s", "150,000 km/s", "1,000 km/s", "Velocidad del sonido"],
        question_de: "Wie hoch ist die Lichtgeschwindigkeit (ca.)?",
        answers_de: ["300.000 km/s", "150.000 km/s", "1.000 km/s", "Schallgeschwindigkeit"]
    },
    { 
        level: 8, 
        question: "Which planet has the most moons?", 
        answers: ["Earth", "Mars", "Jupiter", "Saturn"], 
        correctIndex: 3,
        question_es: "¿Qué planeta tiene más lunas?",
        answers_es: ["Tierra", "Marte", "Júpiter", "Saturno"],
        question_de: "Welcher Planet hat die meisten Monde?",
        answers_de: ["Erde", "Mars", "Jupiter", "Saturn"]
    },
    // Level 9
    { 
        level: 9, 
        question: "Who developed the theory of relativity?", 
        answers: ["Newton", "Einstein", "Galileo", "Hawking"], 
        correctIndex: 1,
        question_es: "¿Quién desarrolló la teoría de la relatividad?",
        answers_es: ["Newton", "Einstein", "Galileo", "Hawking"],
        question_de: "Wer entwickelte die Relativitätstheorie?",
        answers_de: ["Newton", "Einstein", "Galileo", "Hawking"]
    },
    { 
        level: 9, 
        question: "What is the smallest country in the world?", 
        answers: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], 
        correctIndex: 1,
        question_es: "¿Cuál es el país más pequeño del mundo?",
        answers_es: ["Mónaco", "Ciudad del Vaticano", "San Marino", "Liechtenstein"],
        question_de: "Welches ist das kleinste Land der Welt?",
        answers_de: ["Monaco", "Vatikanstadt", "San Marino", "Liechtenstein"]
    },
    // Level 10
    { 
        level: 10, 
        question: "What is the capital of Australia?", 
        answers: ["Sydney", "Melbourne", "Canberra", "Perth"], 
        correctIndex: 2,
        question_es: "¿Cuál es la capital de Australia?",
        answers_es: ["Sídney", "Melbourne", "Canberra", "Perth"],
        question_de: "Was ist die Hauptstadt von Australien?",
        answers_de: ["Sydney", "Melbourne", "Canberra", "Perth"]
    },
    { 
        level: 10, 
        question: "Which gas is most abundant in the Earth's atmosphere?", 
        answers: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], 
        correctIndex: 2,
        question_es: "¿Qué gas es más abundante en la atmósfera de la Tierra?",
        answers_es: ["Oxígeno", "Dióxido de carbono", "Nitrógeno", "Hidrógeno"],
        question_de: "Welches Gas ist in der Erdatmosphäre am häufigsten vorhanden?",
        answers_de: ["Sauerstoff", "Kohlendioxid", "Stickstoff", "Wasserstoff"]
    },
    // Level 11
    { 
        level: 11, 
        question: "Who wrote '1984'?", 
        answers: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], 
        correctIndex: 1,
        question_es: "¿Quién escribió '1984'?",
        answers_es: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"],
        question_de: "Wer schrieb '1984'?",
        answers_de: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"]
    },
    { 
        level: 11, 
        question: "In which year did the Titanic sink?", 
        answers: ["1910", "1912", "1914", "1920"], 
        correctIndex: 1,
        question_es: "¿En qué año se hundió el Titanic?",
        answers_es: ["1910", "1912", "1914", "1920"],
        question_de: "In welchem Jahr sank die Titanic?",
        answers_de: ["1910", "1912", "1914", "1920"]
    },
    // Level 12
    { 
        level: 12, 
        question: "What is the longest river in the world?", 
        answers: ["Amazon", "Nile", "Yangtze", "Mississippi"], 
        correctIndex: 1,
        question_es: "¿Cuál es el río más largo del mundo?",
        answers_es: ["Amazonas", "Nilo", "Yangtsé", "Misisipi"],
        question_de: "Welches ist der längste Fluss der Welt?",
        answers_de: ["Amazonas", "Nil", "Jangtsekiang", "Mississippi"]
    },
    { 
        level: 12, 
        question: "Which organ has four chambers?", 
        answers: ["Liver", "Brain", "Heart", "Lungs"], 
        correctIndex: 2,
        question_es: "¿Qué órgano tiene cuatro cámaras?",
        answers_es: ["Hígado", "Cerebro", "Corazón", "Pulmones"],
        question_de: "Welches Organ hat vier Kammern?",
        answers_de: ["Leber", "Gehirn", "Herz", "Lungen"]
    },
    // Level 13
    { 
        level: 13, 
        question: "What represents 'K' in the periodic table?", 
        answers: ["Krypton", "Potassium", "Calcium", "Iron"], 
        correctIndex: 1,
        question_es: "¿Qué representa la 'K' en la tabla periódica?",
        answers_es: ["Kriptón", "Potasio", "Calcio", "Hierro"],
        question_de: "Was steht für 'K' im Periodensystem?",
        answers_de: ["Krypton", "Kalium", "Calcium", "Eisen"]
    },
    { 
        level: 13, 
        question: "Who was the first man in space?", 
        answers: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"], 
        correctIndex: 2,
        question_es: "¿Quién fue el primer hombre en el espacio?",
        answers_es: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"],
        question_de: "Wer war der erste Mensch im Weltraum?",
        answers_de: ["Neil Armstrong", "Buzz Aldrin", "Juri Gagarin", "John Glenn"]
    },
    // Level 14
    { 
        level: 14, 
        question: "What is the square root of 144?", 
        answers: ["10", "11", "12", "14"], 
        correctIndex: 2,
        question_es: "¿Cuál es la raíz cuadrada de 144?",
        answers_es: ["10", "11", "12", "14"],
        question_de: "Was ist die Quadratwurzel aus 144?",
        answers_de: ["10", "11", "12", "14"]
    },
    { 
        level: 14, 
        question: "In computer science, what does CPU stand for?", 
        answers: ["Central Processing Unit", "Central Process Utility", "Computer Personal Unit", "Control Processing Unit"], 
        correctIndex: 0,
        question_es: "En informática, ¿qué significa CPU?",
        answers_es: ["Unidad Central de Procesamiento", "Utilidad de Proceso Central", "Unidad Personal de Computadora", "Unidad de Procesamiento de Control"],
        question_de: "Wofür steht CPU in der Informatik?",
        answers_de: ["Central Processing Unit", "Central Process Utility", "Computer Personal Unit", "Control Processing Unit"]
    },
    // Level 15
    { 
        level: 15, 
        question: "What is the powerhouse of the cell?", 
        answers: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"], 
        correctIndex: 2,
        question_es: "¿Cuál es la central energética de la célula?",
        answers_es: ["Núcleo", "Ribosoma", "Mitocondria", "Citoplasma"],
        question_de: "Was ist das Kraftwerk der Zelle?",
        answers_de: ["Zellkern", "Ribosom", "Mitochondrium", "Zytoplasma"]
    },
    { 
        level: 15, 
        question: "Which year did the Berlin Wall fall?", 
        answers: ["1987", "1989", "1991", "1993"], 
        correctIndex: 1,
        question_es: "¿En qué año cayó el Muro de Berlín?",
        answers_es: ["1987", "1989", "1991", "1993"],
        question_de: "In welchem Jahr fiel die Berliner Mauer?",
        answers_de: ["1987", "1989", "1991", "1993"]
    },
];

const generateQuestions = (): QuizQuestion[] => {
    const fullSet: QuizQuestion[] = [];
    const targetPerLevel = 100;
    const totalLevels = 15;

    for (let level = 1; level <= totalLevels; level++) {
        const baseForLevel = BASE_QUESTIONS.filter(q => q.level === level);
        const pool = baseForLevel.length > 0 ? baseForLevel : BASE_QUESTIONS;

        for (let i = 0; i < targetPerLevel; i++) {
            const base = pool[i % pool.length];
            
            // Create duplicates instead of variations to avoid messy text
            fullSet.push({
                ...base,
                level: level,
                // Just copy the question to avoid "Variation X"
                question: base.question
            });
        }
    }
    return fullSet;
};

export const GENERAL_QUIZ_QUESTIONS = generateQuestions();
