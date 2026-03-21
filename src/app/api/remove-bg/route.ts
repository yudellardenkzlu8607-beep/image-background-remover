import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Get the original MIME type
    const imageType = image.type || "image/png";
    console.log("Image type:", imageType, "name:", image.name);

    // Convert file to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Remove.bg API
    const apiKey = "42d1MGCDgUDGeMtCKg3pPRYk";
    
    const form = new FormData();
    // Use the correct file type
    form.append("image_file", new Blob([buffer], { type: imageType }), image.name);
    form.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Remove.bg API error: ${errorText}` },
        { status: response.status }
      );
    }

    // Convert result to base64
    const resultBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(resultBuffer).toString("base64");
    const resultUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ result: resultUrl });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
