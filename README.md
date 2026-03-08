# super-commit-assistant

AI-powered git commit message generator. Analyzes your staged changes and recent commit history to generate commit messages that match your project's conventions.

## Install

```bash
npm install -g super-commit-assistant
```

## Usage

Stage your changes, then run:

```bash
git ai
```

On first run, you'll be prompted for an [OpenRouter API key](https://openrouter.ai/keys).

The tool will:

1. Analyze your staged diff and recent commit messages
2. Generate a commit message matching your project's style
3. Let you **[C]ommit**, **[E]dit**, **[R]efine**, or **[A]bort**

**Refine** lets you give the AI natural-language feedback (e.g., "make it shorter", "mention the API change") to regenerate the message. You can refine as many times as you like before committing.

## Configuration

Config is stored at `~/.config/super-commit-assistant/config.json`:

```json
{
  "apiKey": "your-openrouter-api-key",
  "model": "google/gemini-2.0-flash-001"
}
```

The `model` field is optional — defaults to `google/gemini-2.0-flash-001`. You can change it to any model available on [OpenRouter](https://openrouter.ai/models).

## Development

```bash
git clone https://github.com/nikolasgioannou/super-commit-assistant.git
cd super-commit-assistant
npm install
npm run dev        # build and link globally to test as `git ai`
```

## License

MIT
