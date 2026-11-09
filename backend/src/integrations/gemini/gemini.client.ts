import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,

      // Prevent requests from waiting indefinitely.
      httpOptions: {
        timeout: 20_000
      }
    });
  }

  return geminiClient;
}
