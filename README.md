# Spur Chat Agent — AI Live Chat Support

A production-quality AI-powered customer support chat application built for the Spur Founding Full-Stack Engineer take-home assignment.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Tushar-Pandey-31/spur-chat-agent.git
cd spur-chat-agent
npm install

# 2. Start database
docker compose up -d

# 3. Set up environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY (or ANTHROPIC_API_KEY)

# 4. Run migrations and seed data
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/chat/health

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SvelteKit Frontend                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Chat UI  │  │ Chat Store   │  │    API Client     │  │
│  │(Svelte 5)│  │ ($state)     │  │  (fetch + errors) │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       └───────────────┼───────────────────┘              │
└───────────────────────┼──────────────────────────────────┘
                        │ HTTP (POST /chat/message)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Express Backend (TS)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Routes   │→ │ Services │→ │   LLM Provider       │   │
│  │(validate)│  │(orchestr.)│  │(OpenAI ↔ Anthropic)  │   │
│  └──────────┘  └────┬─────┘  └──────────────────────┘   │
│                     │                                    │
│  ┌──────────────────┼──────────────────────────────────┐ │
│  │            Guardrails Layer                         │ │
│  │  • Input validation (Zod)                           │ │
│  │  • Prompt injection detection                       │ │
│  │  • Output sanitization                              │ │
│  │  • Rate limiting (per-session)                      │ │
│  │  • Graceful degradation (LLM fallbacks)             │ │
│  └──────────────────┼──────────────────────────────────┘ │
│                     │                                    │
│  ┌──────────────────┼──────────────────────────────────┐ │
│  │            Data Layer                               │ │
│  │  • Prisma ORM (PostgreSQL)                          │ │
│  │  • Knowledge Service (RAG-lite: keyword extraction) │ │
│  │  • Conversation Service (sliding window context)    │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │
│  (conversations, │  │  (rate limiting) │
│   messages,  │  │              │
│   knowledge) │  │              │
└──────────────┘  └──────────────┘
```

## Project Structure

```
spur-chat-agent/
├── packages/
│   ├── backend/                 # Express + TypeScript API server
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Knowledge base + sample data
│   │   └── src/
│   │       ├── config/         # Zod-validated env config
│   │       ├── db/             # Prisma client singleton
│   │       ├── guardrails/     # Injection detection, output sanitization
│   │       ├── middleware/     # Error handler, validator, rate limiter
│   │       ├── providers/      # LLM abstraction (OpenAI + Anthropic)
│   │       ├── routes/         # Express routes (thin controllers)
│   │       ├── services/       # Business logic (chat, knowledge, conversation)
│   │       └── utils/          # Error hierarchy, logger
│   ├── frontend/               # SvelteKit + Svelte 5 + Tailwind CSS 4
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api/        # API client with error handling
│   │       │   ├── components/ # ChatWidget, MessageBubble, TypingIndicator
│   │       │   └── stores/     # Svelte 5 rune-based state management
│   │       └── routes/         # Page + layout
│   └── shared/                 # Shared Zod schemas and TypeScript types
├── docker-compose.yml          # PostgreSQL 16 + Redis 7
└── .env.example                # All required env vars documented
```

## Design Decisions

### LLM Provider Abstraction
The LLM integration lives behind a `LLMProvider` interface. OpenAI and Anthropic are swappable implementations selected via `LLM_PROVIDER` env var. This is the pattern I'd use in production — adding a new provider means adding one file and one switch case, not touching the chat service.

### RAG-Like Knowledge Base
FAQ content is stored in the `KnowledgeDocument` database table (not hardcoded in prompts). On each message, the `KnowledgeService` extracts keywords, queries the DB for matching documents, and injects the top 3 results into the system prompt. This is extensible to real vector-based RAG later.

### Conversation Context Management
A sliding window of the last 20 messages is sent to the LLM for context. The full history persists in the database and is retrievable via the history API. Token usage is tracked per message for cost awareness.

### Guardrails Stack
- **Input validation**: Zod schemas validate all requests (message length, format)
- **Prompt injection detection**: Pattern-matching against known injection techniques
- **Output sanitization**: Strips leaked system prompt content, HTML/script tags, enforces length limits
- **Rate limiting**: Per-session rate limiter using express-rate-limit
- **Graceful degradation**: When the LLM fails (timeout, rate limit, auth), the user gets a friendly fallback message instead of an error

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat/message` | Send a message, get AI reply |
| `GET` | `/chat/history/:sessionId` | Retrieve conversation history |
| `GET` | `/chat/health` | Health check |

### POST /chat/message

**Request:**
```json
{
  "message": "What's your return policy?",
  "sessionId": "optional-uuid"
}
```

**Response:**
```json
{
  "reply": "We accept returns within 30 days...",
  "sessionId": "cuid-generated"
}
```

**Errors:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message cannot be empty"
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes* | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | — | Anthropic API key (used if LLM_PROVIDER=anthropic) |
| `LLM_PROVIDER` | No | `openai` | `openai` or `anthropic` |
| `LLM_MODEL` | No | `gpt-4o-mini` | Model name |
| `LLM_MAX_TOKENS` | No | `1024` | Max tokens per response |
| `PORT` | No | `3001` | Backend port |
| `RATE_LIMIT_MAX` | No | `30` | Requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms) |

*Either OPENAI_API_KEY or ANTHROPIC_API_KEY is required depending on LLM_PROVIDER.

## Trade-offs & "If I Had More Time..."

1. **Streaming responses (SSE)**: The architecture supports it — I'd add a `/chat/stream` endpoint that streams tokens as they arrive from the LLM. This makes the UX feel much more responsive.

2. **Redis-backed session caching**: Currently using in-memory rate limiting. With Redis wired up, I'd cache hot conversation context and share rate limit state across instances.

3. **Real RAG with embeddings**: The current keyword-based retrieval works well for FAQs. For a production system, I'd add vector embeddings (using OpenAI's embedding API + pgvector) for semantic search.

4. **Conversation summarization**: For very long conversations, I'd summarize older messages to stay within the LLM context window while preserving key information.

5. **Multi-channel architecture**: The service layer is intentionally channel-agnostic. Adding WhatsApp, Instagram, or live chat channels would mean building channel-specific adapters that call the same `ChatService.handleMessage()`.

6. **Observability**: Add structured logging with request IDs, LLM latency tracking, and token usage dashboards.

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4
- **Backend**: Express.js, TypeScript (strict mode)
- **Database**: PostgreSQL 16 via Prisma ORM
- **Cache**: Redis 7 (rate limiting)
- **LLM**: OpenAI GPT-4o-mini / Anthropic Claude (swappable)
- **Validation**: Zod (env, inputs, shared types)
- **Logging**: Pino (structured, pretty in dev)
- **Security**: Helmet, CORS, rate limiting, prompt injection detection
