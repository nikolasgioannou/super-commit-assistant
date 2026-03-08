const MAX_DIFF_CHARS = 8000;

export function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) return diff;

  // Extract file list from diff headers
  const fileHeaders = [...diff.matchAll(/^diff --git a\/.+ b\/(.+)$/gm)].map(
    (m) => m[1],
  );

  const fileList = `Changed files:\n${fileHeaders
    .map((f) => `  - ${f}`)
    .join("\n")}\n\n`;
  const budget = MAX_DIFF_CHARS - fileList.length - 50;
  const truncated = diff.slice(0, Math.max(0, budget));

  return fileList + truncated + "\n\n[diff truncated]";
}

export function buildPrompt(
  diff: string,
  recentCommits: string[],
): { system: string; user: string } {
  const commitHistory =
    recentCommits.length > 0
      ? `Recent commits in this repo:\n${recentCommits
          .map((c) => `  - ${c}`)
          .join("\n")}`
      : "(no commit history yet)";

  const system = [
    "You generate git commit messages. Output ONLY the commit message, no explanations or markdown.",
    "Rules:",
    "- First line: imperative mood, max 72 characters",
    "- Match the naming convention/style of the recent commits (e.g. if they use prefixes like feat:, fix:, chore:, use the same convention)",
    "- If more detail is needed, add a blank line followed by bullet points",
    "- Be concise and specific about what changed and why",
  ].join("\n");

  const user = [commitHistory, "", "Staged diff:", "```", diff, "```"].join(
    "\n",
  );

  return { system, user };
}
