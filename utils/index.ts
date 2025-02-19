import { writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { config } from "../constant";

export const saveImage = async (filename: string, data: Uint8Array): Promise<string> => {
  if (!existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
  }

  const filePath = path.join(config.outputDir, filename);
  await writeFile(filePath, data);
  return filePath;
};
