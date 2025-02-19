import { Hono } from "hono";
import { saveImage } from "./utils";
import { classifyImage, generateImage, summarizeText } from "./usecase";

const app = new Hono();
app.post("/generate", async (c) => {
  try {
    const { prompt } = await c.req.json();
    if (!prompt) throw new Error("Prompt is required");

    const imageData = await generateImage({
      prompt,
      height: 512,
      width: 512,
      numSteps: 20,
      guidance: 1,
    });

    const filename = `image_${Date.now()}.png`;
    const filePath = await saveImage(filename, imageData);

    return c.json({ success: true, path: filePath });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({ success: false, error: "Unknown error occurred" }, 400);
  }
});

app.post("/judge", async (c) => {
  try {
    const imageBuffer = await c.req.arrayBuffer();
    if (!imageBuffer) throw new Error("Image data is required");

    const result = await classifyImage(new Uint8Array(imageBuffer));
    return c.json({ success: true, result });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({ success: false, error: "Unknown error occurred" }, 400);
  }
});
app.post("/summarize", async (c) => {
  try {
    const { text } = await c.req.json();
    if (!text) {
      return c.json({ error: "Text is required" }, 400);
    }

    const response = await summarizeText({ text, maxLength: 1024 });

    if (
      !response ||
      !response.result ||
      typeof response.result.summary !== "string"
    ) {
      return c.json({ error: "Invalid API response format" }, 500);
    }

    const cleanSummary = response.result.summary.replace(/\n/g, " ").trim();

    return c.json({ summary: cleanSummary });
  } catch (error) {
    return c.json({ error: "Failed to summarize text" }, 500);
  }
});

Bun.serve({
  fetch: app.fetch,
  port: 8080,
});

export default app;
