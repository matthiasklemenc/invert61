
export interface QuizQuestion {
    question: string;
    answers: string[];
    correctIndex: number;
    level: number; // 1 to 15
    
    // Translations
    question_es?: string;
    answers_es?: string[];
    question_de?: string;
    answers_de?: string[];
}

const SKATE_BASE: QuizQuestion[] = [
    // --- LEVEL 1 ---
    { level: 1, question: "What is the wooden part of a skateboard called?", answers: ["The Plank", "The Deck", "The Beam", "The Hull"], correctIndex: 1, question_es: "¿Cómo se llama la parte de madera de un skateboard?", answers_es: ["La Tabla", "El Deck (Tabla)", "La Viga", "El Casco"], question_de: "Wie nennt man den hölzernen Teil eines Skateboards?", answers_de: ["Die Planke", "Das Deck", "Der Balken", "Der Rumpf"] },
    { level: 1, question: "How many wheels does a standard skateboard have?", answers: ["Two", "Four", "Six", "Eight"], correctIndex: 1, question_es: "¿Cuántas ruedas tiene un skateboard estándar?", answers_es: ["Dos", "Cuatro", "Seis", "Ocho"], question_de: "Wie viele Rollen hat ein Standard-Skateboard?", answers_de: ["Zwei", "Vier", "Sechs", "Acht"] },
    { level: 1, question: "What protects your head while skating?", answers: ["Beanie", "Cap", "Helmet", "Bandana"], correctIndex: 2, question_es: "¿Qué protege tu cabeza mientras patinas?", answers_es: ["Gorro", "Gorra", "Casco", "Pañuelo"], question_de: "Was schützt deinen Kopf beim Skaten?", answers_de: ["Mütze", "Kappe", "Helm", "Bandana"] },
    { level: 1, question: "Which foot is forward in 'Regular' stance?", answers: ["Left", "Right", "Both", "Neither"], correctIndex: 0, question_es: "¿Qué pie va adelante en la postura 'Regular'?", answers_es: ["Izquierdo", "Derecho", "Ambos", "Ninguno"], question_de: "Welcher Fuß ist bei 'Regular' vorne?", answers_de: ["Links", "Rechts", "Beide", "Keiner"] },
    
    // --- LEVEL 2 ---
    { level: 2, question: "Pushing with your front foot is called?", answers: ["Mongo", "Goofy", "Switch", "Regular"], correctIndex: 0, question_es: "¿Cómo se llama empujar con el pie delantero?", answers_es: ["Mongo", "Goofy", "Switch", "Regular"], question_de: "Wie nennt man das Pushen mit dem vorderen Fuß?", answers_de: ["Mongo", "Goofy", "Switch", "Regular"] },
    { level: 2, question: "What trick involves jumping with the board?", answers: ["Wheelie", "Ollie", "Hop", "Jump"], correctIndex: 1, question_es: "¿Qué truco implica saltar con la tabla?", answers_es: ["Wheelie", "Ollie", "Hop", "Jump"], question_de: "Welcher Trick beinhaltet das Springen mit dem Board?", answers_de: ["Wheelie", "Ollie", "Hop", "Jump"] },
    
    // --- LEVEL 3 ---
    { level: 3, question: "What prevents 'wheelbite'?", answers: ["Riser pads", "Larger wheels", "Looser trucks", "Wax"], correctIndex: 0, question_es: "¿Qué previene el 'wheelbite'?", answers_es: ["Riser pads (Elevadores)", "Ruedas más grandes", "Ejes más sueltos", "Cera"], question_de: "Was verhindert 'Wheelbite'?", answers_de: ["Riser Pads", "Größere Rollen", "Lockere Achsen", "Wachs"] },
    { level: 3, question: "Soft wheels are best for?", answers: ["Skateparks", "Filming/Cruising", "Powersliding", "Vert"], correctIndex: 1, question_es: "¿Para qué son mejores las ruedas blandas?", answers_es: ["Skateparks", "Filmar/Cruising", "Derrapes", "Vert"], question_de: "Wofür sind weiche Rollen am besten?", answers_de: ["Skateparks", "Filmen/Cruisen", "Powerslides", "Vert"] },

    // --- LEVEL 4 ---
    { level: 4, question: "Who is credited with inventing the kickflip?", answers: ["Rodney Mullen", "Tony Hawk", "Steve Caballero", "Mark Gonzales"], correctIndex: 0, question_es: "¿A quién se le atribuye la invención del kickflip?", answers_es: ["Rodney Mullen", "Tony Hawk", "Steve Caballero", "Mark Gonzales"], question_de: "Wem wird die Erfindung des Kickflips zugeschrieben?", answers_de: ["Rodney Mullen", "Tony Hawk", "Steve Caballero", "Mark Gonzales"] },
    { level: 4, question: "SOTY stands for?", answers: ["Skater of the Year", "Skate or the Yard", "Style of the Youth", "Stunt of the Year"], correctIndex: 0, question_es: "¿Qué significa SOTY?", answers_es: ["Skater of the Year (Patinador del Año)", "Skate or the Yard", "Style of the Youth", "Stunt of the Year"], question_de: "Wofür steht SOTY?", answers_de: ["Skater of the Year", "Skate or the Yard", "Style of the Youth", "Stunt of the Year"] },

    // --- LEVEL 5 ---
    { level: 5, question: "Board flips towards the toes?", answers: ["Heelflip", "Kickflip", "Varial Flip", "Hardflip"], correctIndex: 1, question_es: "¿La tabla gira hacia los dedos de los pies?", answers_es: ["Heelflip", "Kickflip", "Varial Flip", "Hardflip"], question_de: "Das Board dreht sich zu den Zehen?", answers_de: ["Heelflip", "Kickflip", "Varial Flip", "Hardflip"] },
    { level: 5, question: "Grind on the back truck, front lifted?", answers: ["5-0", "50-50", "Nosegrind", "Smith"], correctIndex: 0, question_es: "¿Grind en el eje trasero, frente levantado?", answers_es: ["5-0", "50-50", "Nosegrind", "Smith"], question_de: "Grind auf der Hinterachse, vorne angehoben?", answers_de: ["5-0", "50-50", "Nosegrind", "Smith"] },

    // --- LEVEL 6 ---
    { level: 6, question: "Logo featuring a screaming hand?", answers: ["Powell Peralta", "Santa Cruz", "Creature", "Toy Machine"], correctIndex: 1, question_es: "¿Logotipo con una mano gritando?", answers_es: ["Powell Peralta", "Santa Cruz", "Creature", "Toy Machine"], question_de: "Logo mit einer schreienden Hand?", answers_de: ["Powell Peralta", "Santa Cruz", "Creature", "Toy Machine"] },
    { level: 6, question: "Brand founded by Ed Templeton?", answers: ["Toy Machine", "Foundation", "RVCA", "Emerica"], correctIndex: 0, question_es: "¿Marca fundada por Ed Templeton?", answers_es: ["Toy Machine", "Foundation", "RVCA", "Emerica"], question_de: "Marke gegründet von Ed Templeton?", answers_de: ["Toy Machine", "Foundation", "RVCA", "Emerica"] },

    // --- LEVEL 7 ---
    { level: 7, question: "Famous 25-stair set in France?", answers: ["Macba", "Lyon 25", "El Toro", "Wallenberg"], correctIndex: 1, question_es: "¿Famoso conjunto de 25 escaleras en Francia?", answers_es: ["Macba", "Lyon 25", "El Toro", "Wallenberg"], question_de: "Berühmtes 25-Stufen-Set in Frankreich?", answers_de: ["Macba", "Lyon 25", "El Toro", "Wallenberg"] },
    { level: 7, question: "Street League Skateboarding (SLS) uses what scoring max?", answers: ["100", "10", "10.0 (formerly)", "50"], correctIndex: 2, question_es: "¿Qué puntuación máxima usa Street League Skateboarding (SLS)?", answers_es: ["100", "10", "10.0 (anteriormente)", "50"], question_de: "Welche Maximalpunktzahl verwendet die Street League Skateboarding (SLS)?", answers_de: ["100", "10", "10.0 (ehemals)", "50"] },

    // --- LEVEL 8 ---
    { level: 8, question: "Video: 'Yeah Right!' (2003) is by?", answers: ["Girl", "Chocolate", "Lakaii", "Flip"], correctIndex: 0, question_es: "¿El video 'Yeah Right!' (2003) es de?", answers_es: ["Girl", "Chocolate", "Lakaii", "Flip"], question_de: "Video: 'Yeah Right!' (2003) ist von?", answers_de: ["Girl", "Chocolate", "Lakaii", "Flip"] },
    { level: 8, question: "Who won SOTY in 2003?", answers: ["Mark Appleyard", "Daewon Song", "Marc Johnson", "Chris Cole"], correctIndex: 0, question_es: "¿Quién ganó el SOTY en 2003?", answers_es: ["Mark Appleyard", "Daewon Song", "Marc Johnson", "Chris Cole"], question_de: "Wer gewann SOTY im Jahr 2003?", answers_de: ["Mark Appleyard", "Daewon Song", "Marc Johnson", "Chris Cole"] },

    // --- LEVEL 9 ---
    { level: 9, question: "Jamie Thomas nickname?", answers: ["The King", "The Chief", "The Boss", "The General"], correctIndex: 1, question_es: "¿Apodo de Jamie Thomas?", answers_es: ["The King", "The Chief", "The Boss", "The General"], question_de: "Spitzname von Jamie Thomas?", answers_de: ["The King", "The Chief", "The Boss", "The General"] },
    { level: 9, question: "Who invented the crooked grind?", answers: ["Eric Koston", "Dan Peterka", "Ricky Oyola", "Disputed (Koston/Oyola)"], correctIndex: 3, question_es: "¿Quién inventó el crooked grind?", answers_es: ["Eric Koston", "Dan Peterka", "Ricky Oyola", "Disputado (Koston/Oyola)"], question_de: "Wer hat den Crooked Grind erfunden?", answers_de: ["Eric Koston", "Dan Peterka", "Ricky Oyola", "Umstritten (Koston/Oyola)"] },

    // --- LEVEL 10 ---
    { level: 10, question: "Who invented the McTwist?", answers: ["Tony Hawk", "Mike McGill", "Steve Caballero", "Lance Mountain"], correctIndex: 1, question_es: "¿Quién inventó el McTwist?", answers_es: ["Tony Hawk", "Mike McGill", "Steve Caballero", "Lance Mountain"], question_de: "Wer hat den McTwist erfunden?", answers_de: ["Tony Hawk", "Mike McGill", "Steve Caballero", "Lance Mountain"] },
    { level: 10, question: "The Fakie 360 is also known as?", answers: ["Caballerial", "Gazelle", "Bigspin", "Helipop"], correctIndex: 0, question_es: "¿El Fakie 360 también se conoce como?", answers_es: ["Caballerial", "Gazelle", "Bigspin", "Helipop"], question_de: "Der Fakie 360 ist auch bekannt als?", answers_de: ["Caballerial", "Gazelle", "Bigspin", "Helipop"] },

    // --- LEVEL 11 ---
    { level: 11, question: "What is a 'Gazelle Flip'?", answers: ["360 Flip", "Bigspin 360 Kickflip", "Varial double flip", "Laser flip 180"], correctIndex: 1, question_es: "¿Qué es un 'Gazelle Flip'?", answers_es: ["360 Flip", "Bigspin 360 Kickflip", "Varial double flip", "Laser flip 180"], question_de: "Was ist ein 'Gazelle Flip'?", answers_de: ["360 Flip", "Bigspin 360 Kickflip", "Varial double flip", "Laser flip 180"] },
    { level: 11, question: "Who invented the Darkslide?", answers: ["Tony Hawk", "Rodney Mullen", "Natas Kaupas", "Mark Gonzales"], correctIndex: 1, question_es: "¿Quién inventó el Darkslide?", answers_es: ["Tony Hawk", "Rodney Mullen", "Natas Kaupas", "Mark Gonzales"], question_de: "Wer hat den Darkslide erfunden?", answers_de: ["Tony Hawk", "Rodney Mullen", "Natas Kaupas", "Mark Gonzales"] },

    // --- LEVEL 12 ---
    { level: 12, question: "Founder of World Industries?", answers: ["Rodney Mullen", "Steve Rocco", "Mike Vallely", "Spike Jonze"], correctIndex: 1, question_es: "¿Fundador de World Industries?", answers_es: ["Rodney Mullen", "Steve Rocco", "Mike Vallely", "Spike Jonze"], question_de: "Gründer von World Industries?", answers_de: ["Rodney Mullen", "Steve Rocco", "Mike Vallely", "Spike Jonze"] },
    { level: 12, question: "Who owns Baker Boys Distribution?", answers: ["Andrew Reynolds", "Erik Ellington", "Jim Greco", "All of the above"], correctIndex: 3, question_es: "¿Quién es dueño de Baker Boys Distribution?", answers_es: ["Andrew Reynolds", "Erik Ellington", "Jim Greco", "Todos los anteriores"], question_de: "Wem gehört Baker Boys Distribution?", answers_de: ["Andrew Reynolds", "Erik Ellington", "Jim Greco", "Alle oben genannten"] },

    // --- LEVEL 13 ---
    { level: 13, question: "Highest Ollie official record holder?", answers: ["Danny Way", "Aldrin Garcia", "Reese Forbes", "Xavier Alford"], correctIndex: 1, question_es: "¿Poseedor del récord oficial de Ollie más alto?", answers_es: ["Danny Way", "Aldrin Garcia", "Reese Forbes", "Xavier Alford"], question_de: "Offizieller Rekordhalter für den höchsten Ollie?", answers_de: ["Danny Way", "Aldrin Garcia", "Reese Forbes", "Xavier Alford"] },
    { level: 13, question: "Who ollied the Great Wall of China?", answers: ["Bob Burnquist", "Danny Way", "Tony Hawk", "Rob Dyrdek"], correctIndex: 1, question_es: "¿Quién saltó la Gran Muralla China con un Ollie?", answers_es: ["Bob Burnquist", "Danny Way", "Tony Hawk", "Rob Dyrdek"], question_de: "Wer hat einen Ollie über die Chinesische Mauer gemacht?", answers_de: ["Bob Burnquist", "Danny Way", "Tony Hawk", "Rob Dyrdek"] },

    // --- LEVEL 14 ---
    { level: 14, question: "Who directed 'Mind Field'?", answers: ["Spike Jonze", "Greg Hunt", "Ty Evans", "French Fred"], correctIndex: 1, question_es: "¿Quién dirigió 'Mind Field'?", answers_es: ["Spike Jonze", "Greg Hunt", "Ty Evans", "French Fred"], question_de: "Wer führte Regie bei 'Mind Field'?", answers_de: ["Spike Jonze", "Greg Hunt", "Ty Evans", "French Fred"] },
    { level: 14, question: "Song in Jerry Hsu's 'Bag of Suck' part?", answers: ["Just Like Honey", "Build Me Up Buttercup", "Where is my Mind", "Maps"], correctIndex: 0, question_es: "¿Canción en la parte de Jerry Hsu en 'Bag of Suck'?", answers_es: ["Just Like Honey", "Build Me Up Buttercup", "Where is my Mind", "Maps"], question_de: "Song in Jerry Hsus 'Bag of Suck' Part?", answers_de: ["Just Like Honey", "Build Me Up Buttercup", "Where is my Mind", "Maps"] },

    // --- LEVEL 15 ---
    { level: 15, question: "Rodney Mullen's autobiography title?", answers: ["The Mutt", "The Hawk", "Street King", "Flatground"], correctIndex: 0, question_es: "¿Título de la autobiografía de Rodney Mullen?", answers_es: ["The Mutt", "The Hawk", "Street King", "Flatground"], question_de: "Titel von Rodney Mullens Autobiografie?", answers_de: ["The Mutt", "The Hawk", "Street King", "Flatground"] },
    { level: 15, question: "Who is 'The Gonz'?", answers: ["Mark Gonzales", "Gonzalo Rodriguez", "Steve Gonzalez", "Mike Gonzales"], correctIndex: 0, question_es: "¿Quién es 'The Gonz'?", answers_es: ["Mark Gonzales", "Gonzalo Rodriguez", "Steve Gonzalez", "Mike Gonzales"], question_de: "Wer ist 'The Gonz'?", answers_de: ["Mark Gonzales", "Gonzalo Rodriguez", "Steve Gonzalez", "Mike Gonzales"] },
];

const generateSkateQuestions = (): QuizQuestion[] => {
    const fullSet: QuizQuestion[] = [];
    const targetPerLevel = 100; 
    const totalLevels = 15;

    for (let level = 1; level <= totalLevels; level++) {
        const baseForLevel = SKATE_BASE.filter(q => q.level === level);
        const pool = baseForLevel.length > 0 ? baseForLevel : SKATE_BASE; // Fallback to mixed if level empty

        for (let i = 0; i < targetPerLevel; i++) {
            const base = pool[i % pool.length];
            
            fullSet.push({
                ...base,
                level: level,
                question: base.question,
                question_es: base.question_es,
                answers_es: base.answers_es,
                question_de: base.question_de,
                answers_de: base.answers_de
            });
        }
    }
    return fullSet;
};

export const SKATE_QUIZ_QUESTIONS = generateSkateQuestions();
