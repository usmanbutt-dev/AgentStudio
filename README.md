# AgentStudio

A spatial mission-control dashboard for orchestrating multiple AI agents visually.

Watch your AI agents work in real-time on an interactive canvas. Tasks flow between agents as visible packets. No more copy-pasting between terminals.

## Features

- **Spatial Canvas** — Agents appear as nodes on an interactive React Flow canvas
- **Multi-Provider** — Claude, GPT, Gemini, Ollama, LM Studio, or any OpenAI-compatible endpoint
- **Structured Communication** — Agents talk in JSON, not paragraphs
- **Workflow Pipelines** — Build reproducible dev workflows (Code Review, Feature Build, Bug Fix)
- **Real-time Streaming** — Watch agent output stream live as they work
- **Approval Gates** — Human-in-the-loop checkpoints before critical steps
- **Decision Logs** — Persistent memory of architectural decisions
- **Cost Tracking** — Track token usage and API costs per agent and task
- **100% Local** — Everything runs on your machine. You bring your own API keys.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/agent-studio.git
cd agent-studio

# Install dependencies
npm install

# Copy environment config and add your API keys
cp .env.example .env

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Flow, Tailwind CSS 4, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | SQLite (via Drizzle ORM) |
| AI SDKs | Anthropic, OpenAI, Google GenAI |

## Project Structure

```
packages/
  shared/    — Types, schemas, constants shared between server and client
  server/    — Express API, Socket.io, orchestration engine, agent adapters
  client/    — React frontend with spatial canvas
```

## License

MIT
