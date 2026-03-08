import { RED, RESET, DIM } from "./ui.js";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateCommitMessage(
  apiKey: string,
  system: string,
  user: string,
  model?: string,
  messages?: Message[],
): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model ?? DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 200,
      messages: messages ?? [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error(
        `${RED}Invalid API key.${RESET} ${DIM}Delete ~/.config/super-commit-assistant/config.json and try again.${RESET}`,
      );
    }
    if (res.status === 429) {
      throw new Error(`${RED}Rate limited.${RESET} Please wait and try again.`);
    }
    throw new Error(
      `${RED}API error (${res.status}):${RESET} ${body || res.statusText}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${RED}Empty response from API.${RESET}`);
  }
  return content;
}
