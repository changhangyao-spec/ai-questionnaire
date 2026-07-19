// Vercel Serverless Function — 接收問卷送出，寫入 Supabase
// 環境變數需在 Vercel 控制台設定：
//   SUPABASE_URL        → 你的 Supabase 專案 URL
//   SUPABASE_SERVICE_KEY → Supabase Service Role Key（勿公開）

module.exports = async function handler(req, res) {
  // CORS headers（讓同源呼叫也能通過）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: '伺服器尚未設定資料庫環境變數' });
  }

  try {
    const data = req.body;

    // 將多選陣列轉成逗號分隔字串（Supabase text 欄位）
    const row = {};
    for (const [k, v] of Object.entries(data)) {
      row[k] = Array.isArray(v) ? v.join('、') : v;
    }
    row.submitted_at = new Date().toISOString();

    const url = `${SUPABASE_URL}/rest/v1/survey_responses`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase error:', errText);
      return res.status(500).json({ error: '資料庫寫入失敗', detail: errText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
