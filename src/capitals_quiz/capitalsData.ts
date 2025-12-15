
export interface LocalizedString {
    en: string;
    es: string;
    de: string;
}

export interface CountryEntry {
    country: LocalizedString;
    capital: LocalizedString;
    level: number; // 1 to 15
}

export interface QuizQuestion {
    question: LocalizedString; // Template string
    countryName: LocalizedString; 
    answers: LocalizedString[]; // 4 capital cities
    correctIndex: number;
    level: number;
}

export const CAPITALS_PRIZES = [
    "Tourist", "Backpacker", "Traveler", "Voyager", "Explorer",
    "Navigator", "Nomad", "Cartographer", "Diplomat", "Ambassador",
    "Minister", "President", "Emperor", "Global Citizen", "THE MILLION"
];

const RAW_COUNTRIES: CountryEntry[] = [
    // --- LEVEL 1 (Very Easy) ---
    { level: 1, country: { en: "France", es: "Francia", de: "Frankreich" }, capital: { en: "Paris", es: "París", de: "Paris" } },
    { level: 1, country: { en: "USA", es: "EE. UU.", de: "USA" }, capital: { en: "Washington D.C.", es: "Washington D.C.", de: "Washington D.C." } },
    { level: 1, country: { en: "United Kingdom", es: "Reino Unido", de: "Vereinigtes Königreich" }, capital: { en: "London", es: "Londres", de: "London" } },
    { level: 1, country: { en: "Germany", es: "Alemania", de: "Deutschland" }, capital: { en: "Berlin", es: "Berlín", de: "Berlin" } },
    { level: 1, country: { en: "Italy", es: "Italia", de: "Italien" }, capital: { en: "Rome", es: "Roma", de: "Rom" } },
    { level: 1, country: { en: "Spain", es: "España", de: "Spanien" }, capital: { en: "Madrid", es: "Madrid", de: "Madrid" } },
    { level: 1, country: { en: "Japan", es: "Japón", de: "Japan" }, capital: { en: "Tokyo", es: "Tokio", de: "Tokio" } },

    // --- LEVEL 2 (Easy) ---
    { level: 2, country: { en: "China", es: "China", de: "China" }, capital: { en: "Beijing", es: "Pekín", de: "Peking" } },
    { level: 2, country: { en: "Russia", es: "Rusia", de: "Russland" }, capital: { en: "Moscow", es: "Moscú", de: "Moskau" } },
    { level: 2, country: { en: "Egypt", es: "Egipto", de: "Ägypten" }, capital: { en: "Cairo", es: "El Cairo", de: "Kairo" } },
    { level: 2, country: { en: "Brazil", es: "Brasil", de: "Brasilien" }, capital: { en: "Brasília", es: "Brasilia", de: "Brasília" } },
    { level: 2, country: { en: "Argentina", es: "Argentina", de: "Argentinien" }, capital: { en: "Buenos Aires", es: "Buenos Aires", de: "Buenos Aires" } },
    { level: 2, country: { en: "Mexico", es: "México", de: "Mexiko" }, capital: { en: "Mexico City", es: "Ciudad de México", de: "Mexiko-Stadt" } },

    // --- LEVEL 3 (Common) ---
    { level: 3, country: { en: "Canada", es: "Canadá", de: "Kanada" }, capital: { en: "Ottawa", es: "Ottawa", de: "Ottawa" } },
    { level: 3, country: { en: "Australia", es: "Australia", de: "Australien" }, capital: { en: "Canberra", es: "Camberra", de: "Canberra" } },
    { level: 3, country: { en: "India", es: "India", de: "Indien" }, capital: { en: "New Delhi", es: "Nueva Delhi", de: "Neu-Delhi" } },
    { level: 3, country: { en: "Greece", es: "Grecia", de: "Griechenland" }, capital: { en: "Athens", es: "Atenas", de: "Athen" } },
    { level: 3, country: { en: "Netherlands", es: "Países Bajos", de: "Niederlande" }, capital: { en: "Amsterdam", es: "Ámsterdam", de: "Amsterdam" } },
    { level: 3, country: { en: "Portugal", es: "Portugal", de: "Portugal" }, capital: { en: "Lisbon", es: "Lisboa", de: "Lissabon" } },

    // --- LEVEL 4 (Europe/Asia Basics) ---
    { level: 4, country: { en: "Sweden", es: "Suecia", de: "Schweden" }, capital: { en: "Stockholm", es: "Estocolmo", de: "Stockholm" } },
    { level: 4, country: { en: "Norway", es: "Noruega", de: "Norwegen" }, capital: { en: "Oslo", es: "Oslo", de: "Oslo" } },
    { level: 4, country: { en: "Turkey", es: "Turquía", de: "Türkei" }, capital: { en: "Ankara", es: "Ankara", de: "Ankara" } },
    { level: 4, country: { en: "South Korea", es: "Corea del Sur", de: "Südkorea" }, capital: { en: "Seoul", es: "Seúl", de: "Seoul" } },
    { level: 4, country: { en: "Thailand", es: "Tailandia", de: "Thailand" }, capital: { en: "Bangkok", es: "Bangkok", de: "Bangkok" } },
    { level: 4, country: { en: "Austria", es: "Austria", de: "Österreich" }, capital: { en: "Vienna", es: "Viena", de: "Wien" } },

    // --- LEVEL 5 (Americas/Africa Basics) ---
    { level: 5, country: { en: "Colombia", es: "Colombia", de: "Kolumbien" }, capital: { en: "Bogotá", es: "Bogotá", de: "Bogotá" } },
    { level: 5, country: { en: "Peru", es: "Perú", de: "Peru" }, capital: { en: "Lima", es: "Lima", de: "Lima" } },
    { level: 5, country: { en: "South Africa", es: "Sudáfrica", de: "Südafrika" }, capital: { en: "Pretoria", es: "Pretoria", de: "Pretoria" } },
    { level: 5, country: { en: "Kenya", es: "Kenia", de: "Kenia" }, capital: { en: "Nairobi", es: "Nairobi", de: "Nairobi" } },
    { level: 5, country: { en: "Morocco", es: "Marruecos", de: "Marokko" }, capital: { en: "Rabat", es: "Rabat", de: "Rabat" } },
    { level: 5, country: { en: "Chile", es: "Chile", de: "Chile" }, capital: { en: "Santiago", es: "Santiago", de: "Santiago" } },

    // --- LEVEL 6 (Intermediate) ---
    { level: 6, country: { en: "Poland", es: "Polonia", de: "Polen" }, capital: { en: "Warsaw", es: "Varsovia", de: "Warschau" } },
    { level: 6, country: { en: "Ukraine", es: "Ucrania", de: "Ukraine" }, capital: { en: "Kyiv", es: "Kiev", de: "Kiew" } },
    { level: 6, country: { en: "Vietnam", es: "Vietnam", de: "Vietnam" }, capital: { en: "Hanoi", es: "Hanói", de: "Hanoi" } },
    { level: 6, country: { en: "Iran", es: "Irán", de: "Iran" }, capital: { en: "Tehran", es: "Teherán", de: "Teheran" } },
    { level: 6, country: { en: "Iraq", es: "Irak", de: "Irak" }, capital: { en: "Baghdad", es: "Bagdad", de: "Bagdad" } },
    { level: 6, country: { en: "Saudi Arabia", es: "Arabia Saudita", de: "Saudi-Arabien" }, capital: { en: "Riyadh", es: "Riad", de: "Riad" } },

    // --- LEVEL 7 (Intermediate II) ---
    { level: 7, country: { en: "New Zealand", es: "Nueva Zelanda", de: "Neuseeland" }, capital: { en: "Wellington", es: "Wellington", de: "Wellington" } },
    { level: 7, country: { en: "Finland", es: "Finlandia", de: "Finnland" }, capital: { en: "Helsinki", es: "Helsinki", de: "Helsinki" } },
    { level: 7, country: { en: "Pakistan", es: "Pakistán", de: "Pakistan" }, capital: { en: "Islamabad", es: "Islamabad", de: "Islamabad" } },
    { level: 7, country: { en: "Nigeria", es: "Nigeria", de: "Nigeria" }, capital: { en: "Abuja", es: "Abuya", de: "Abuja" } },
    { level: 7, country: { en: "Philippines", es: "Filipinas", de: "Philippinen" }, capital: { en: "Manila", es: "Manila", de: "Manila" } },
    { level: 7, country: { en: "Hungary", es: "Hungría", de: "Ungarn" }, capital: { en: "Budapest", es: "Budapest", de: "Budapest" } },

    // --- LEVEL 8 (Tricky) ---
    { level: 8, country: { en: "Switzerland", es: "Suiza", de: "Schweiz" }, capital: { en: "Bern", es: "Berna", de: "Bern" } },
    { level: 8, country: { en: "Romania", es: "Rumania", de: "Rumänien" }, capital: { en: "Bucharest", es: "Bucarest", de: "Bukarest" } },
    { level: 8, country: { en: "Cuba", es: "Cuba", de: "Kuba" }, capital: { en: "Havana", es: "La Habana", de: "Havanna" } },
    { level: 8, country: { en: "Venezuela", es: "Venezuela", de: "Venezuela" }, capital: { en: "Caracas", es: "Caracas", de: "Caracas" } },
    { level: 8, country: { en: "Ethiopia", es: "Etiopía", de: "Äthiopien" }, capital: { en: "Addis Ababa", es: "Adís Abeba", de: "Addis Abeba" } },
    { level: 8, country: { en: "Jamaica", es: "Jamaica", de: "Jamaika" }, capital: { en: "Kingston", es: "Kingston", de: "Kingston" } },

    // --- LEVEL 9 (Tricky II) ---
    { level: 9, country: { en: "Senegal", es: "Senegal", de: "Senegal" }, capital: { en: "Dakar", es: "Dakar", de: "Dakar" } },
    { level: 9, country: { en: "Iceland", es: "Islandia", de: "Island" }, capital: { en: "Reykjavik", es: "Reikiavik", de: "Reykjavik" } },
    { level: 9, country: { en: "Lebanon", es: "Líbano", de: "Libanon" }, capital: { en: "Beirut", es: "Beirut", de: "Beirut" } },
    { level: 9, country: { en: "Uruguay", es: "Uruguay", de: "Uruguay" }, capital: { en: "Montevideo", es: "Montevideo", de: "Montevideo" } },
    { level: 9, country: { en: "Bulgaria", es: "Bulgaria", de: "Bulgarien" }, capital: { en: "Sofia", es: "Sofía", de: "Sofia" } },

    // --- LEVEL 10 (Hard) ---
    { level: 10, country: { en: "Mongolia", es: "Mongolia", de: "Mongolei" }, capital: { en: "Ulaanbaatar", es: "Ulán Bator", de: "Ulaanbaatar" } },
    { level: 10, country: { en: "Kazakhstan", es: "Kazajistán", de: "Kasachstan" }, capital: { en: "Astana", es: "Astaná", de: "Astana" } },
    { level: 10, country: { en: "Slovakia", es: "Eslovaquia", de: "Slowakei" }, capital: { en: "Bratislava", es: "Bratislava", de: "Bratislava" } },
    { level: 10, country: { en: "Ecuador", es: "Ecuador", de: "Ecuador" }, capital: { en: "Quito", es: "Quito", de: "Quito" } },
    { level: 10, country: { en: "Madagascar", es: "Madagascar", de: "Madagaskar" }, capital: { en: "Antananarivo", es: "Antananarivo", de: "Antananarivo" } },

    // --- LEVEL 11 (Hard II) ---
    { level: 11, country: { en: "Uzbekistan", es: "Uzbekistán", de: "Usbekistan" }, capital: { en: "Tashkent", es: "Taskent", de: "Taschkent" } },
    { level: 11, country: { en: "Lithuania", es: "Lituania", de: "Litauen" }, capital: { en: "Vilnius", es: "Vilna", de: "Vilnius" } },
    { level: 11, country: { en: "Jordan", es: "Jordania", de: "Jordanien" }, capital: { en: "Amman", es: "Amán", de: "Amman" } },
    { level: 11, country: { en: "Ghana", es: "Ghana", de: "Ghana" }, capital: { en: "Accra", es: "Accra", de: "Accra" } },
    { level: 11, country: { en: "Bolivia", es: "Bolivia", de: "Bolivien" }, capital: { en: "Sucre", es: "Sucre", de: "Sucre" } },

    // --- LEVEL 12 (Expert) ---
    { level: 12, country: { en: "Azerbaijan", es: "Azerbaiyán", de: "Aserbaidschan" }, capital: { en: "Baku", es: "Bakú", de: "Baku" } },
    { level: 12, country: { en: "Oman", es: "Omán", de: "Oman" }, capital: { en: "Muscat", es: "Mascate", de: "Maskat" } },
    { level: 12, country: { en: "Ivory Coast", es: "Costa de Marfil", de: "Elfenbeinküste" }, capital: { en: "Yamoussoukro", es: "Yamusukro", de: "Yamoussoukro" } },
    { level: 12, country: { en: "Slovenia", es: "Eslovenia", de: "Slowenien" }, capital: { en: "Ljubljana", es: "Liubliana", de: "Ljubljana" } },
    { level: 12, country: { en: "Laos", es: "Laos", de: "Laos" }, capital: { en: "Vientiane", es: "Vientián", de: "Vientiane" } },

    // --- LEVEL 13 (Expert II) ---
    { level: 13, country: { en: "Burkina Faso", es: "Burkina Faso", de: "Burkina Faso" }, capital: { en: "Ouagadougou", es: "Uagadugú", de: "Ouagadougou" } },
    { level: 13, country: { en: "Kyrgyzstan", es: "Kirguistán", de: "Kirgisistan" }, capital: { en: "Bishkek", es: "Biskek", de: "Bischkek" } },
    { level: 13, country: { en: "Suriname", es: "Surinam", de: "Suriname" }, capital: { en: "Paramaribo", es: "Paramaribo", de: "Paramaribo" } },
    { level: 13, country: { en: "Liechtenstein", es: "Liechtenstein", de: "Liechtenstein" }, capital: { en: "Vaduz", es: "Vaduz", de: "Vaduz" } },
    { level: 13, country: { en: "Malta", es: "Malta", de: "Malta" }, capital: { en: "Valletta", es: "La Valeta", de: "Valletta" } },

    // --- LEVEL 14 (Master) ---
    { level: 14, country: { en: "Bhutan", es: "Bután", de: "Bhutan" }, capital: { en: "Thimphu", es: "Timbu", de: "Thimphu" } },
    { level: 14, country: { en: "Vanuatu", es: "Vanuatu", de: "Vanuatu" }, capital: { en: "Port Vila", es: "Port Vila", de: "Port Vila" } },
    { level: 14, country: { en: "Seychelles", es: "Seychelles", de: "Seychellen" }, capital: { en: "Victoria", es: "Victoria", de: "Victoria" } },
    { level: 14, country: { en: "Tajikistan", es: "Tayikistán", de: "Tadschikistan" }, capital: { en: "Dushanbe", es: "Dusambé", de: "Duschanbe" } },
    { level: 14, country: { en: "Djibouti", es: "Yibuti", de: "Dschibuti" }, capital: { en: "Djibouti City", es: "Yibuti", de: "Dschibuti-Stadt" } },

    // --- LEVEL 15 (World Ruler - Obscure) ---
    { level: 15, country: { en: "Nauru", es: "Nauru", de: "Nauru" }, capital: { en: "Yaren (de facto)", es: "Yaren", de: "Yaren" } },
    { level: 15, country: { en: "Palau", es: "Palaos", de: "Palau" }, capital: { en: "Ngerulmud", es: "Ngerulmud", de: "Ngerulmud" } },
    { level: 15, country: { en: "Comoros", es: "Comoras", de: "Komoren" }, capital: { en: "Moroni", es: "Moroni", de: "Moroni" } },
    { level: 15, country: { en: "Tuvalu", es: "Tuvalu", de: "Tuvalu" }, capital: { en: "Funafuti", es: "Funafuti", de: "Funafuti" } },
    { level: 15, country: { en: "Saint Kitts and Nevis", es: "San Cristóbal y Nieves", de: "St. Kitts und Nevis" }, capital: { en: "Basseterre", es: "Basseterre", de: "Basseterre" } },
];

const getRandomCapitals = (count: number, excludeCapitalEn: string): CountryEntry[] => {
    const shuffled = [...RAW_COUNTRIES].sort(() => 0.5 - Math.random());
    return shuffled.filter(c => c.capital.en !== excludeCapitalEn).slice(0, count);
};

const generateQuestions = (): QuizQuestion[] => {
    // We want to generate questions for every country in the RAW list.
    // We categorize them by their assigned level.
    const fullSet: QuizQuestion[] = [];
    
    for (const entry of RAW_COUNTRIES) {
        const distractors = getRandomCapitals(3, entry.capital.en);
        
        // Randomize answer position
        const answerPool = [entry, ...distractors];
        // Shuffle
        for (let i = answerPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answerPool[i], answerPool[j]] = [answerPool[j], answerPool[i]];
        }
        
        const correctIndex = answerPool.findIndex(a => a.capital.en === entry.capital.en);
        
        fullSet.push({
            level: entry.level,
            question: {
                en: "What is the capital of {country}?",
                es: "¿Cuál es la capital de {country}?",
                de: "Was ist die Hauptstadt von {country}?"
            },
            countryName: entry.country,
            answers: answerPool.map(a => a.capital),
            correctIndex: correctIndex
        });
    }
    
    return fullSet;
};

export const CAPITALS_QUIZ_QUESTIONS = generateQuestions();
