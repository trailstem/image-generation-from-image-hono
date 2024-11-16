import { Hono } from "hono";
import { writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const app = new Hono();
const CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;
const API_KEY = process.env.CLOUDFLARE_API_TOKEN;
const OUTPUT_DIRECTORY = process.env.OUTPUT_DIRECTORY || "./generated_images";

// 画像生成
const generateImage = async (prompt: string): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/@cf/lykon/dreamshaper-8-lcm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          negative_prompt:
            "Images that are rough, images that do not identify the content specified in the prompt, or images that are not faithful to the propmt.",
          height: 512,
          width: 512,
          num_steps: 20,
          guidance: 10000,
        }),
      }
    );

    if (!response.ok) {
      console.error(`Failed to generate image: ${response.statusText}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

// 画像保存
const saveImage = async (filename: string, data: Uint8Array) => {
  try {
    if (!existsSync(OUTPUT_DIRECTORY)) {
      mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
    }

    const filePath = path.join(OUTPUT_DIRECTORY, filename);
    await writeFile(filePath, data);
    console.log(`Image saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("Error saving image:", error);
    return null;
  }
};

app.post("/generate", async (c) => {
  const { prompt } = await c.req.json();

  if (!prompt) {
    return c.json({ error: "Prompt is required" }, 400);
  }

  try {
    // 画像生成
    const resultImage = await generateImage(prompt);
    if (!resultImage) {
      return c.json({ error: "Image generation failed" }, 500);
    }

    // 画像保存
    const timestamp = Date.now();
    const filename = `generated_image_${timestamp}.png`;
    const filePath = await saveImage(filename, resultImage);

    if (!filePath) {
      return c.json({ error: "Failed to save image" }, 500);
    }

    return c.json({ message: "Image generated successfully", path: filePath });
  } catch (error) {
    console.error("Error processing request:", error);
    return c.json({ error: "Server error" }, 500);
  }
});

export default app;

Bun.serve({
  fetch: app.fetch,
  port: 8080,
});
