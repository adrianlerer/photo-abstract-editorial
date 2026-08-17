import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { compositionSchema, isFormat } from "@/lib/composition";
import { EDITORIAL_PROMPT } from "@/lib/editorial-prompt";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    const format = String(formData.get("format") ?? "");

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: "Choose a photograph first." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(photo.type)) {
      return NextResponse.json({ error: "Use a JPG, PNG, or WebP photograph." }, { status: 415 });
    }
    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "The photograph must be 20 MB or smaller." }, { status: 413 });
    }
    if (!isFormat(format)) {
      return NextResponse.json({ error: "Choose a valid output format." }, { status: 400 });
    }

    const imageData = new Uint8Array(await photo.arrayBuffer());
    const { output } = await generateText({
      model: "google/gemini-3-flash",
      output: Output.object({ schema: compositionSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${EDITORIAL_PROMPT}\n\nThe selected output format is ${format}.` },
            { type: "file", data: imageData, mediaType: photo.type },
          ],
        },
      ],
    });

    return NextResponse.json(output, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Composition analysis failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "The composition could not be created. Please try again." },
      { status: 502 },
    );
  }
}
