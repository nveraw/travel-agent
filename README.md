# ✈️ Travel Agent AI

An AI-powered travel itinerary generator built with React, Express, and Mistral AI. Uses a multi-step chain to resolve destinations, generate world data, and stream personalized itineraries.

https://travel-agent-nveraw.vercel.app/

---

## Project Structure

```
travel-agent/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # TravelForm, TravelItinerary
│       ├── hooks/        # useAutoResizeTextarea
│       └── App.tsx
├── server/               # Express backend
│   └── src/
│       ├── chains/       # AI chains (resolver, fakeData, itinerary)
│       ├── routes/       # travel.ts
│       └── index.ts
├── package.json          # Root workspace config
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm 8+
- Mistral AI API key

### Install

```bash
# Install all dependencies (root + client + server)
npm run install:all
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

---

## Development

```bash
# Run client and server concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Production

```bash
# Build client and server
npm run build

# Start the server
npm run start
```

---

## API Endpoints

### `POST /api/travel`

Streams a personalized travel itinerary using Server-Sent Events (SSE).

**Request Body**
```json
{
  "message": "I want to travel to Japan in spring",
  "sessionId": "uuid-string"
}
```

**SSE Event Types**

| Type | Description |
|------|-------------|
| `status` | Loading status message |
| `chunk` | Streamed itinerary text chunk |
| `clarify` | Clarifying question if destination is too vague |
| `done` | Stream complete |
| `error` | Error message |

**Example**
```bash
curl -X POST http://localhost:3001/api/travel \
  -H "Content-Type: application/json" \
  -d '{"message": "winter trip to asia", "sessionId": "abc-123"}'
```

---

## AI Chain

```
User query
  → Resolver        (picks top destination candidates)
  → Data Generator  (generates world data for top candidate)
  → Itinerary       (streams personalized itinerary via SSE)
```
