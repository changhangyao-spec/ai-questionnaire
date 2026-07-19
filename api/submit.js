// Vercel Serverless Function — 接收問卷送出，寫入 Supabase
// 環境變數需在 Vercel 控制台設定：
//   SUPABASE_URL        → 你的 Supabase 專案 URL
//   SUPABASE_SERVICE_KEY → Supabase Service Role Key（勿公開）

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: '伺服器尚未設定資料庫環境變數' });
  try {
    const data = req.body;
    // ── 伺服器端驗證：確保所有必填欄位都存在且有值 ──
    const REQUIRED_TEXT = ['QA1','QA2','QA3','QA4','QA5','QA6','QA7'];
    const REQUIRED_LIKERT = ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12a','Q12b','Q13','Q14','Q15','Q16','Q17','Q18','Q19a','Q19b','Q20','Q21','Q22','Q23','Q24','Q25','Q26','Q27','Q28','Q29','Q30','Q31','Q32','Q33'];
    const REQUIRED_CHOICE = ['Q34','Q35','Q37','Q38'];
    const missing = [];
    for (const f of REQUIRED_TEXT) { const v=data[f]; if(!v||(Array.isArray(v)?v.length===0:String(v).trim()==='')){missing.push(f);} }
    for (const f of REQUIRED_LIKERT) { const v=data[f]; if(v===undefined||v===null||v===''){missing.push(f);} }
    for (const f of REQUIRED_CHOICE) { const v=data[f]; if(!v||(Array.isArray(v)?v.length===0:String(v).trim()==='')){missing.push(f);} }
    if (missing.length > 0) return res.status(422).json({ error: '問卷填答不完整，請完成所有必填題目後再提交', missing_fields: missing });
    const row = {};
    for (const [k,v] of Object.entries(data)) { row[k]=Array.isArray(v)?v.join('、'):v; }
    row.submitted_at = new Date().toISOString();
    const url = `${SUPABASE_URL}/rest/v1/survey_responses`;
    const response = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json','apikey':SUPABASE_SERVICE_KEY,'Authorization':`Bearer ${SUPABASE_SERVICE_KEY}`,'Prefer':'return=minimal'}, body:JSON.stringify(row) });
    if (!response.ok) { const e=await response.text(); return res.status(500).json({error:'資料庫寫入失敗',detail:e}); }
    return res.status(200).json({ success: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
};
