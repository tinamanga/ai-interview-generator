import { z } from "zod";
import { Type } from "@google/genai";

// This schema defines the exact structure expected from Gemini.
// Zod will validate the response before it reaches the database.
export const generatedQuestionSchema = z.object({
  question: z.string().min(10),
  category: z.string().min(2).max(100),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  evaluationCriteria: z.string().min(10)
}).strict();

// The complete response must contain a questions array.
export const geminiResponseSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1).max(20)
}).strict();

// Gemini uses this schema to produce structured JSON rather than
// unrestricted prose. We still validate the result with Zod above.
export const geminiJsonSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "A clear, relevant interview question."
          },
          category: {
            type: Type.STRING,
            description: "The technical or behavioral skill being assessed."
          },
          difficulty: {
            type: Type.STRING,
            enum: ["EASY", "MEDIUM", "HARD"]
          },
          evaluationCriteria: {
            type: Type.STRING,
            description: "What a strong candidate answer should demonstrate."
          }
        },
        required: [
          "question",
          "category",
          "difficulty",
          "evaluationCriteria"
        ],
        propertyOrdering: [
          "question",
          "category",
          "difficulty",
          "evaluationCriteria"
        ]
      }
    }
  },
  required: ["questions"],
  propertyOrdering: ["questions"]
};
