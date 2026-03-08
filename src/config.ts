import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { ask, YELLOW, RESET, DIM } from "./ui.js";

export interface Config {
  apiKey: string;
  model?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "super-commit-assistant");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<Config> {
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config: Config = JSON.parse(data);
    if (config.apiKey) return config;
  } catch {
    // config doesn't exist or is invalid
  }

  process.stderr.write(
    `\n${YELLOW}No API key found.${RESET}\n` +
      `${DIM}Get one at https://openrouter.ai/keys${RESET}\n\n`,
  );
  const apiKey = await ask("Enter your OpenRouter API key: ");
  if (!apiKey) {
    process.stderr.write("API key is required.\n");
    process.exit(1);
  }

  const config: Config = { apiKey };
  saveConfig(config);
  return config;
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}
