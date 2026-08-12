import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY!);
  // No baseUrl specified here
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { baseUrl: process.env.EXPO_PUBLIC_GEMINI_API_BASE });
  const result = await model.generateContent("Say hello");
  console.log(result.response.text());
}
main().catch(console.error);
