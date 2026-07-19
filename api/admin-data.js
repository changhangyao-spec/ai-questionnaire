// api/admin-data.js — 後台查詢／刪除端點（需帶 ?pwd=... 驗證）
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const ADMIN_PWD = process.env.ADMIN_PASSWORD || 'research2025';
  const { pwd, limit = '500', offset = '0', id } = req.query;
  if (pwd !== ADMIN_PWD) return res.status(401).json({ error: '密碼錯誤' });
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: '伺服器環境變數未設定' });
  if (req.method === 'DELETE') {
    if (!id || isNaN(Number(id))) return res.status(400).json({ error: '請提供有效的 id 參數' });
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Prefer': 'return=minimal' },
    });
    if (!delRes.ok) { const err = await delRes.text(); return res.status(500).json({ error: '刪除失敗', detail: err }); }
    return res.status(200).json({ success: true, deleted_id: Number(id) });
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const url = `${SUPABASE_URL}/rest/v1/survey_responses?select=*&order=submitted_at.desc&limit=${limit}&offset=${offset}`;
    const response = await fetch(url, { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' } });
    if (!response.ok) { const err = await response.text(); return res.status(500).json({ error: '資料庫查詢失敗', detail: err }); }
    const rows = await response.json();
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/survey_responses?select=count`, {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Prefer': 'count=exact' },
    });
    const total = countRes.headers.get('content-range')?.split('/')[1] || rows.length;
    return res.status(200).json({ rows, total: Number(total) });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
