export type ApiConfig = {
  url: string;
  key: string;
  outputDir: string;
};

export type ApiRequestParams = {
  endpoint: string;
  data: BodyInit | null;
  contentType: string;
};

export type ClassificationResult = {
  label: string;
  score: number;
};

export type ApiResponse = {
  result: ClassificationResult[];
  success: boolean;
  errors: string[];
  messages: string[];
};

export type ApiEndpoint =
  | "/@cf/lykon/dreamshaper-8-lcm"
  | "/@cf/microsoft/resnet-50"
  | "/@cf/facebook/bart-large-cnn";

export type ImageGenerationParams = {
  prompt: string;
  height: number;
  width: number;
  numSteps: number;
  guidance: number;
};

type ImageGenerationRequestData = {
  prompt: string;
  negative_prompt: string;
  height: number;
  width: number;
  num_steps: number;
  guidance: number;
};

export type TextSummarizationParams = {
  text: string; // 要約対象のテキスト
  maxLength?: number; // 要約結果の最大トークン数（オプショナル、デフォルトは1024）
};

export type CloudflareSummaryResponse = {
  result: {
    summary: string;
  };
  success: boolean;
  errors: string[];
  messages: string[];
};
