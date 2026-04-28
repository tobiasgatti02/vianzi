import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [{ role: "user", content: "Decí hola" }]
});

console.log(response.choices[0].message.content);
