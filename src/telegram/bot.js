const TelegramBot = require('node-telegram-bot-api');


const TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN) { console.log('[Telegram] TELEGRAM_BOT_TOKEN not set — bot disabled'); }

// ── Labels ────────────────────────────────────────────────────────────────────
const SYSTEMS = [
  { value: 'sistema-01', label: '🔵 Sistema 01 — Lead Engine' },
  { value: 'sistema-02', label: '🟢 Sistema 02 — Conversion Engine' },
  { value: 'sistema-03', label: '🟣 Sistema 03 — Operating System' },
  { value: 'neura',      label: '⚡ NeuraSolutions' },
  { value: 'ai-agents',  label: '🤖 AI Agents' },
  { value: 'crm',        label: '📊 AI CRM' },
  { value: 'rag',        label: '🧠 RAG Knowledge AI' },
  { value: 'ai',         label: '✨ AI Implementation' },
];

const PALETTES = [
  { value: 'navy', label: '🌊 Neura Navy' },
  { value: 'gold', label: '✨ Gold Premium' },
  { value: 'grey', label: '🩶 Grey Premium' },
];

const FORMATS = [
  { value: '1:1_single',    label: '▭ Feed 1:1 — Single' },
  { value: '9:16_single',   label: '📱 Story 9:16 — Single' },
  { value: '1:1_carousel',  label: '▭▭ Feed 1:1 — Carrusel' },
  { value: '9:16_carousel', label: '📱▭ Story 9:16 — Carrusel' },
];

const TONES = [
  { value: 'profesional', label: '💼 Professional' },
  { value: 'urgente',     label: '🔥 Urgent' },
  { value: 'inspirador',  label: '🌟 Inspirational' },
  { value: 'educativo',   label: '📚 Educational' },
];

const STATUS_EMOJI = { draft: '📝', ready: '✅', published: '🚀' };
const SYSTEM_SHORT  = { 'sistema-01':'S01','sistema-02':'S02','sistema-03':'S03','neura':'Neura','ai-agents':'Agents','crm':'CRM','rag':'RAG','ai':'AI' };

// ── Session store ─────────────────────────────────────────────────────────────
const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) sessions.set(chatId, { step: null });
  return sessions.get(chatId);
}

function clearSession(chatId) { sessions.set(chatId, { step: null }); }

// ── Security: only allow your chat ───────────────────────────────────────────
function isAllowed(chatId) {
  if (!CHAT_ID) return true; // open if no CHAT_ID set
  return String(chatId) === String(CHAT_ID);
}

// ── Inline keyboards ─────────────────────────────────────────────────────────
function makeKeyboard(items, cbPrefix, cols = 2) {
  const rows = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols).map(item => ({
      text: item.label,
      callback_data: `${cbPrefix}:${item.value}`,
    })));
  }
  return { inline_keyboard: rows };
}

// ── Build progress message ────────────────────────────────────────────────────
function progressText(steps) {
  const icons = { running: '⏳', done: '✅', skipped: '⚠️', error: '❌' };
  const labels = { copy: 'Copy', image: 'Imagen', carousel: 'Carousel', layout: 'Layout', caption: 'Caption' };
  const order = ['copy', 'image', 'carousel', 'layout', 'caption'];
  return order
    .filter(k => steps[k])
    .map(k => `${icons[steps[k].status] || '⏳'} ${labels[k]}`)
    .join('  ');
}

// ── HTTP helpers (internal API calls) ────────────────────────────────────────
const http = require('http');
function internalRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1',
      port: process.env.PORT || 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function internalPost(path, body)  { return internalRequest('POST',   path, body); }
function internalPatch(path, body) { return internalRequest('PATCH',  path, body); }
function internalDelete(path)      { return internalRequest('DELETE', path); }

function internalGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: process.env.PORT || 3000, path }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
    }).on('error', reject);
  });
}

// ── Generation pipeline (SSE polling) ────────────────────────────────────────
async function generateAndReport(bot, chatId, msgId, session) {
  const { system, palette, format, post_type, tone, brief } = session;

  // Start job
  const { jobId, error } = await internalPost('/api/generate', { brief, system, format, tone, palette, post_type });
  if (error || !jobId) {
    bot.editMessageText('❌ Error al iniciar la generación. Intenta de nuevo.', { chat_id: chatId, message_id: msgId });
    return;
  }

  // Poll SSE via HTTP long-polling fallback (we read the stream line by line)
  let steps = {};
  let postId = null;

  await new Promise((resolve) => {
    const streamReq = http.get(`http://127.0.0.1:${process.env.PORT || 3000}/api/generate/stream/${jobId}`, res => {
      let buffer = '';

      res.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'step') {
              steps[data.step] = { status: data.status };
              const text = `⚙️ *Generando post...*\n\n${progressText(steps)}`;
              bot.editMessageText(text, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown' }).catch(() => {});
            }

            if (data.type === 'complete') {
              postId = data.postId;
              res.destroy();
              resolve();
            }

            if (data.type === 'error') {
              res.destroy();
              resolve();
            }
          } catch { /* skip bad lines */ }
        }
      });

      res.on('end', resolve);
      res.on('error', resolve);
    });

    streamReq.on('error', resolve);
    // Timeout safety: 3 minutes
    setTimeout(resolve, 180000);
  });

  if (!postId) {
    bot.editMessageText('❌ Error en la generación. Revisa los logs del servidor.', { chat_id: chatId, message_id: msgId });
    return;
  }

  // Fetch completed post
  const post = await internalGet(`/api/posts/${postId}`);
  if (!post || !post.id) {
    bot.editMessageText('❌ No se pudo obtener el post generado.', { chat_id: chatId, message_id: msgId });
    return;
  }

  // Delete progress message
  bot.deleteMessage(chatId, msgId).catch(() => {});

  // Send AI background image
  if (post.image_b64) {
    const imgBuffer = Buffer.from(post.image_b64, 'base64');
    await bot.sendPhoto(chatId, imgBuffer, {
      caption: `🎨 *${post.headline || 'Post generado'}*\n_Sistema: ${SYSTEM_SHORT[post.system] || post.system} · Paleta: ${post.palette || 'navy'}_`,
      parse_mode: 'Markdown',
    }).catch(() => {});
  }

  // Build download link
  const appUrl = process.env.APP_URL || 'https://neuracenter.neurasolutions.cloud';
  const downloadLine = post.png_path
    ? `\n🖼 [Descargar PNG completo](${appUrl}/social-posts/${post.png_path})`
    : `\n🌐 [Ver en la app](${appUrl})`;

  // Send caption + hashtags
  const isCarousel = post.post_type === 'carousel';
  const typeLabel  = isCarousel ? '🎠 *Carrusel* · ' : '';
  const captionMsg = post.caption
    ? `${typeLabel}📋 *Caption listo:*\n\n${post.caption}\n\n${post.hashtags || ''}${downloadLine}`
    : `${typeLabel}✅ *Post generado* — ID: \`${post.id}\`${downloadLine}`;

  await bot.sendMessage(chatId, captionMsg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Aprobar', callback_data: `approve:${post.id}` },
        { text: '🚀 Publicado', callback_data: `publish:${post.id}` },
        { text: '🗑 Eliminar', callback_data: `delete:${post.id}` },
      ]],
    },
    disable_web_page_preview: false,
  });
}

// ── Library helper ────────────────────────────────────────────────────────────
async function sendLibrary(bot, chatId, offset = 0) {
  const posts = await internalGet(`/api/posts?limit=8&offset=${offset}`);
  if (!Array.isArray(posts) || posts.length === 0) {
    return bot.sendMessage(chatId, '📭 No hay posts en la librería.');
  }

  const lines = posts.map((p) => {
    const e = STATUS_EMOJI[p.status] || '📝';
    const sys = SYSTEM_SHORT[p.system] || p.system;
    const type = p.post_type === 'carousel' ? ' 🎠' : '';
    return `${e} \`${p.id}\` *${(p.headline || 'Sin título').slice(0, 40)}*\n   _${sys}${type} · ${p.status}_`;
  });

  const keyboard = {
    inline_keyboard: [
      ...posts.map(p => [{
        text: `#${p.id} ${(p.headline || 'Post').slice(0, 25)}`,
        callback_data: `viewpost:${p.id}`,
      }]),
      offset > 0 ? [{ text: '◀ Anterior', callback_data: `lib:${offset - 8}` }] : [],
      posts.length === 8 ? [{ text: 'Siguiente ▶', callback_data: `lib:${offset + 8}` }] : [],
    ].filter(r => r.length > 0),
  };

  bot.sendMessage(chatId, `📚 *Post Library* _(${posts.length} posts)_\n\n${lines.join('\n\n')}`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

// ── Main bot init ─────────────────────────────────────────────────────────────
function initBot() {
  if (!TOKEN) return null;

  const bot = new TelegramBot(TOKEN, { polling: true });
  console.log('[Telegram] Bot started ✓');

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.onText(/\/start/, (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    bot.sendMessage(msg.chat.id,
      `👋 *Neura Command Center Bot*\n\n` +
      `Comandos disponibles:\n` +
      `• /generar — Crear un nuevo post\n` +
      `• /libreria — Ver posts guardados\n` +
      `• /cancelar — Cancelar operación actual`,
      { parse_mode: 'Markdown' }
    );
  });

  // ── /generar ─────────────────────────────────────────────────────────────────
  bot.onText(/\/generar/, (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    const s = getSession(msg.chat.id);
    s.step = 'system';
    bot.sendMessage(msg.chat.id, '🧠 *Selecciona el sistema:*', {
      parse_mode: 'Markdown',
      reply_markup: makeKeyboard(SYSTEMS, 'sys', 2),
    });
  });

  // ── /libreria ────────────────────────────────────────────────────────────────
  bot.onText(/\/libreria/, (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    sendLibrary(bot, msg.chat.id, 0);
  });

  // ── /cancelar ────────────────────────────────────────────────────────────────
  bot.onText(/\/cancelar/, (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    clearSession(msg.chat.id);
    bot.sendMessage(msg.chat.id, '❌ Operación cancelada.');
  });

  // ── Callback query handler ───────────────────────────────────────────────────
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    if (!isAllowed(chatId)) return;

    const [action, value] = query.data.split(':');
    const s = getSession(chatId);
    bot.answerCallbackQuery(query.id);

    // ── Generation flow ───────────────────────────────────────────────────────
    if (action === 'sys') {
      s.system = value;
      s.step = 'palette';
      bot.editMessageText('🎨 *Selecciona la paleta de colores:*', {
        chat_id: chatId, message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: makeKeyboard(PALETTES, 'pal', 3),
      });
    }

    else if (action === 'pal') {
      s.palette = value;
      s.step = 'format';
      bot.editMessageText('📐 *Formato y tipo de post:*', {
        chat_id: chatId, message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: makeKeyboard(FORMATS, 'fmt', 2),
      });
    }

    else if (action === 'fmt') {
      const [fmt, type] = value.split('_');
      s.format    = fmt;
      s.post_type = type;
      s.step = 'tone';
      bot.editMessageText('💬 *Selecciona el tono:*', {
        chat_id: chatId, message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: makeKeyboard(TONES, 'tone', 2),
      });
    }

    else if (action === 'tone') {
      s.tone = value;
      s.step = 'brief';
      const sysLabel = SYSTEMS.find(x => x.value === s.system)?.label || s.system;
      const palLabel = PALETTES.find(x => x.value === s.palette)?.label || s.palette;
      const fmtLabel = FORMATS.find(x => x.value === `${s.format}_${s.post_type}`)?.label || s.format;
      bot.editMessageText(
        `✏️ *Escribe el brief del post:*\n\n` +
        `_${sysLabel}_\n_${palLabel} · ${fmtLabel}_\n\n` +
        `Describe la idea, audiencia, mensaje clave...`,
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }
      );
    }

    // ── Library navigation ────────────────────────────────────────────────────
    else if (action === 'lib') {
      sendLibrary(bot, chatId, parseInt(value) || 0);
    }

    // ── View single post ──────────────────────────────────────────────────────
    else if (action === 'viewpost') {
      const post = await internalGet(`/api/posts/${value}`);
      if (!post?.id) return bot.sendMessage(chatId, '❌ Post no encontrado.');

      const appUrl  = process.env.APP_URL || 'https://neuracenter.neurasolutions.cloud';
      const dlLine  = post.png_path ? `\n🖼 [PNG](${appUrl}/social-posts/${post.png_path})` : '';
      const sys     = SYSTEM_SHORT[post.system] || post.system;
      const e       = STATUS_EMOJI[post.status] || '📝';
      const typeTag = post.post_type === 'carousel' ? ' 🎠' : '';

      const text = `${e} *${post.headline || 'Post'}*\n` +
        `_${sys}${typeTag} · ${post.status} · ${post.palette || 'navy'}_\n\n` +
        (post.caption ? post.caption.slice(0, 600) + (post.caption.length > 600 ? '...' : '') : '') +
        dlLine;

      if (post.image_b64) {
        bot.sendPhoto(chatId, Buffer.from(post.image_b64, 'base64'), {
          caption: text.slice(0, 1024),
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[
            { text: '✅ Aprobar', callback_data: `approve:${post.id}` },
            { text: '🚀 Publicado', callback_data: `publish:${post.id}` },
            { text: '🗑 Eliminar', callback_data: `delete:${post.id}` },
          ]]},
        });
      } else {
        bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[
            { text: '✅ Aprobar', callback_data: `approve:${post.id}` },
            { text: '🚀 Publicado', callback_data: `publish:${post.id}` },
            { text: '🗑 Eliminar', callback_data: `delete:${post.id}` },
          ]]},
          disable_web_page_preview: true,
        });
      }
    }

    // ── Status actions ────────────────────────────────────────────────────────
    else if (action === 'approve') {
      await internalPatch(`/api/posts/${value}`, { status: 'ready' });
      bot.editMessageReplyMarkup({ inline_keyboard: [[
        { text: '✅ Aprobado', callback_data: 'noop' },
        { text: '🚀 Publicado', callback_data: `publish:${value}` },
        { text: '🗑 Eliminar', callback_data: `delete:${value}` },
      ]]}, { chat_id: chatId, message_id: query.message.message_id }).catch(() => {});
    }

    else if (action === 'publish') {
      await internalPatch(`/api/posts/${value}`, { status: 'published' });
      bot.editMessageReplyMarkup({ inline_keyboard: [[
        { text: '🚀 Publicado ✓', callback_data: 'noop' },
        { text: '🗑 Eliminar', callback_data: `delete:${value}` },
      ]]}, { chat_id: chatId, message_id: query.message.message_id }).catch(() => {});
    }

    else if (action === 'delete') {
      await internalDelete(`/api/posts/${value}`);
      bot.editMessageReplyMarkup({ inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }).catch(() => {});
      bot.sendMessage(chatId, `🗑 Post #${value} eliminado.`);
    }

    else if (action === 'noop') { /* button disabled, do nothing */ }
  });

  // ── Text message handler (brief input) ───────────────────────────────────────
  bot.on('message', async (msg) => {
    if (!isAllowed(msg.chat.id)) return;
    if (msg.text?.startsWith('/')) return; // handled by onText

    const chatId = msg.chat.id;
    const s = getSession(chatId);

    if (s.step !== 'brief') return;

    s.brief = msg.text;
    clearSession(chatId);

    // Send progress message
    const sentMsg = await bot.sendMessage(chatId, '⚙️ *Generando post...*', { parse_mode: 'Markdown' });

    await generateAndReport(bot, chatId, sentMsg.message_id, s);
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  bot.on('polling_error', (err) => {
    console.error('[Telegram] Polling error:', err.code, err.message);
  });

  return bot;
}

// ── Notification helper (call from elsewhere to push alerts) ─────────────────
let _bot = null;

function getBot() { return _bot; }

function notify(text, options = {}) {
  if (!_bot || !CHAT_ID) return;
  _bot.sendMessage(CHAT_ID, text, { parse_mode: 'Markdown', ...options }).catch(() => {});
}

function startBot() {
  if (!TOKEN) return;
  _bot = initBot();
}

module.exports = { startBot, getBot, notify };
