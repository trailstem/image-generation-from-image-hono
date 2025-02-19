import type { ApiConfig } from "./types";

export const config: ApiConfig = {
  url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`,
  key: process.env.CLOUDFLARE_API_TOKEN!,
  outputDir: process.env.OUTPUT_DIRECTORY || "./generated_images",
};