import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    const { prompt }: { prompt: string } = await req.json();

    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt: `You are a text completion engine for a chat application.
    Your task is to predict and complete the user's input text.
    - If the input ends in the middle of a word, complete that word and potentially the rest of the sentence.
    - If the input is complete, predict the next likely text.
    - Do NOT start a conversation or answer a question.
    - Do NOT repeat the input text.
    - Output ONLY the predicted suffix.
    
    Examples:
    Input: Hello, how a -> Output: re you?
    Input: I am going to the sc -> Output: hool
    Input: What is the wea -> Output: ther like?
    
    Current Input: ${prompt}`,
      onFinish: ({ text }) => {
        console.log("AI Generated:", text);
      },
    });

    return result.toTextStreamResponse();
  } catch (err: any) {
    console.error("API Error in POST /api/completion:", err);
    return new Response(err.message || "Internal Server Error", {
      status: 500,
    });
  }
}
