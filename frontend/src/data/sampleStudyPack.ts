import { StudyPack } from "@/types/studyPack";

export const sampleStudyPack: StudyPack = {
  meta: {
    subject: "Science",
    grade: "7",
    chapter_title: "Photosynthesis",
    language: "English",
  },
  summary: {
    tl_dr:
      "Photosynthesis is the process by which green plants make their own food using sunlight, water, and carbon dioxide, releasing oxygen as a byproduct.",
    important_points: [
      "Photosynthesis occurs mainly in the leaves of plants",
      "Chlorophyll is the green pigment that captures sunlight energy",
      "The process requires sunlight, water (H₂O), and carbon dioxide (CO₂)",
      "Glucose (sugar) is produced as food for the plant",
      "Oxygen (O₂) is released as a byproduct into the atmosphere",
      "Stomata are tiny pores on leaves that allow gas exchange",
      "The process takes place in chloroplasts within plant cells",
      "Photosynthesis is essential for life on Earth as it produces oxygen",
      "Plants store excess glucose as starch for later use",
      "Light and dark reactions are two stages of photosynthesis",
    ],
  },
  key_terms: [
    {
      term: "Photosynthesis",
      meaning: "The process by which plants make food using sunlight, water, and carbon dioxide",
      example: "A leaf turning sunlight into sugar",
    },
    {
      term: "Chlorophyll",
      meaning: "The green pigment in plants that absorbs sunlight",
      example: "What makes leaves look green",
    },
    {
      term: "Chloroplast",
      meaning: "The part of a plant cell where photosynthesis happens",
      example: "Like tiny factories inside leaf cells",
    },
    {
      term: "Stomata",
      meaning: "Tiny pores on leaf surfaces for gas exchange",
      example: "Microscopic holes that let CO₂ in and O₂ out",
    },
    {
      term: "Glucose",
      meaning: "A simple sugar made during photosynthesis",
      example: "The energy food plants create for themselves",
    },
    {
      term: "Carbon Dioxide",
      meaning: "A gas (CO₂) that plants absorb from air for photosynthesis",
      example: "The gas we breathe out that plants need",
    },
    {
      term: "Oxygen",
      meaning: "A gas (O₂) released by plants during photosynthesis",
      example: "The gas we need to breathe",
    },
    {
      term: "Sunlight",
      meaning: "Light energy from the sun needed for photosynthesis",
      example: "Why plants grow towards windows",
    },
    {
      term: "Starch",
      meaning: "How plants store extra glucose for later use",
      example: "Like a plant's food storage pantry",
    },
    {
      term: "Transpiration",
      meaning: "The loss of water vapor through stomata",
      example: "Plants 'sweating' water into the air",
    },
    {
      term: "Light Reaction",
      meaning: "First stage of photosynthesis that needs light",
      example: "Capturing sunlight energy in the chloroplast",
    },
    {
      term: "Dark Reaction",
      meaning: "Second stage that doesn't need direct light",
      example: "Using captured energy to make glucose",
    },
  ],
  flashcards: [
    {
      q: "What is the main purpose of photosynthesis?",
      a: "To produce food (glucose) for the plant using sunlight, water, and carbon dioxide",
    },
    {
      q: "Where does photosynthesis mainly occur in a plant?",
      a: "In the leaves, specifically in the chloroplasts",
    },
    {
      q: "What gives plants their green color?",
      a: "Chlorophyll, the green pigment that absorbs sunlight",
    },
    {
      q: "What are the three things needed for photosynthesis?",
      a: "Sunlight, water (H₂O), and carbon dioxide (CO₂)",
    },
    {
      q: "What gas is released during photosynthesis?",
      a: "Oxygen (O₂)",
    },
    {
      q: "What are stomata?",
      a: "Tiny pores on leaf surfaces that allow gases to enter and exit",
    },
    {
      q: "What is glucose?",
      a: "A simple sugar that plants make as food during photosynthesis",
    },
    {
      q: "How do plants store extra glucose?",
      a: "They convert it to starch for storage",
    },
    {
      q: "Why is photosynthesis important for humans?",
      a: "It produces the oxygen we breathe and is the base of food chains",
    },
    {
      q: "What are the two stages of photosynthesis?",
      a: "Light reaction (needs sunlight) and dark reaction (doesn't need direct light)",
    },
    {
      q: "What part of the plant cell contains chlorophyll?",
      a: "The chloroplast",
    },
    {
      q: "Write the word equation for photosynthesis",
      a: "Carbon dioxide + Water + Sunlight → Glucose + Oxygen",
    },
  ],
  quiz: {
    instructions: "Choose the best answer for each question. Good luck!",
    questions: [
      {
        id: 1,
        question: "What is the green pigment in plants called?",
        options: ["Melanin", "Chlorophyll", "Hemoglobin", "Carotene"],
        correct_index: 1,
        explanation: "Chlorophyll is the green pigment that gives plants their color and absorbs sunlight for photosynthesis.",
        difficulty: "easy",
      },
      {
        id: 2,
        question: "Which gas do plants release during photosynthesis?",
        options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
        correct_index: 2,
        explanation: "Plants release oxygen as a byproduct of photosynthesis, which is essential for animal life.",
        difficulty: "easy",
      },
      {
        id: 3,
        question: "Where in the plant cell does photosynthesis occur?",
        options: ["Nucleus", "Mitochondria", "Chloroplast", "Vacuole"],
        correct_index: 2,
        explanation: "Chloroplasts are the organelles that contain chlorophyll and are where photosynthesis takes place.",
        difficulty: "easy",
      },
      {
        id: 4,
        question: "What are stomata?",
        options: ["Root hairs", "Leaf veins", "Tiny pores for gas exchange", "Flower petals"],
        correct_index: 2,
        explanation: "Stomata are tiny openings on leaves that allow carbon dioxide in and oxygen out.",
        difficulty: "easy",
      },
      {
        id: 5,
        question: "What is the main product of photosynthesis that plants use as food?",
        options: ["Protein", "Glucose", "Fat", "Vitamin"],
        correct_index: 1,
        explanation: "Glucose is the sugar that plants produce during photosynthesis and use for energy and growth.",
        difficulty: "medium",
      },
      {
        id: 6,
        question: "Why do plants need sunlight for photosynthesis?",
        options: ["To stay warm", "As an energy source", "To attract insects", "To produce seeds"],
        correct_index: 1,
        explanation: "Sunlight provides the energy needed to convert carbon dioxide and water into glucose.",
        difficulty: "medium",
      },
      {
        id: 7,
        question: "How do plants store excess glucose?",
        options: ["As fat", "As protein", "As starch", "As water"],
        correct_index: 2,
        explanation: "Plants convert extra glucose into starch, which can be stored and used later when needed.",
        difficulty: "medium",
      },
      {
        id: 8,
        question: "What happens to photosynthesis rate when there is no sunlight?",
        options: ["It increases", "It stays the same", "It decreases significantly", "It doubles"],
        correct_index: 2,
        explanation: "Without sunlight, the light-dependent reactions cannot occur, drastically reducing photosynthesis.",
        difficulty: "medium",
      },
      {
        id: 9,
        question: "Which of these is NOT required for photosynthesis?",
        options: ["Carbon dioxide", "Oxygen", "Water", "Sunlight"],
        correct_index: 1,
        explanation: "Oxygen is a product of photosynthesis, not a requirement. Plants need CO₂, water, and sunlight.",
        difficulty: "hard",
      },
      {
        id: 10,
        question: "How does photosynthesis help maintain Earth's atmosphere?",
        options: [
          "By producing carbon dioxide",
          "By removing oxygen",
          "By producing oxygen and removing carbon dioxide",
          "By producing nitrogen",
        ],
        correct_index: 2,
        explanation: "Photosynthesis removes CO₂ (a greenhouse gas) and produces O₂, helping maintain atmospheric balance.",
        difficulty: "hard",
      },
    ],
  },
};
