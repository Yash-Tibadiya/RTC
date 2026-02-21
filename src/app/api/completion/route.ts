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
      prompt: `You are an AI autocomplete (predictive text) engine for a chat application, similar to Gmail Smart Compose.
    Your sole task is to predict what the user will type next in their CURRENT message.
    
    CRITICAL RULES:
    1. NEVER answer questions, converse, or respond to the user. You are not a chatbot.
    2. ONLY output the continuation of their sentence/thought. 
    3. DO NOT repeat the text the user has already typed. Output ONLY the suffix.
    4. If the message is completely finished and doesn't need to be extended, output an empty string.
    
    Examples:
    Input: Hello, how a -> Output: re you doing today?
    Input: I am going to the sc -> Output: hool.
    Input: What time is -> Output: the meeting?
    Input: Sounds good, see you t -> Output: hen!
    Input: Can you please send the doc -> Output: ument?
    Input: hello, how are you? -> Output:  I hope everything is going well!
    
    Current User Input: ${prompt}`,
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
