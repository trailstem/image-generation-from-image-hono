import { Hono } from "hono";
import { saveImage } from "./utils";
import {
  classifyImage,
  generateImage,
  makeApiRequest,
  summarizeText,
} from "./usecase";
import { existsSync, readFileSync } from "fs";

const app = new Hono();

// Base64文字列をUint8Arrayに変換するヘルパー関数
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

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

// インペインティング（画像の一部編集）エンドポイント
app.post("/inpaint", async (c) => {
  try {
    const {
      prompt,
      image_b64, // オプション
      mask_b64, // オプション
      height = 512,
      width = 512,
      numSteps = 20,
      guidance = 7.5,
      strength = 1,
      seed,
    } = await c.req.json();

    if (!prompt) {
      return c.json({ success: false, error: "Prompt is required" }, 400);
    }

    // デフォルト画像・マスクのURL（Cloudflareの公式ドキュメントのサンプル）
    const defaultImageUrl =
      "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog.png";
    const defaultMaskUrl =
      "https://pub-1fb693cb11cc46b2b2f656f51e015a2c.r2.dev/dog-mask.png";

    // リクエストに画像・マスクが含まれていない場合、デフォルトのURLから取得してBase64変換
    const imageBase64 =
      image_b64 ||
      (await fetch(defaultImageUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => arrayBufferToBase64(buffer)));
    const maskBase64 =
      mask_b64 ||
      (await fetch(defaultMaskUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => arrayBufferToBase64(buffer)));

    // Base64文字列をUint8Arrayに変換
    const imageBufferArray = Uint8Array.from(atob(imageBase64), (char) =>
      char.charCodeAt(0)
    );
    const maskBufferArray = Uint8Array.from(atob(maskBase64), (char) =>
      char.charCodeAt(0)
    );

    // モデルへ渡す入力データ
    const inputs = {
      prompt,
      image: [...imageBufferArray],
      mask: [...maskBufferArray],
      height,
      width,
      num_steps: numSteps,
      guidance,
      strength,
      seed,
    };

    // Cloudflare APIへリクエスト（cURLでの例と同様）
    const response = await makeApiRequest({
      endpoint: "/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting",
      data: JSON.stringify(inputs),
      contentType: "application/json",
    });

    // レスポンスのArrayBufferからUint8Arrayへ変換（生成された画像データ）
    const imageData = new Uint8Array(await response.arrayBuffer());

    // 画像保存処理（実装は環境に合わせて適宜変更してください）
    const filename = `inpainted_image_${Date.now()}.png`;
    const filePath = await saveImage(filename, imageData);

    return c.json({ success: true, path: filePath });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      400
    );
  }
});

Bun.serve({
  fetch: app.fetch,
  port: 8080,
});

export default app;
