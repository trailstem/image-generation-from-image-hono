import { config } from "../constant";
import type {
  ApiRequestParams,
  CloudflareSummaryResponse,
  ImageGenerationParams,
  TextSummarizationParams,
} from "../types";

export const makeApiRequest = async ({
  endpoint,
  data,
  contentType,
}: ApiRequestParams): Promise<Response> => {
  const response = await fetch(`${config.url}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": contentType,
    },
    body: data,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response;
};

export const generateImage = async (
  params: ImageGenerationParams
): Promise<Uint8Array> => {
  const response = await makeApiRequest({
    endpoint: "/@cf/lykon/dreamshaper-8-lcm",
    data: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: "blurry, low quality",
      height: params.height,
      width: params.width,
      num_steps: params.numSteps,
      guidance: params.guidance,
    }),
    contentType: "application/json",
  });

  return new Uint8Array(await response.arrayBuffer());
};

export const classifyImage = async (
  imageData: Uint8Array
): Promise<Response> => {
  const response = await makeApiRequest({
    endpoint: "/@cf/microsoft/resnet-50",
    data: imageData,
    contentType: "application/octet-stream",
  });

  return response;
};

export const summarizeText = async (
  params: TextSummarizationParams
): Promise<CloudflareSummaryResponse> => {
  const response = await makeApiRequest({
    endpoint: "/@cf/facebook/bart-large-cnn",
    data: JSON.stringify({
      input_text: params.text,
      max_length: params.maxLength || 1024,
    }),
    contentType: "application/json",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${errorText}`);
  }

  return response.json();
};
