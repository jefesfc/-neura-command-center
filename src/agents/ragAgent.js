const OpenAI = require('openai');
const axios = require('axios');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Query NeuraSolutions RAG v4 (Pinecone) for context relevant to the brief.
 * Returns a string of relevant chunks or null if unavailable / no results.
 *
 * Required env vars:
 *   PINECONE_API_KEY   — Pinecone API key
 *   PINECONE_INDEX_HOST — Full index host URL, e.g. https://xxx.svc.aped-xxx.pinecone.io
 *
 * Optional:
 *   PINECONE_NAMESPACE  — Pinecone namespace (default: '')
 *   PINECONE_TOP_K      — Number of results to retrieve (default: 5)
 */
async function queryRAG(queryText) {
  const indexHost = process.env.PINECONE_INDEX_HOST;
  const apiKey    = process.env.PINECONE_API_KEY;

  if (!indexHost || !apiKey) return null;

  try {
    // 1. Embed the query
    const embedResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: queryText,
    });
    const vector = embedResponse.data[0].embedding;

    // 2. Query Pinecone
    const topK      = parseInt(process.env.PINECONE_TOP_K || '5', 10);
    const namespace = process.env.PINECONE_NAMESPACE || '';

    const response = await axios.post(
      `${indexHost}/query`,
      { vector, topK, includeMetadata: true, namespace },
      {
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const matches = (response.data.matches || []).filter(m => m.score > 0.40);
    if (matches.length === 0) return null;

    // 3. Assemble context — support common metadata key names
    const context = matches
      .map(m => m.metadata?.text || m.metadata?.content || m.metadata?.chunk || '')
      .filter(Boolean)
      .join('\n\n---\n\n');

    return context || null;
  } catch (err) {
    console.error('[RAG] Query failed:', err.message);
    return null; // always graceful — never block generation
  }
}

module.exports = { queryRAG };
