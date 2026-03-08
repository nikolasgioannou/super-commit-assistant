#!/usr/bin/env node

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execSync } from "node:child_process";
import {
  isInsideGitRepo,
  hasStagedChanges,
  getStagedDiff,
  getRecentCommits,
  commit,
} from "./git.js";
import { loadConfig } from "./config.js";
import { truncateDiff, buildPrompt } from "./prompt.js";
import { generateCommitMessage, type Message } from "./api.js";
import { ask, showSpinner, printMessage, RED, RESET, DIM } from "./ui.js";

// Clean exit on Ctrl+C
process.on("SIGINT", () => {
  process.stderr.write("\n");
  process.exit(130);
});

async function main(): Promise<void> {
  // 1. Check git repo
  if (!isInsideGitRepo()) {
    process.stderr.write(`${RED}Not inside a git repository.${RESET}\n`);
    process.exit(1);
  }

  // 2. Check staged changes
  if (!hasStagedChanges()) {
    process.stderr.write(
      `${RED}No staged changes.${RESET} ${DIM}Stage files with \`git add\` first.${RESET}\n`,
    );
    process.exit(1);
  }

  // 3. Load config
  const config = await loadConfig();

  // 4. Get diff and recent commits
  const diff = getStagedDiff();
  const recentCommits = getRecentCommits(10);

  // 5. Build prompt
  const truncatedDiff = truncateDiff(diff);
  const { system, user } = buildPrompt(truncatedDiff, recentCommits);

  // 6. Call API
  const spinner = showSpinner("Generating commit message...");
  let message: string;
  try {
    message = await generateCommitMessage(
      config.apiKey,
      system,
      user,
      config.model,
    );
  } catch (err) {
    spinner.stop();
    process.stderr.write(
      `${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  }
  spinner.stop();

  // 7. Display and prompt (loop to allow refinement)
  const conversation: Message[] = [
    { role: "system", content: system },
    { role: "user", content: user },
    { role: "assistant", content: message },
  ];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    printMessage(message);
    const choice = await ask(
      `${DIM}[${RESET}C${DIM}]ommit  [${RESET}E${DIM}]dit  [${RESET}R${DIM}]efine  [${RESET}A${DIM}]bort${RESET} (C): `,
    );

    const action = (choice || "c").toLowerCase();

    if (action === "a") {
      process.stderr.write("Aborted.\n");
      process.exit(0);
    }

    if (action === "r") {
      const feedback = await ask(`${DIM}Refinement instruction:${RESET} `);
      if (!feedback.trim()) {
        continue;
      }
      conversation.push({ role: "user", content: feedback });
      const refineSpinner = showSpinner("Refining commit message...");
      try {
        message = await generateCommitMessage(
          config.apiKey,
          system,
          user,
          config.model,
          conversation,
        );
      } catch (err) {
        refineSpinner.stop();
        process.stderr.write(
          `${err instanceof Error ? err.message : String(err)}\n`,
        );
        process.exit(1);
      }
      refineSpinner.stop();
      conversation.push({ role: "assistant", content: message });
      continue;
    }

    if (action === "e") {
      // Open editor with temp file
      const tmpFile = path.join(os.tmpdir(), `commit-msg-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, message);
      const editor = process.env.EDITOR || "vi";
      try {
        execSync(`${editor} ${tmpFile}`, { stdio: "inherit" });
        message = fs.readFileSync(tmpFile, "utf-8").trim();
      } finally {
        fs.unlinkSync(tmpFile);
      }
      if (!message) {
        process.stderr.write("Empty message. Aborted.\n");
        process.exit(1);
      }
    }

    break;
  }

  // 8. Commit
  try {
    commit(message);
  } catch {
    process.exit(1);
  }
}

main();
