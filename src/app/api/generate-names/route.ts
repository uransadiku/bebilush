import { generateContent } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { gender, style, letter } = body;

        const prompt = `
      Act as an expert in Albanian culture and onomatology.
      Generate a list of 5 unique, beautiful Albanian baby names for a ${gender} (boy/girl).
      Style preference: ${style} (Modern, Traditional, Illyrian, Muslim, Catholic).
      ${letter ? `The names must start with the letter "${letter}".` : ""}
      
      For each name, provide:
      1. The Name
      2. The Meaning (in Albanian)
      3. The Origin/Context (Illyrian, Geographic, etc.)
      4. The Gender (boy/girl)
      
      Return the response in strict JSON format as an array of objects with keys: "name", "meaning", "origin", "gender".
      Do not include any markdown formatting or code blocks, just the raw JSON string.
      Example: [{"name": "Dritan", "meaning": "Dritë, shkëlqim", "origin": "Illyrian", "gender": "boy"}]
      `;

        const responseText = await generateContent(prompt);

        // Clean up potential markdown code blocks if Gemini adds them
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        const names = JSON.parse(cleanJson);

        return NextResponse.json({ names });
    } catch (error: any) {
        console.error("Name generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate names. Please try again." },
            { status: 500 }
        );
    }
}
