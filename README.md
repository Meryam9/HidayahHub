# HidayahHub — Quran & Hadith Semantic Intelligence Platform

> AI-powered semantic search over 39,000+ Quranic verses and Hadith  
> Built with FastAPI · FAISS · SentenceTransformers · React · Claude AI

---

## Project Structure

```
hidayahhub/
├── backend/                    ← Python FastAPI server
│   ├── main.py                 ← FastAPI app (all endpoints)
│   ├── generate_embeddings.py  ← One-time embedding generation
│   ├── requirements.txt        ← Python dependencies
│   └── Data/
│       ├── final_dataset.csv   ← Your dataset (copy here)
│       ├── quran_hadith.index  ← FAISS index (generated)
│       └── metadata.pkl        ← Metadata pickle (generated)
│
└── frontend/                   ← React app
    ├── package.json
    ├── public/index.html
    └── src/
        ├── index.js
        └── App.jsx             ← Full app (all pages, AI features)
```

---
## Live Demo
https://hidaayahhub.netlify.app/

## Setup — Step by Step

### Step 1: Copy Data Files

Copy your data files into `backend/Data/`:
```
backend/Data/final_dataset.csv
backend/Data/quran_hadith.index
backend/Data/metadata.pkl
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate embeddings (only once — takes 5–15 min on CPU)
# Only needed if you don't have quran_hadith.index + metadata.pkl
python generate_embeddings.py

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

Backend will be live at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### Step 3: Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start React dev server
npm start
```

Frontend will be live at: http://localhost:3000

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check + stats |
| GET | `/search?query=...&filter=All&top_k=10` | Semantic search |
| GET | `/mood/{mood}` | Mood-based guidance |
| GET | `/similar/{id}` | Find similar verses |
| GET | `/journey?query=...` | 4-step spiritual journey |
| GET | `/daily` | Random daily ayah + related hadith |
| GET | `/topics` | List all topics |
| GET | `/topic/{name}` | Search by topic |
| GET | `/stats` | Dataset statistics |
| GET | `/suggest?q=...` | Topic suggestions |

---

## AI Features (Claude API)

The frontend calls the Anthropic API directly for:

- **Why This Result?** — Explains semantic relevance
- **AI Tafseer** — Scholar-level verse explanation
- **Mood Detection** — Auto-detects emotion from search query
- **Query Expansion** — Suggests related Islamic search queries
- **AI Spiritual Reflection** — Personalised reflection from saved collection

The API key is handled by the claude.ai artifact environment.  
To run standalone, add your key to the fetch headers in `App.jsx`:
```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": "YOUR_ANTHROPIC_API_KEY",
  "anthropic-version": "2023-06-01"
}
```

---

## Tech Stack

**Backend**
- FastAPI — REST API framework
- FAISS — Vector similarity search (384D cosine)
- SentenceTransformers — `all-MiniLM-L6-v2` embedding model
- Pandas — Dataset handling
- Pickle — Metadata storage

**Frontend**
- React 18 — UI framework
- CSS-in-JS (inline `<style>`) — No extra CSS files needed
- Google Fonts — Noto Naskh Arabic, Playfair Display, DM Sans

**AI / NLP**
- Anthropic Claude API — Tafseer, mood detection, reflection
- SentenceTransformers — Semantic embeddings
- FAISS IndexFlatIP — Inner product (cosine) similarity

**Audio**
- EveryAyah.com — Free Quran audio (Mishary Rashid Alafasy, no API key needed)

---

## Available Moods

`anxious` · `sad` · `grateful` · `lost` · `hopeful` · `angry` · `lonely` · `motivated` · `sinful` · `stressed`

## Available Topics

patience · gratitude · forgiveness · knowledge · tawakkul · prayer · character · hope · family · repentance · hardship · afterlife · charity · justice · love

---

## Notes

- The FAISS index must be built **before** running the server
- Embedding generation takes ~5–15 minutes on CPU (one-time only)
- The model (`all-MiniLM-L6-v2`) is ~90MB and auto-downloads on first run
- Audio only works for Quran ayaat with a valid surah:ayah reference 
