/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudyPackRequest {
  grade: string;
  subject: string;
  chapterTitle: string;
  language: string;
  chapterText?: string;
  pdfData?: string; // base64 encoded PDF
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { grade, subject, chapterTitle, language, chapterText, pdfData }: StudyPackRequest = await req.json();

    // Require either chapterText OR pdfData
    if (!grade || !subject || !chapterTitle || (!chapterText && !pdfData)) {
      console.log("Missing fields:", { grade, subject, chapterTitle, hasText: !!chapterText, hasPdf: !!pdfData });
      return new Response(
        JSON.stringify({ error: "Missing required fields. Provide either chapter text or a PDF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating study pack for: ${chapterTitle} (Grade ${grade}, ${subject})`);
    console.log(`Input type: ${pdfData ? 'PDF' : 'Text'}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt based on grade level
    const gradeNum = parseInt(grade);
    let difficultyGuidelines = "";
    let notesGuidelines = "";
    
    if (gradeNum <= 5) {
      difficultyGuidelines = "Use very simple words and 1-line explanations. Create mostly direct fact questions.";
      notesGuidelines = "Write notes like you're explaining to a curious child. Use simple words, short sentences, and fun examples. Break down every concept into tiny, easy-to-understand pieces.";
    } else if (gradeNum <= 8) {
      difficultyGuidelines = "Use simple but detailed language with 1-2 line explanations. Include a mix of fact and 'why' questions.";
      notesGuidelines = "Write notes that explain the 'why' behind concepts. Use relatable examples from everyday life. Include cause-and-effect relationships.";
    } else if (gradeNum <= 10) {
      difficultyGuidelines = "Provide more detailed explanations with reasoning (2-3 lines). Include application questions.";
      notesGuidelines = "Write comprehensive notes that connect concepts together. Include practical applications, diagrams descriptions, and real-world examples. Explain underlying principles.";
    } else {
      difficultyGuidelines = "Provide in-depth explanations with definitions and short reasoning. Include concept-based questions.";
      notesGuidelines = "Write detailed academic notes with thorough explanations of theories, mechanisms, and processes. Include derivations where applicable, exceptions, and advanced applications.";
    }

    const systemPrompt = `You are an expert educational content creator specializing in creating study materials that help students truly understand and master concepts. ${difficultyGuidelines}

For the NOTES section specifically:
${notesGuidelines}
The notes should be SO COMPREHENSIVE and DETAILED that a student can understand the ENTIRE chapter just by reading them. Each section should:
- Explain concepts from the ground up
- Use clear examples and analogies
- Connect ideas to what students already know
- Highlight important relationships between concepts
- Include any formulas, rules, or key facts
- Explain WHY things work the way they do, not just what they are

IMPORTANT: Return ONLY valid JSON matching this exact structure, no markdown, no extra text:
{
  "summary": {
    "tl_dr": "A brief 2-3 sentence summary of the entire chapter",
    "important_points": ["point 1", "point 2", ...] (8-12 items)
  },
  "notes": [
    { 
      "title": "Section Title (e.g., 'Introduction to Topic', 'Core Concept 1', etc.)",
      "content": "Detailed multi-paragraph explanation covering this aspect of the chapter thoroughly. This should be 3-5 paragraphs minimum, explaining everything a student needs to know about this section."
    }
  ] (6-10 sections covering the entire chapter comprehensively),
  "key_terms": [
    { "term": "term name", "meaning": "definition", "example": "example usage" }
  ] (10-18 items),
  "flashcards": [
    { "q": "question", "a": "answer" }
  ] (10-15 items),
  "important_questions": {
    "one_mark": [
      { "question": "Short factual question", "answer": "Brief 1-2 sentence answer" }
    ] (5-8 questions - definition, recall, one-word answer type),
    "three_mark": [
      { "question": "Question requiring explanation", "answer": "Detailed answer with 3-4 points or a short paragraph" }
    ] (4-6 questions - short answer, reason-based, comparison type),
    "five_mark": [
      { "question": "Long-form question requiring detailed explanation", "answer": "Comprehensive answer with introduction, main points (4-5), examples, and conclusion" }
    ] (3-4 questions - essay type, detailed explanation, application-based)
  },
  "quiz": {
    "instructions": "Choose the best answer for each question.",
    "questions": [
      {
        "id": 1,
        "question": "question text",
        "options": ["option A", "option B", "option C", "option D"],
        "correct_index": 0,
        "explanation": "why this is correct",
        "difficulty": "easy"
      }
    ] (exactly 10 questions: 4 easy, 4 medium, 2 hard)
  }
}`;

    // If a PDF is provided, extract text first (PDFs are not sent directly to the AI gateway)
    let effectiveChapterText = (chapterText ?? "").trim();

    if (pdfData) {
      console.log("Extracting text from PDF...");
      const pdfBytes = base64ToUint8Array(pdfData);
      effectiveChapterText = extractTextFromPDF(pdfBytes).trim();
      console.log("Extracted PDF text length:", effectiveChapterText.length);

      if (effectiveChapterText.length < 50) {
        return new Response(
          JSON.stringify({
            error:
              "Could not extract enough text from this PDF. It may be scanned/image-based. Please paste the chapter text instead.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Build messages (text-only) to keep requests reliable
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create a comprehensive study pack for:
- GRADE: ${grade}
- SUBJECT: ${subject}
- CHAPTER TITLE: ${chapterTitle}
- LANGUAGE: ${language}

The NOTES section is especially important - make them detailed enough that a student can learn the entire chapter just from reading the notes.

CHAPTER TEXT:
${effectiveChapterText.substring(0, 15000)}`,
      },
    ];

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.7,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate study pack. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response, handling potential markdown code blocks
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Content:", content.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct the full study pack with metadata
    const importantQuestionsFromMain = normalizeImportantQuestions(parsedContent.important_questions);

    let importantQuestions = importantQuestionsFromMain;

    // If the model omitted important questions (common when context is short), generate them in a second pass.
    if (isImportantQuestionsEmpty(importantQuestions)) {
      console.log("Important questions missing from main response; generating separately...");
      importantQuestions = await generateImportantQuestions({
        apiKey: LOVABLE_API_KEY,
        grade,
        subject,
        chapterTitle,
        language: language || "English",
        chapterText: effectiveChapterText.substring(0, 12000),
      });
    }

    const studyPack = {
      meta: {
        subject,
        grade,
        chapter_title: chapterTitle,
        language: language || "English",
      },
      summary: parsedContent.summary || { tl_dr: "", important_points: [] },
      notes: parsedContent.notes || [],
      key_terms: parsedContent.key_terms || [],
      flashcards: parsedContent.flashcards || [],
      important_questions: importantQuestions,
      quiz: parsedContent.quiz || { instructions: "", questions: [] },
    };

    const iqCount =
      (studyPack.important_questions.one_mark?.length || 0) +
      (studyPack.important_questions.three_mark?.length || 0) +
      (studyPack.important_questions.five_mark?.length || 0);

    console.log(
      "Study pack generated successfully with",
      studyPack.notes?.length || 0,
      "note sections and",
      iqCount,
      "important questions"
    );

    return new Response(
      JSON.stringify(studyPack),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating study pack:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate study pack: " + (error instanceof Error ? error.message : "Unknown error") }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function base64ToUint8Array(base64: string): Uint8Array {
  // atob is available in the edge runtime
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Simple PDF text extraction (same approach as our PDF parser)
function extractTextFromPDF(data: Uint8Array): string {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const pdfContent = decoder.decode(data);

  const textParts: string[] = [];

  // Method 1: Extract text from stream objects
  const streamRegex = /stream\s*\n?([\s\S]*?)\n?endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(pdfContent)) !== null) {
    const streamContent = match[1];

    // Extract text between parentheses for Tj operator
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      const text = decodeOctalEscapes(tjMatch[1]);
      if (text.trim()) textParts.push(text);
    }

    // Extract text from TJ arrays (text with positioning)
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrayMatch: RegExpExecArray | null;
    while ((tjArrayMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const textInArray = /\(([^)]*)\)/g;
      let textMatch: RegExpExecArray | null;
      while ((textMatch = textInArray.exec(arrayContent)) !== null) {
        const text = decodeOctalEscapes(textMatch[1]);
        if (text.trim()) textParts.push(text);
      }
    }

    // Look for BT...ET blocks (text blocks)
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let btMatch: RegExpExecArray | null;
    while ((btMatch = btEtRegex.exec(streamContent)) !== null) {
      const textBlock = btMatch[1];
      const innerTjRegex = /\(([^)]*)\)\s*Tj/g;
      let innerMatch: RegExpExecArray | null;
      while ((innerMatch = innerTjRegex.exec(textBlock)) !== null) {
        const text = decodeOctalEscapes(innerMatch[1]);
        if (text.trim()) textParts.push(text);
      }
    }
  }

  // Method 2: Direct text extraction for simpler PDFs
  const directTextRegex = /\(([^\\)]{3,})\)/g;
  let directMatch: RegExpExecArray | null;
  while ((directMatch = directTextRegex.exec(pdfContent)) !== null) {
    const text = decodeOctalEscapes(directMatch[1]);
    if (text.length > 3 && /^[\x20-\x7E\s]+$/.test(text)) {
      if (!textParts.includes(text)) {
        textParts.push(text);
      }
    }
  }

  let result = textParts
    .map((t) => t.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  result = result.replace(/\x00/g, "");
  return result;
}

function decodeOctalEscapes(str: string): string {
  return str
    .replace(/\\([0-7]{1,3})/g, (_: string, octal: string) => {
      return String.fromCharCode(parseInt(octal, 8));
    })
    .replace(/\\(.)/g, (_: string, char: string) => {
      switch (char) {
        case "n":
          return "\n";
        case "r":
          return "\r";
        case "t":
          return "\t";
        case "b":
          return "\b";
        case "f":
          return "\f";
        case "\\":
          return "\\";
        case "(":
          return "(";
        case ")":
          return ")";
        default:
          return char;
      }
    });
}

type ImportantQuestion = { question: string; answer: string };
type ImportantQuestions = {
  one_mark: ImportantQuestion[];
  three_mark: ImportantQuestion[];
  five_mark: ImportantQuestion[];
};

const EMPTY_IMPORTANT_QUESTIONS: ImportantQuestions = {
  one_mark: [],
  three_mark: [],
  five_mark: [],
};

function isImportantQuestionsEmpty(q: ImportantQuestions | null | undefined): boolean {
  if (!q) return true;
  return (
    (q.one_mark?.length || 0) === 0 &&
    (q.three_mark?.length || 0) === 0 &&
    (q.five_mark?.length || 0) === 0
  );
}

function normalizeImportantQuestions(input: unknown): ImportantQuestions {
  if (!input || typeof input !== "object") return { ...EMPTY_IMPORTANT_QUESTIONS };
  const obj = input as Record<string, unknown>;

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (k in obj) return obj[k];
    }
    return undefined;
  };

  const normalizeList = (list: unknown): ImportantQuestion[] => {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const it = item as Record<string, unknown>;
        const question = typeof it.question === "string" ? it.question.trim() : "";
        const answer = typeof it.answer === "string" ? it.answer.trim() : "";
        if (!question || !answer) return null;
        return { question, answer };
      })
      .filter(Boolean) as ImportantQuestion[];
  };

  return {
    one_mark: normalizeList(pick("one_mark", "oneMark", "1_mark", "one_mark_questions")),
    three_mark: normalizeList(pick("three_mark", "threeMark", "3_mark", "three_mark_questions")),
    five_mark: normalizeList(pick("five_mark", "fiveMark", "5_mark", "five_mark_questions")),
  };
}

async function generateImportantQuestions(params: {
  apiKey: string;
  grade: string;
  subject: string;
  chapterTitle: string;
  language: string;
  chapterText: string;
}): Promise<ImportantQuestions> {
  try {
    const systemPrompt = `You are an expert teacher. Return ONLY valid JSON (no markdown) matching this structure:
{
  "one_mark": [ { "question": "...", "answer": "..." } ],
  "three_mark": [ { "question": "...", "answer": "..." } ],
  "five_mark": [ { "question": "...", "answer": "..." } ]
}

Rules:
- one_mark: 5-8 short factual/definition questions with 1-2 sentence answers
- three_mark: 4-6 short-answer questions with 3-4 points or a short paragraph
- five_mark: 3-4 long-answer questions with intro, 4-5 main points, examples, conclusion`;

    const userPrompt = `Generate important exam questions for:
- GRADE: ${params.grade}
- SUBJECT: ${params.subject}
- CHAPTER TITLE: ${params.chapterTitle}
- LANGUAGE: ${params.language}

CHAPTER TEXT:
${params.chapterText}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error (important questions):", response.status, errorText);
      return { ...EMPTY_IMPORTANT_QUESTIONS };
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) return { ...EMPTY_IMPORTANT_QUESTIONS };

    let cleanContent = String(content).trim();
    if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
    else if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
    if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
    cleanContent = cleanContent.trim();

    const parsed = JSON.parse(cleanContent);
    const normalized = normalizeImportantQuestions(parsed);
    return isImportantQuestionsEmpty(normalized)
      ? { ...EMPTY_IMPORTANT_QUESTIONS }
      : normalized;
  } catch (e) {
    console.error("Failed to generate important questions separately:", e);
    return { ...EMPTY_IMPORTANT_QUESTIONS };
  }
}

