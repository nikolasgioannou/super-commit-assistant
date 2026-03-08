import * as readline from "node:readline";

export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const CYAN = "\x1b[36m";
export const RESET = "\x1b[0m";

export function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function showSpinner(text: string): { stop: () => void } {
  let i = 0;
  const timer = setInterval(() => {
    process.stderr.write(
      `\r${CYAN}${BRAILLE[i % BRAILLE.length]}${RESET} ${text}`,
    );
    i++;
  }, 80);

  return {
    stop() {
      clearInterval(timer);
      process.stderr.write(`\r${"".padEnd(text.length + 4)}\r`);
    },
  };
}

export function printMessage(msg: string): void {
  process.stderr.write(`\n${GREEN}${BOLD}Generated commit message:${RESET}\n`);
  process.stderr.write(`${DIM}─────────────────────────${RESET}\n`);
  process.stderr.write(`${msg}\n`);
  process.stderr.write(`${DIM}─────────────────────────${RESET}\n\n`);
}
