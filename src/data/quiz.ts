import type { QuizKey } from "@/lib/submission";

export interface QuizQuestion {
  key: QuizKey;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "question1",
    question: "What is a large language model (LLM)?",
    options: [
      "A database that only stores images",
      "An AI model trained to understand and generate text",
      "A spreadsheet formula for sorting data",
      "A hardware chip used only for gaming",
    ],
    correctAnswer: "An AI model trained to understand and generate text",
  },
  {
    key: "question2",
    question: "What does RAG (Retrieval-Augmented Generation) help an AI system do?",
    options: [
      "Make the model smaller so it runs offline",
      "Replace the need for any prompts",
      "Ground answers in retrieved documents instead of memory alone",
      "Convert speech to music",
    ],
    correctAnswer: "Ground answers in retrieved documents instead of memory alone",
  },
  {
    key: "question3",
    question: "Why are embeddings used in AI applications?",
    options: [
      "To turn text into numbers that capture meaning for search and comparison",
      "To encrypt passwords before login",
      "To compress videos for streaming",
      "To style CSS on a website",
    ],
    correctAnswer: "To turn text into numbers that capture meaning for search and comparison",
  },
  {
    key: "question4",
    question: "What is a prompt in an AI engineering workflow?",
    options: [
      "The bill for cloud GPU usage",
      "The instructions and context you give a model to get a useful response",
      "A backup copy of a dataset",
      "The physical server rack in a data center",
    ],
    correctAnswer: "The instructions and context you give a model to get a useful response",
  },
];
