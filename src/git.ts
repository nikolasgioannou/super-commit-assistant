import { execSync } from "node:child_process";

export function isInsideGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

export function hasStagedChanges(): boolean {
  try {
    execSync("git diff --cached --quiet", { stdio: ["pipe", "pipe", "pipe"] });
    return false; // exit 0 means no changes
  } catch {
    return true; // exit 1 means there are changes
  }
}

export function getStagedDiff(): string {
  return execSync("git diff --cached", { encoding: "utf-8" });
}

export function getRecentCommits(n: number): string[] {
  try {
    const output = execSync(`git log --format=%s -n ${n}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function commit(message: string): void {
  execSync("git commit -F -", {
    input: message,
    encoding: "utf-8",
    stdio: ["pipe", "inherit", "inherit"],
  });
}
