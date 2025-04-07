import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    console.log("🖼️ Received image URL:", imageUrl);

    // Generate a new image with DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt:
        "Create a Studio Ghibli style anime artwork with vibrant colors, magical atmosphere, and detailed backgrounds. The image should have a whimsical, dreamy quality with soft lighting and painterly effects.",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    console.log("✅ OpenAI response:", response);

    if (!response.data || !response.data[0]?.url) {
      throw new Error("No valid image URL in conversion response");
    }

    return NextResponse.json({ output: [response.data[0].url] });
  } catch (error) {
    console.error("🧨 Error in convert route:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
