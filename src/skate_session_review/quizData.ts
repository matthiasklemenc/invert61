
export interface QuizQuestion {
    question: string;
    answers: string[];
    correctIndex: number;
    level: number; // 1 to 15
}

export const SKATE_QUIZ_QUESTIONS: QuizQuestion[] = [
    // --- LEVEL 1 (Newbie) ---
    { level: 1, question: "What is the wooden part of a skateboard called?", answers: ["The Plank", "The Deck", "The Beam", "The Hull"], correctIndex: 1 },
    { level: 1, question: "How many wheels does a standard skateboard have?", answers: ["Two", "Four", "Six", "Eight"], correctIndex: 1 },
    { level: 1, question: "What do you stand on to grip the board?", answers: ["Sandpaper", "Griptape", "Sticky mat", "Glue"], correctIndex: 1 },
    { level: 1, question: "Which piece of hardware turns the skateboard?", answers: ["Trucks", "Axles", "Hinges", "Joints"], correctIndex: 0 },
    { level: 1, question: "What protects your head while skating?", answers: ["Beanie", "Cap", "Helmet", "Bandana"], correctIndex: 2 },
    { level: 1, question: "The front of the skateboard is called the?", answers: ["Head", "Bow", "Nose", "Front"], correctIndex: 2 },
    { level: 1, question: "The back of the skateboard is called the?", answers: ["Butt", "Stern", "End", "Tail"], correctIndex: 3 },
    { level: 1, question: "What holds the wheels to the trucks?", answers: ["Nails", "Axle Nuts", "Glue", "Tape"], correctIndex: 1 },
    { level: 1, question: "Which foot is forward in 'Regular' stance?", answers: ["Left", "Right", "Both", "Neither"], correctIndex: 0 },
    { level: 1, question: "Which foot is forward in 'Goofy' stance?", answers: ["Left", "Right", "Both", "Neither"], correctIndex: 1 },

    // --- LEVEL 2 (Pusher) ---
    { level: 2, question: "Pushing with your front foot is called?", answers: ["Mongo", "Goofy", "Switch", "Regular"], correctIndex: 0 },
    { level: 2, question: "What material are modern wheels mostly made of?", answers: ["Rubber", "Polyurethane", "Plastic", "Wood"], correctIndex: 1 },
    { level: 2, question: "Which brand uses a 'Swoosh' logo?", answers: ["Adidas", "Vans", "Nike SB", "DC"], correctIndex: 2 },
    { level: 2, question: "What trick involves jumping with the board?", answers: ["Wheelie", "Ollie", "Hop", "Jump"], correctIndex: 1 },
    { level: 2, question: "Who is known as 'The Birdman'?", answers: ["Rodney Mullen", "Bam Margera", "Tony Hawk", "Ryan Sheckler"], correctIndex: 2 },
    { level: 2, question: "Sliding on a rail with the board is called a?", answers: ["Grind", "Slide", "Glide", "Skid"], correctIndex: 1 },
    { level: 2, question: "Turning 180 degrees on the back wheels is a?", answers: ["Kickturn", "Pivot", "Spin", "Twist"], correctIndex: 0 },
    { level: 2, question: "Riding backwards is known as?", answers: ["Reverse", "Switch", "Fakie", "Backsies"], correctIndex: 2 },
    { level: 2, question: "A skatepark structure shaped like a U?", answers: ["Pipe", "Half-pipe", "Bowl", "Dish"], correctIndex: 1 },
    { level: 2, question: "Standard bearing rating system?", answers: ["NASA", "ISO", "ABEC", "ANSI"], correctIndex: 2 },

    // --- LEVEL 3 (Local) ---
    { level: 3, question: "Which brand's slogan is 'Off The Wall'?", answers: ["Element", "Vans", "Volcom", "Thrasher"], correctIndex: 1 },
    { level: 3, question: "What prevents 'wheelbite'?", answers: ["Riser pads", "Larger wheels", "Looser trucks", "Wax"], correctIndex: 0 },
    { level: 3, question: "The metal rod inside the truck hanger?", answers: ["Kingpin", "Axle", "Bushings", "Pivot Cup"], correctIndex: 1 },
    { level: 3, question: "How many layers (plies) are in a standard deck?", answers: ["5", "7", "9", "3"], correctIndex: 1 },
    { level: 3, question: "A board with a shape other than the standard popsicle?", answers: ["Cruiser", "Longboard", "Shaped deck", "Old school"], correctIndex: 2 },
    { level: 3, question: "Soft wheels are best for?", answers: ["Skateparks", "Filming/Cruising", "Powersliding", "Vert"], correctIndex: 1 },
    { level: 3, question: "Hard wheels are best for?", answers: ["Street/Park", "Rough ground", "Cruising", "Downhill"], correctIndex: 0 },
    { level: 3, question: "The curve across the width of the deck?", answers: ["Camber", "Rocker", "Concave", "Arch"], correctIndex: 2 },
    { level: 3, question: "A trick where you grab the board in the air?", answers: ["Flip", "Grab", "Grind", "Manual"], correctIndex: 1 },
    { level: 3, question: "Famous skateboard magazine aka 'The Bible'?", answers: ["Transworld", "Thrasher", "Slap", "Skateboarder"], correctIndex: 1 },

    // --- LEVEL 4 (Grommet) ---
    { level: 4, question: "Who is credited with inventing the kickflip?", answers: ["Rodney Mullen", "Tony Hawk", "Steve Caballero", "Mark Gonzales"], correctIndex: 0 },
    { level: 4, question: "Major international extreme sports event?", answers: ["Olympics", "X Games", "World Cup", "Super Bowl"], correctIndex: 1 },
    { level: 4, question: "Video game franchise launched in 1999?", answers: ["Skate", "Thrasher: Skate and Destroy", "Tony Hawk's Pro Skater", "Grind Session"], correctIndex: 2 },
    { level: 4, question: "Bam Margera was part of which crew?", answers: ["Jackass/CKY", "Big Brother", "Wildboyz", "Nitro Circus"], correctIndex: 0 },
    { level: 4, question: "Rob Dyrdek's reality show factory?", answers: ["Dream Factory", "Fantasy Factory", "Skate Factory", "Fun Factory"], correctIndex: 1 },
    { level: 4, question: "Ryan Sheckler's MTV show?", answers: ["Life of Ryan", "Sheckler's World", "Ryan's Life", "Skate Life"], correctIndex: 0 },
    { level: 4, question: "Nyjah Huston's stance?", answers: ["Regular", "Goofy", "Mongo", "Switch"], correctIndex: 1 },
    { level: 4, question: "The '900' is how many rotations?", answers: ["1.5", "2", "2.5", "3"], correctIndex: 2 },
    { level: 4, question: "SOTY stands for?", answers: ["Skater of the Year", "Skate or the Yard", "Style of the Youth", "Stunt of the Year"], correctIndex: 0 },
    { level: 4, question: "A manual on the front wheels?", answers: ["Manual", "Nose Manual", "Hang ten", "Wheelie"], correctIndex: 1 },

    // --- LEVEL 5 (Amateur) ---
    { level: 5, question: "Board flips towards the toes?", answers: ["Heelflip", "Kickflip", "Varial Flip", "Hardflip"], correctIndex: 1 },
    { level: 5, question: "Board flips away from the toes?", answers: ["Heelflip", "Kickflip", "Varial Flip", "Hardflip"], correctIndex: 0 },
    { level: 5, question: "Board spins 180 without flipping?", answers: ["Bigspin", "Shove-it", "Varial", "Gazelle"], correctIndex: 1 },
    { level: 5, question: "Grind on the back truck, front lifted?", answers: ["5-0", "50-50", "Nosegrind", "Smith"], correctIndex: 0 },
    { level: 5, question: "Grind on both trucks?", answers: ["5-0", "50-50", "Boardsslide", "Feeble"], correctIndex: 1 },
    { level: 5, question: "Back truck grind, front truck dipped over rail?", answers: ["Smith", "Feeble", "Crooked", "Willys"], correctIndex: 1 },
    { level: 5, question: "Front truck grind, straight?", answers: ["Nosegrind", "Crooked", "Suski", "Salad"], correctIndex: 0 },
    { level: 5, question: "Front truck grind, crooked?", answers: ["Nosegrind", "Crooked Grind", "Overcrook", "Smith"], correctIndex: 1 },
    { level: 5, question: "Trick: Backside Shove-it + Kickflip?", answers: ["Hardflip", "Varial Kickflip", "Tre Flip", "Inward Heelflip"], correctIndex: 1 },
    { level: 5, question: "Trick: Frontside Shove-it + Kickflip?", answers: ["Hardflip", "Varial Heelflip", "Tre Flip", "Inward Heelflip"], correctIndex: 0 },

    // --- LEVEL 6 (Flow) ---
    { level: 6, question: "Logo featuring a screaming hand?", answers: ["Powell Peralta", "Santa Cruz", "Creature", "Toy Machine"], correctIndex: 1 },
    { level: 6, question: "Logo featuring a fireball head?", answers: ["Spitfire", "Ricta", "Bones", "OJ"], correctIndex: 0 },
    { level: 6, question: "Logo featuring a restroom sign symbol?", answers: ["Chocolate", "Girl", "Enjoi", "Blind"], correctIndex: 1 },
    { level: 6, question: "Logo featuring a panda?", answers: ["World Industries", "Enjoi", "Almost", "Cliché"], correctIndex: 1 },
    { level: 6, question: "Logo featuring a stylized tree?", answers: ["Plan B", "Element", "Habitat", "Alien Workshop"], correctIndex: 1 },
    { level: 6, question: "Logo featuring a rabbit head?", answers: ["Hook-Ups", "Playboy", "Psycho Stick", "Flip"], correctIndex: 0 },
    { level: 6, question: "Logo featuring a stylized cross?", answers: ["Independent", "Thunder", "Venture", "Ace"], correctIndex: 0 },
    { level: 6, question: "Brand known for the 'Ripper' skull?", answers: ["Zero", "Powell Peralta", "Birdhouse", "Shorty's"], correctIndex: 1 },
    { level: 6, question: "Jamie Thomas founded?", answers: ["Zero", "Mystery", "Fallen", "All of the above"], correctIndex: 3 },
    { level: 6, question: "Brand founded by Ed Templeton?", answers: ["Toy Machine", "Foundation", "RVCA", "Emerica"], correctIndex: 0 },

    // --- LEVEL 7 (Sponsored) ---
    { level: 7, question: "Famous 25-stair set in France?", answers: ["Macba", "Lyon 25", "El Toro", "Wallenberg"], correctIndex: 1 },
    { level: 7, question: "Famous 20-stair set in California?", answers: ["Hollywood High", "El Toro", "Carlsbad", "Love Park"], correctIndex: 1 },
    { level: 7, question: "Love Park is located in?", answers: ["NYC", "Philadelphia", "Chicago", "Boston"], correctIndex: 1 },
    { level: 7, question: "Famous museum spot in Barcelona?", answers: ["MACBA", "Staline", "Parallel", "Sants"], correctIndex: 0 },
    { level: 7, question: "The 'Big 4' block is at?", answers: ["Lincoln High", "Wallenberg", "Rincon", "Embarcadero"], correctIndex: 1 },
    { level: 7, question: "Indoor park owned by Steve Berra/Eric Koston?", answers: ["The Facility", "The Berrics", "The Training Facility", "Skate Lab"], correctIndex: 1 },
    { level: 7, question: "Annual contest in Florida?", answers: ["Tampa Pro", "Miami Open", "Orlando Cup", "Florida Gold"], correctIndex: 0 },
    { level: 7, question: "Street League Skateboarding (SLS) uses what scoring max?", answers: ["100", "10", "10.0 (formerly)", "50"], correctIndex: 2 },
    { level: 7, question: "The Carlsbad Gap is currently?", answers: ["Open", "Demolished", "Rebuilt", "Private"], correctIndex: 1 },
    { level: 7, question: "Famous pier park in NYC?", answers: ["LES", "Chelsea Piers", "Tribeca", "Pier 7"], correctIndex: 1 },

    // --- LEVEL 8 (Ripper) ---
    { level: 8, question: "Video: 'Yeah Right!' (2003) is by?", answers: ["Girl", "Chocolate", "Lakaii", "Flip"], correctIndex: 0 },
    { level: 8, question: "Video: 'Baker 3' release year?", answers: ["2003", "2005", "2007", "2001"], correctIndex: 1 },
    { level: 8, question: "Eric Koston's shoe brand in mid-2000s?", answers: ["Nike SB", "eS", "Lakai", "Emerica"], correctIndex: 2 },
    { level: 8, question: "Chad Muska's signature accessory?", answers: ["Boombox", "Hat", "Scarf", "Backpack"], correctIndex: 0 },
    { level: 8, question: "Who tried to ollie the Lyon 25 in 'Flip: Sorry'?", answers: ["Arto Saari", "Ali Boulala", "Tom Penny", "Mark Appleyard"], correctIndex: 1 },
    { level: 8, question: "Video: 'Fulfill the Dream' is by?", answers: ["Shorty's", "Osiris", "Globe", "DVS"], correctIndex: 0 },
    { level: 8, question: "Who won SOTY in 2003?", answers: ["Mark Appleyard", "Daewon Song", "Marc Johnson", "Chris Cole"], correctIndex: 0 },
    { level: 8, question: "Geoff Rowley rides for which shoe brand?", answers: ["DC", "Etnies", "Vans", "Converse"], correctIndex: 2 },
    { level: 8, question: "Who has a trick named the 'K-Grind'?", answers: ["Eric Koston", "Terry Kennedy", "Mike V", "Christian Hosoi"], correctIndex: 0 },
    { level: 8, question: "Tom Penny is known for his ___ style?", answers: ["Aggressive", "Effortless", "Technical", "Sketchy"], correctIndex: 1 },

    // --- LEVEL 9 (Pro) ---
    { level: 9, question: "Video: 'Questionable' (1992) is by?", answers: ["World Industries", "Plan B", "Blind", "Girl"], correctIndex: 1 },
    { level: 9, question: "Video: 'Welcome to Hell' is by?", answers: ["Zero", "Toy Machine", "Birdhouse", "Element"], correctIndex: 1 },
    { level: 9, question: "Video: 'Video Days' is by?", answers: ["Blind", "Video", "Girl", "World"], correctIndex: 0 },
    { level: 9, question: "Video: 'Misled Youth' is by?", answers: ["Zero", "Mystery", "Fallen", "Thrasher"], correctIndex: 0 },
    { level: 9, question: "Video: 'The End' is by?", answers: ["Birdhouse", "Baker", "Shorty's", "Flip"], correctIndex: 0 },
    { level: 9, question: "Muska's first pro shoe was with?", answers: ["Circa", "Supra", "eS", "Etnies"], correctIndex: 2 },
    { level: 9, question: "Jamie Thomas nickname?", answers: ["The King", "The Chief", "The Boss", "The General"], correctIndex: 1 },
    { level: 9, question: "Andrew Reynolds nickname?", answers: ["The King", "The Chief", "The Boss", "Spanky"], correctIndex: 2 },
    { level: 9, question: "Video: 'Mouse' is by?", answers: ["Chocolate", "Girl", "Plan B", "Almost"], correctIndex: 1 },
    { level: 9, question: "Kareem Campbell's character in THPS had which special?", answers: ["Ghetto Bird", "900", "McTwist", "Christ Air"], correctIndex: 0 },

    // --- LEVEL 10 (Legend) ---
    { level: 10, question: "The Z-Boys originated from?", answers: ["San Francisco", "New York", "Dogtown (Santa Monica)", "Huntington Beach"], correctIndex: 2 },
    { level: 10, question: "Who invented the urethane wheel?", answers: ["Frank Nasworthy", "George Powell", "Stacy Peralta", "Fausto Vitello"], correctIndex: 0 },
    { level: 10, question: "Who invented the Ollie on vert?", answers: ["Rodney Mullen", "Alan Gelfand", "Tony Hawk", "Christian Hosoi"], correctIndex: 1 },
    { level: 10, question: "Who invented the McTwist?", answers: ["Tony Hawk", "Mike McGill", "Steve Caballero", "Lance Mountain"], correctIndex: 1 },
    { level: 10, question: "The Fakie 360 is also known as?", answers: ["Caballerial", "Gazelle", "Bigspin", "Helipop"], correctIndex: 0 },
    { level: 10, question: "Thrasher Magazine founding year?", answers: ["1979", "1981", "1983", "1985"], correctIndex: 1 },
    { level: 10, question: "Transworld Skateboarding founding year?", answers: ["1981", "1983", "1985", "1987"], correctIndex: 1 },
    { level: 10, question: "Who did the first 900?", answers: ["Tony Hawk", "Tas Pappas", "Danny Way", "Bob Burnquist"], correctIndex: 0 },
    { level: 10, question: "Famous freestyle skater who joined Plan B?", answers: ["Rodney Mullen", "Daewon Song", "Pierre Andre", "Per Welinder"], correctIndex: 0 },
    { level: 10, question: "First shoe company for skating?", answers: ["Nike", "Vans", "Converse", "Etnies"], correctIndex: 1 },

    // --- LEVEL 11 (Icon) ---
    { level: 11, question: "What is a 'Gazelle Flip'?", answers: ["360 Flip", "Bigspin 360 Kickflip", "Varial double flip", "Laser flip 180"], correctIndex: 1 },
    { level: 11, question: "Another name for the Forward Flip?", answers: ["Dolphin Flip", "Porpoise Flip", "Muska Flip", "Hardflip"], correctIndex: 0 },
    { level: 11, question: "A Switch Frontside 540 is also called?", answers: ["Merlin Twist", "McTwist", "Caballerial", "Tornado"], correctIndex: 0 },
    { level: 11, question: "Who invented the Darkslide?", answers: ["Tony Hawk", "Rodney Mullen", "Natas Kaupas", "Mark Gonzales"], correctIndex: 1 },
    { level: 11, question: "Who invented the Casper Slide?", answers: ["Rodney Mullen", "Daewon Song", "Richie Jackson", "Gou Miyagi"], correctIndex: 0 },
    { level: 11, question: "Year the 900 was landed at X Games?", answers: ["1998", "1999", "2000", "2001"], correctIndex: 1 },
    { level: 11, question: "First skater to land a 1080?", answers: ["Tom Schaar", "Shaun White", "Mitchie Brusco", "Gui Khury"], correctIndex: 0 },
    { level: 11, question: "Laser Flip rotation components?", answers: ["BS 360 Shove + Heelflip", "FS 360 Shove + Heelflip", "FS 360 Shove + Kickflip", "BS 360 Shove + Kickflip"], correctIndex: 1 },
    { level: 11, question: "Dragon Flip is a?", answers: ["360 Dolphin Flip", "360 Hardflip", "540 Flip", "Double Tre"], correctIndex: 0 },
    { level: 11, question: "Who popularized the Christ Air?", answers: ["Christian Hosoi", "Tony Hawk", "Danny Way", "Steve Caballero"], correctIndex: 0 },

    // --- LEVEL 12 (Hall of Fame) ---
    { level: 12, question: "Founder of World Industries?", answers: ["Rodney Mullen", "Steve Rocco", "Mike Vallely", "Spike Jonze"], correctIndex: 1 },
    { level: 12, question: "Founders of Girl Skateboards?", answers: ["Koston/Mariano", "Howard/Carroll", "Mullen/Rocco", "Way/McKay"], correctIndex: 1 },
    { level: 12, question: "Founder of DGK?", answers: ["Stevie Williams", "Josh Kalis", "Rob Dyrdek", "Terry Kennedy"], correctIndex: 0 },
    { level: 12, question: "Founder of Primitive?", answers: ["Paul Rodriguez", "Torey Pudwill", "Nyjah Huston", "Shane O'Neill"], correctIndex: 0 },
    { level: 12, question: "Founder of April Skateboards?", answers: ["Yuto Horigome", "Shane O'Neill", "Guy Mariano", "Luan Oliveira"], correctIndex: 1 },
    { level: 12, question: "Late Editor-in-Chief of Thrasher?", answers: ["Fausto Vitello", "Jake Phelps", "Michael Burnett", "Dave Carnie"], correctIndex: 1 },
    { level: 12, question: "Big Brother magazine was sold to?", answers: ["Transworld", "Larry Flynt", "Time Warner", "Viacom"], correctIndex: 1 },
    { level: 12, question: "Who owns Baker Boys Distribution?", answers: ["Andrew Reynolds", "Erik Ellington", "Jim Greco", "All of the above"], correctIndex: 3 },
    { level: 12, question: "Shoe brand founded by Jamie Thomas?", answers: ["Fallen", "Straye", "Vox", "Circa"], correctIndex: 0 },
    { level: 12, question: "Board brand founded by Ed Templeton?", answers: ["Toy Machine", "Foundation", "Alien Workshop", "Habitat"], correctIndex: 0 },

    // --- LEVEL 13 (GOAT) ---
    { level: 13, question: "Highest Ollie official record holder?", answers: ["Danny Way", "Aldrin Garcia", "Reese Forbes", "Xavier Alford"], correctIndex: 1 },
    { level: 13, question: "Who ollied the Great Wall of China?", answers: ["Bob Burnquist", "Danny Way", "Tony Hawk", "Rob Dyrdek"], correctIndex: 1 },
    { level: 13, question: "Who has the most X Games medals?", answers: ["Tony Hawk", "Bob Burnquist", "Bucky Lasek", "Nyjah Huston"], correctIndex: 1 },
    { level: 13, question: "First person to loop the loop?", answers: ["Tony Hawk", "Bob Burnquist", "Danny Way", "Shaun White"], correctIndex: 0 },
    { level: 13, question: "Who did the loop switch?", answers: ["Tony Hawk", "Bob Burnquist", "Danny Way", "Bam Margera"], correctIndex: 1 },
    { level: 13, question: "Attempted the 'Leap of Faith' in Zero video?", answers: ["Chris Cole", "Jamie Thomas", "Ryan Sheckler", "Nyjah Huston"], correctIndex: 1 },
    { level: 13, question: "SOTY 1990?", answers: ["Tony Hawk", "Danny Way", "Steve Caballero", "Mike Vallely"], correctIndex: 0 },
    { level: 13, question: "SOTY 2000?", answers: ["Eric Koston", "Geoff Rowley", "Arto Saari", "Rick McCrank"], correctIndex: 1 },
    { level: 13, question: "SOTY 2010?", answers: ["Leo Romero", "Grant Taylor", "David Gonzalez", "Ishod Wair"], correctIndex: 0 },
    { level: 13, question: "First person to land a 900?", answers: ["Tony Hawk", "Danny Way", "Tas Pappas", "Giorgio Zattoni"], correctIndex: 0 },

    // --- LEVEL 14 (Godlike) ---
    { level: 14, question: "Spike Jonze directed which classic video?", answers: ["Mouse", "Video Days", "Questionable", "Virtual Reality"], correctIndex: 1 },
    { level: 14, question: "Which video featured the 'Invisible Boards' skit?", answers: ["Fully Flared", "Yeah Right!", "Hot Chocolate", "Pretty Sweet"], correctIndex: 1 },
    { level: 14, question: "Heath Kirchart's retirement part was in?", answers: ["Mind Field", "Stay Gold", "Made", "Propeller"], correctIndex: 1 },
    { level: 14, question: "Dylan Rieder's breakout style part?", answers: ["Gravis - dylan.", "Mind Field", "Cherry", "Away Days"], correctIndex: 0 },
    { level: 14, question: "The first DC video was called?", answers: ["DC Video", "The DC Video", "Supernova", "Mega"], correctIndex: 1 },
    { level: 14, question: "Who had the last part in 'Fully Flared'?", answers: ["Mike Mo", "Guy Mariano", "Marc Johnson", "Eric Koston"], correctIndex: 2 },
    { level: 14, question: "Who had the first part in 'Fully Flared'?", answers: ["Mike Mo", "Alex Olson", "Brandon Biebel", "Lucas Puig"], correctIndex: 0 },
    { level: 14, question: "Song in Arto Saari's 'Sorry' part?", answers: ["I Love Rock n Roll", "Holy Diver", "Iron Man", "War Pigs"], correctIndex: 1 },
    { level: 14, question: "Song in Jerry Hsu's 'Bag of Suck' part?", answers: ["Just Like Honey", "Build Me Up Buttercup", "Where is my Mind", "Maps"], correctIndex: 0 },
    { level: 14, question: "Who directed 'Mind Field'?", answers: ["Spike Jonze", "Greg Hunt", "Ty Evans", "French Fred"], correctIndex: 1 },

    // --- LEVEL 15 (THE MILLION) ---
    { level: 15, question: "Original material of first skate wheels?", answers: ["Wood", "Clay", "Steel", "Rubber"], correctIndex: 2 },
    { level: 15, question: "Rodney Mullen's autobiography title?", answers: ["The Mutt", "The Hawk", "Street King", "Flatground"], correctIndex: 0 },
    { level: 15, question: "Who is 'The Gonz'?", answers: ["Mark Gonzales", "Gonzalo Rodriguez", "Steve Gonzalez", "Mike Gonzales"], correctIndex: 0 },
    { level: 15, question: "Mark Gonzales historic boardslide location?", answers: ["Wallenberg", "Double Set Handrail", "Gonz Gap (Embarcadero)", "Hubba Hideout"], correctIndex: 2 },
    { level: 15, question: "Natas Kaupas is famous for which spin?", answers: ["Natas Spin", "Fire hydrant spin", "Kaupas Twirl", "Tornado"], correctIndex: 0 },
    { level: 15, question: "Danny Way's first board sponsor?", answers: ["Plan B", "H-Street", "Powell", "Santa Cruz"], correctIndex: 1 },
    { level: 15, question: "Mike Vallely's first board sponsor?", answers: ["World Industries", "Powell Peralta", "Black Label", "Element"], correctIndex: 1 },
    { level: 15, question: "Who invented the Mike-V Plant?", answers: ["Mike Vallely", "Rodney Mullen", "Jason Jessee", "Jeff Grosso"], correctIndex: 0 },
    { level: 15, question: "Where was the 'Leap of Faith' located?", answers: ["Point Loma High", "Carlsbad High", "Hollywood High", "El Toro High"], correctIndex: 0 },
    { level: 15, question: "Who won the first ever X Games Vert Gold?", answers: ["Tony Hawk", "Andy Macdonald", "Bucky Lasek", "Bob Burnquist"], correctIndex: 0 }
];
