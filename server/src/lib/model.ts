import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOllama } from "@langchain/ollama";
import "dotenv/config";

const IS_TESTING = true;

export const getModel = (
  outputSchema?: any,
  temperature: number = 0.3,
): any => {
  if (IS_TESTING) {
    const model = new ChatOllama({
      model: "llama3.1",
      temperature,
    });

    return outputSchema ? model.withStructuredOutput(outputSchema) : model;
  }

  const model = new ChatMistralAI({
    model: "mistral-small-latest",
    temperature,
  });

  return outputSchema ? model.withStructuredOutput(outputSchema) : model;
};
