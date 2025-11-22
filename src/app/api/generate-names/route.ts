import { generateContent } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gender, style, startingLetter, excludeNames } = body;

        const genderPrompt = gender === 'both' ? 'boy or girl' : gender;

        // Define strict style definitions
        const styleDefinitions: Record<string, string> = {
            modern: "Modern, contemporary, short, trendy names popular in 2024-2025. Names that sound international but have Albanian flair.",
            traditional: "Strictly Ancient Illyrian names, names of Albanian historical figures, or names with pure Albanian etymology (words from the Albanian language). DO NOT include generic religious names unless they are specifically Illyrian.",
            muslim: "Strictly names of Islamic origin used in Albania (Arabic/Turkish roots), names from the Quran, names of prophets or companions. MUST have clear Islamic significance.",
            catholic: "Strictly names of Catholic/Christian origin used in Albania (Biblical, Latin, Saints). MUST have clear Christian significance.",
            nature: "Names derived STRICTLY from nature (flowers, trees, rivers, mountains, celestial bodies, animals) in the Albanian language (e.g., Yll, Lule, Mal).",
            mix: "A diverse mixture of Modern, Traditional, Religious, and Nature names. Surprise the user with variety."
        };

        const selectedStyleDefinition = styleDefinitions[style] || styleDefinitions.mix;

        const prompt = `
      Act as an expert in Albanian culture, history, and onomatology.
      Generate a list of 5 unique, beautiful Albanian baby names for a ${genderPrompt}.
      
      STRICT STYLE CONSTRAINT: ${selectedStyleDefinition}
      
      ${startingLetter ? `CRITICAL CONSTRAINT: The names MUST start with the letter "${startingLetter}".` : ""}
      ${excludeNames && excludeNames.length > 0 ? `CRITICAL CONSTRAINT: DO NOT include any of these names: ${excludeNames.join(', ')}.` : ""}
      
      CRITICAL LANGUAGE CONSTRAINT: ALL output (Meanings, Origins, Context) MUST be in the ALBANIAN language. Do NOT use English for descriptions or meanings.
      
      For each name, provide:
      1. The Name
      2. The Meaning (in Albanian language ONLY)
      3. The Origin/Context (Illyrian, Arabic, Latin, Geographic, etc. - in Albanian)
      4. The Gender (boy/girl)
      
      Return the response in strict JSON format as an array of objects with keys: "name", "meaning", "origin", "gender".
      Do not include any markdown formatting or code blocks, just the raw JSON string.
      Example: [{"name": "Dritan", "meaning": "Dritë, shkëlqim", "origin": "Illyrian", "gender": "boy"}]
      `;

        const responseText = await generateContent(prompt);

        // Clean up potential markdown code blocks if Gemini adds them
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        const rawNames = JSON.parse(cleanJson);

        // Normalize names to Title Case to prevent uppercase issues
        const names = rawNames.map((item: any) => ({
            ...item,
            name: item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase()
        }));

        return NextResponse.json({ names });
    } catch (error: any) {
        console.error("Name generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate names. Please try again." },
            { status: 500 }
        );
    }
}
