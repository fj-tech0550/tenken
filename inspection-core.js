/*!
 * inspection-core.js  v2.0.0  (2026/11/17)
 * 空調機点検アプリ 共通モジュール
 *   - WEBアプリ（GitHub Pages / index.html）と kintone（test_popup6.js / group_list.js）の両方で読み込む
 *   - フォーム定義・入力進捗の計算・飽和温度・自動診断・入力画面の描画をここ1か所で管理する
 *   - 入力進捗の定義を変える時は GAS の PROGRESS_FIELDS / NA_MAP も同じにすること
 */
(function (global) {
  'use strict';
  if (global.InspCore) return;
  const C = {};
  C.VERSION = '2.0.0';

  // ───────── フィールド定義 ─────────
  C.LBL = {
    系統:'系統', 型式:'型式', 製造番号:'製造番号', 冷媒種:'冷媒種',
    高圧圧力:'高圧圧力', 低圧圧力:'低圧圧力', 高圧飽和温度:'高圧飽和温度', 低圧飽和温度:'低圧飽和温度',
    吐出管温度:'吐出管温度', 吸入管温度:'吸入管温度', 膨張弁入口温度:'膨張弁入口温度', 膨張弁出口温度:'膨張弁出口温度',
    室外吸込温度:'室外吸込温度', 室外吹出温度:'室外吹出温度',
    総合電圧:'総合電圧', 総合電流:'総合電流', 圧縮機_INV:'圧縮機 INV', 圧縮機_STD1:'圧縮機 STD1', 圧縮機_STD2:'圧縮機 STD2',
    FAN1:'FAN1', FAN2:'FAN2', 絶縁:'絶縁抵抗', 冷温水入口温度:'冷温水入口温度', 冷温水出口温度:'冷温水出口温度'
  };
  // 入力進捗の母数（19項目）
  C.PF = ['型式','製造番号','冷媒種','高圧圧力','低圧圧力','吐出管温度','吸入管温度','膨張弁入口温度','膨張弁出口温度',
          '室外吸込温度','室外吹出温度','総合電圧','総合電流','圧縮機_INV','圧縮機_STD1','圧縮機_STD2','FAN1','FAN2','絶縁'];
  // チェックボックス「対象外項目」の選択肢 ⇔ フィールドコード
  C.NA_MAP = { INV:'圧縮機_INV', STD1:'圧縮機_STD1', STD2:'圧縮機_STD2', FAN1:'FAN1', FAN2:'FAN2' };
  C.NA_OPT = {}; Object.keys(C.NA_MAP).forEach(k => { C.NA_OPT[C.NA_MAP[k]] = k; });

  C.TEXT_FIELDS   = ['系統','型式','製造番号','備考'];
  C.NUM_FIELDS    = ['高圧圧力','低圧圧力','高圧飽和温度','低圧飽和温度','吐出管温度','吸入管温度','膨張弁入口温度','膨張弁出口温度',
                     '室外吸込温度','室外吹出温度','総合電圧','総合電流','圧縮機_INV','圧縮機_STD1','圧縮機_STD2','FAN1','FAN2','絶縁',
                     '冷温水入口温度','冷温水出口温度'];   // 冷温水はチラー等のみ使うため入力進捗（19項目）には含めない
  C.SELECT_FIELDS = ['冷媒種','報告書へ掲載する情報'];
  C.CALC_FIELDS   = ['高圧飽和温度','低圧飽和温度'];

  // kintone アプリ132 のドロップダウン選択肢と一致させる
  C.REFS          = ['R22','R32','R407C','R410A','その他'];
  C.REPORT_OPTS   = ['自動診断','備考内容','どちらも'];
  C.INSPECT_TYPES = ['定期点検(フロン排出抑制法)','定期点検(1年)','簡易点検','データ測定','その他'];

  // サブテーブル「室内機データ」
  C.IU = { table:'室内機データ', 型式:'室内機型式', 製造番号:'室内機製造番号', 吸込:'吸込温度', 吹出:'吹出温度', 備考:'室内機備考' };
  const IU_KEYS = ['型式','製造番号','吸込','吹出','備考'];
  const IU_TYPE = { 型式:'SINGLE_LINE_TEXT', 製造番号:'SINGLE_LINE_TEXT', 吸込:'NUMBER', 吹出:'NUMBER', 備考:'SINGLE_LINE_TEXT' };

  // 目視点検（ラジオボタン 有/無、初期値 無。有のときだけ備考を表示）[項目コード, 備考コード, 表示名]
  C.VISUAL = [
    ['異常運転音・異常振動の有無',     '目視1備考', '異常運転音・異常振動'],
    ['外観の損傷の有無',               '目視2備考', '外観の損傷'],
    ['摩耗・腐食及び錆びその他の劣化', '目視3備考', '摩耗・腐食・錆び等の劣化'],
    ['熱交換器への霜の付着',           '目視4備考', '熱交換器への霜の付着']
  ];
  C.visualCount = m => C.VISUAL.filter(x => m.v[x[0]] === '有').length;

  // 写真（添付ファイルフィールド。1フィールド＝1枠）
  C.PHOTO_FIELDS = ['添付ファイル', '添付ファイル_0', '添付ファイル_1'];
  C.PHOTO_ENABLED = false;   // WEBアプリで true にする（kintone ポップアップは kintone 標準の添付欄を使う）
  C.photoHooks = null;       // { upload(file) → Promise<{fileKey,name,contentType,size,_src}>, thumb(fileKey) → Promise<src>, error(msg) }
  const isImg = f => (!f.contentType && !f.name) || /^image\//.test(f.contentType || '') || /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name || '');
  C.isImageFile = isImg;

  C.SECTIONS = [
    { k:'basic',  t:'基本情報',       ic:'📋', c:'blue',   chip:'基本',   rows:['系統','型式','製造番号','冷媒種'] },
    { k:'press',  t:'圧力・飽和温度', ic:'🔴', c:'red',    chip:'圧力',   cells:[['高圧圧力','MPa'],['高圧飽和温度','℃',1],['低圧圧力','MPa'],['低圧飽和温度','℃',1]] },
    { k:'pipe',   t:'管温度',         ic:'🌡', c:'green',  chip:'管温度', cells:[['吐出管温度','℃'],['吸入管温度','℃'],['膨張弁入口温度','℃'],['膨張弁出口温度','℃'],['室外吸込温度','℃'],['室外吹出温度','℃'],['冷温水入口温度','℃'],['冷温水出口温度','℃']] },
    { k:'elec',   t:'電気系',         ic:'⚡', c:'purple', chip:'電気',   cells:[['総合電圧','V'],['総合電流','A'],['圧縮機_INV','A'],['圧縮機_STD1','A'],['圧縮機_STD2','A'],['FAN1','A'],['FAN2','A'],['絶縁','MΩ']] },
    { k:'visual', t:'目視点検',       ic:'👀', c:'orange', chip:'目視' },
    { k:'indoor', t:'室内機',         ic:'❄', c:'teal',   chip:'室内機' },
    { k:'photo',  t:'写真',           ic:'📷', c:'gray',   chip:'写真' },     // WEBアプリのみ（C.PHOTO_ENABLED = true の時）
    { k:'diag',   t:'自動診断・備考', ic:'🔍', c:'gray',   chip:'診断' }
  ];
  function secFields(s) {
    if (s.rows)  return s.rows.filter(c => C.PF.includes(c));
    if (s.cells) return s.cells.filter(x => !x[2]).map(x => x[0]).filter(c => C.PF.includes(c));
    return [];
  }

  // ───────── 飽和温度（howaondo2.js と同じ表・判定） ─────────
  const OND = Array.from({ length: 51 }, (_, i) => -40 + 2 * i);
  C.SAT = {
    R22:[0.004,0.014,0.025,0.037,0.049,0.063,0.077,0.092,0.108,0.126,0.144,0.163,0.184,0.206,0.229,0.253,0.279,0.306,0.335,0.365,0.397,0.43,0.465,0.501,0.54,0.58,0.622,0.665,0.711,0.759,0.809,0.861,0.915,0.971,1.03,1.091,1.154,1.22,1.289,1.36,1.433,1.509,1.589,1.67,1.755,1.843,1.933,2.027,2.124,2.224,2.328],
    R134a:[-37.2,-33.0,-28.5,-23.5,-18.2,-12.4,-6.1,0.008,0.011,0.021,0.032,0.044,0.056,0.070,0.084,0.100,0.116,0.134,0.152,0.171,0.192,0.214,0.237,0.261,0.287,0.314,0.342,0.372,0.404,0.436,0.471,0.507,0.545,0.585,0.626,0.669,0.715,0.762,0.811,0.862,0.916,0.971,1.029,1.089,1.152,1.216,1.284,1.354,1.427,1.502,1.580],
    R32:[0.076,0.093,0.111,0.130,0.150,0.172,0.195,0.220,0.247,0.275,0.304,0.336,0.369,0.405,0.442,0.481,0.523,0.567,0.613,0.661,0.712,0.765,0.821,0.880,0.941,1.006,1.073,1.143,1.217,1.293,1.373,1.457,1.543,1.634,1.728,1.826,1.928,2.034,2.144,2.258,2.377,2.500,2.628,2.760,2.898,3.040,3.187,3.340,3.498,3.662,3.832],
    R407C:[-11.9,-5.1,0.003,0.013,0.025,0.037,0.050,0.064,0.079,0.096,0.113,0.131,0.151,0.172,0.194,0.218,0.243,0.269,0.298,0.327,0.359,0.392,0.426,0.463,0.502,0.542,0.721,0.770,0.822,0.877,0.933,0.993,1.054,1.118,1.185,1.254,1.326,1.401,1.479,1.559,1.643,1.730,1.820,1.913,2.009,2.109,2.212,2.319,2.429,2.543,2.661],
    R410A:[0.073,0.090,0.107,0.216,0.146,0.168,0.191,0.215,0.241,0.269,0.298,0.329,0.361,0.396,0.432,0.471,0.512,0.554,0.599,0.646,0.693,0.748,0.803,0.860,0.920,0.982,1.051,1.120,1.191,1.266,1.344,1.425,1.509,1.597,1.689,1.784,1.883,1.986,2.092,2.203,2.318,2.437,2.561,2.689,2.822,2.960,3.102,3.250,3.403,3.562,3.726]
  };
  C.satTemp = function (p, list) {
    if (p === '' || p == null || isNaN(p) || !list) return '';
    for (let i = 0; i < list.length; i++) {
      if (list[i] > p) {
        if (i === 0) return String(OND[0]);
        return String(OND[(list[i] - p > p - list[i - 1]) ? i - 1 : i]);
      }
    }
    return '';   // 範囲外（数値フィールドに文字は入れられないので空）
  };
  C.updateSat = function (m) {
    const list = C.SAT[m.v.冷媒種];
    m.v.高圧飽和温度 = C.satTemp(parseFloat(m.v.高圧圧力), list);
    m.v.低圧飽和温度 = C.satTemp(parseFloat(m.v.低圧圧力), list);
  };

  // ───────── モデル ─────────
  // m = { v:{コード:文字列}, indoor:[{id,型式,製造番号,吸込,吹出,備考}], na:Set(フィールドコード) }
  const filled = v => v !== '' && v != null;
  C.filled = filled;
  C.blankRow = () => ({ id: null, 型式:'', 製造番号:'', 吸込:'', 吹出:'', 備考:'' });
  C.isBlankRow = r => !IU_KEYS.some(k => filled(r[k]));

  C.emptyModel = function () {
    const v = {};
    C.TEXT_FIELDS.concat(C.NUM_FIELDS).forEach(c => { v[c] = ''; });
    v.冷媒種 = ''; v.報告書へ掲載する情報 = '自動診断';
    C.VISUAL.forEach(x => { v[x[0]] = '無'; v[x[1]] = ''; });
    const files = {}; C.PHOTO_FIELDS.forEach(f => { files[f] = []; });
    return { v, indoor: [], na: new Set(), files };
  };

  // kintone のレコード（REST / kintone.app.record.get().record どちらも可）→ モデル
  C.fromRecord = function (rec) {
    const m = C.emptyModel();
    C.TEXT_FIELDS.concat(C.NUM_FIELDS, C.SELECT_FIELDS).forEach(c => {
      if (rec[c] && rec[c].value != null) m.v[c] = String(rec[c].value);
    });
    if (!m.v.報告書へ掲載する情報) m.v.報告書へ掲載する情報 = '自動診断';
    C.VISUAL.forEach(x => {
      m.v[x[0]] = (rec[x[0]] && rec[x[0]].value) || '無';
      m.v[x[1]] = (rec[x[1]] && rec[x[1]].value != null) ? String(rec[x[1]].value) : '';
    });
    ((rec['対象外項目'] && rec['対象外項目'].value) || []).forEach(o => { if (C.NA_MAP[o]) m.na.add(C.NA_MAP[o]); });
    const rows = (rec[C.IU.table] && rec[C.IU.table].value) || [];
    m.indoor = rows.map(row => {
      const r = { id: row.id || null };
      IU_KEYS.forEach(k => { const f = row.value[C.IU[k]]; r[k] = f && f.value != null ? String(f.value) : ''; });
      return r;
    }).filter(r => !C.isBlankRow(r));
    m.files = {};
    C.PHOTO_FIELDS.forEach(f => {
      m.files[f] = ((rec[f] && rec[f].value) || []).map(x => ({ fileKey: x.fileKey, name: x.name, contentType: x.contentType, size: x.size }));
    });
    return m;
  };

  // モデル → kintone のフィールド値
  //   forSet=true : kintone.app.record.set 用（サブテーブルのセルに type を付ける）
  C.toRecord = function (m, opt) {
    const forSet = !!(opt && opt.forSet);
    const out = {};
    C.TEXT_FIELDS.concat(C.SELECT_FIELDS).forEach(c => { out[c] = { value: m.v[c] || '' }; });
    C.NUM_FIELDS.forEach(c => { out[c] = { value: m.na.has(c) ? '' : (m.v[c] || '') }; });
    C.VISUAL.forEach(x => {   // 「無」のときは備考を空にして保存
      const yes = m.v[x[0]] === '有';
      out[x[0]] = { value: yes ? '有' : '無' };
      out[x[1]] = { value: yes ? (m.v[x[1]] || '') : '' };
    });
    out['対象外項目'] = { value: Object.keys(C.NA_MAP).filter(o => m.na.has(C.NA_MAP[o])) };
    out[C.IU.table] = {
      value: m.indoor.filter(r => !C.isBlankRow(r)).map(r => {
        const cells = {};
        IU_KEYS.forEach(k => { cells[C.IU[k]] = forSet ? { type: IU_TYPE[k], value: r[k] || '' } : { value: r[k] || '' }; });
        const row = { value: cells };
        if (r.id) row.id = r.id;
        return row;
      })
    };
    out['入力進捗'] = { value: C.progressText(m) };
    if (opt && opt.files && m.files) {
      C.PHOTO_FIELDS.forEach(f => { out[f] = { value: (m.files[f] || []).filter(x => x.fileKey).map(x => ({ fileKey: x.fileKey })) }; });
    }
    return out;
  };

  // ───────── 過去の点検から機器を引き継いだ新しいレコードを作る（WEBアプリ・kintone 共通） ─────────
  // 機器の情報（報告書に載るもの）はコピーし、測定値・目視点検・特記事項は空で始める
  C.MACHINE_ATTRS = ['メーカー','冷媒量','納入年月','圧縮機出力','VベルトAB','ベルトサイズ','ベルト本数','Watt','Voltage','ControlType','PowerType','Frequency'];
  C.REPORT_ADDR = ['報告書へ記載する住所','報告書へ記載する電話番号'];
  C.inheritRecord = function (rec, g) {   // g = {name, date, site, type}
    const o = C.fromRecord(rec), n = C.emptyModel();
    ['系統','型式','製造番号','冷媒種'].forEach(c => { n.v[c] = o.v[c]; });
    n.na = new Set(o.na);
    n.indoor = o.indoor.map(r => Object.assign(C.blankRow(), { 型式: r.型式, 製造番号: r.製造番号 }));
    const out = C.toRecord(n);
    C.MACHINE_ATTRS.concat(C.REPORT_ADDR).forEach(c => {
      if (rec[c] && rec[c].value !== '' && rec[c].value != null) out[c] = { value: rec[c].value };
    });
    out['点検グループ'] = { value: g.name };
    out['日付']       = { value: g.date };
    out['現場名']     = { value: g.site };
    if (g.type) out['点検種類'] = { value: g.type };
    return out;
  };

  // 画像を縮小して JPEG の dataURL にする（長い辺 max px）
  C.resizeImage = function (blob, max, q) {
    max = max || 1600; q = q || 0.8;
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', q));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読み込めませんでした')); };
      img.src = url;
    });
  };

  // ───────── 入力進捗 ─────────
  C.progress = function (m) {
    const target = C.PF.filter(c => !m.na.has(c));
    const rows = m.indoor.filter(r => !C.isBlankRow(r));
    return {
      done: target.filter(c => filled(m.v[c])).length, total: target.length,
      iDone: rows.filter(r => filled(r.吸込) && filled(r.吹出)).length, iTotal: rows.length
    };
  };
  // 0:未着手 1:入力中 2:完了（型式・製造番号・冷媒種だけ入っている状態は「未着手」）
  const BASIC = ['型式', '製造番号', '冷媒種'];
  C.status = function (m) {
    const p = C.progress(m);
    if (p.done === p.total && p.iDone === p.iTotal) return 2;
    const measured = C.PF.some(c => !BASIC.includes(c) && !m.na.has(c) && filled(m.v[c]));
    return (measured || p.iDone) ? 1 : 0;
  };
  C.STATUS_LABEL = ['未着手', '入力中', '完了'];
  C.progressText = function (m) {
    const p = C.progress(m);
    return p.done + '/' + p.total + (p.iTotal ? ' 室内機' + p.iDone + '/' + p.iTotal : '');
  };
  C.groupName = function (date, site) {
    const mt = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    site = String(site || '').trim();
    if (!mt || !site) return '';
    return `${mt[1]}年${mt[2]}月${mt[3]}日点検 ${site}`;
  };

  // ───────── 自動診断（shindan5.js と同じ判定） ─────────
  C.rules = null;   // null = 読込中, [] = 取得できず
  // kintone の計算フィールド（過熱度・過冷却度）を入力値から求める（診断ルールで使うため）
  C.derivedValues = function (m) {
    const f = c => parseFloat(m.v[c]), o = Object.assign({}, m.v);
    const r1 = x => String(Math.round(x * 10) / 10);
    if (!filled(o.過熱度) && !isNaN(f('吸入管温度')) && !isNaN(f('低圧飽和温度'))) o.過熱度 = r1(f('吸入管温度') - f('低圧飽和温度'));
    if (!filled(o.過冷却度) && !isNaN(f('高圧飽和温度')) && !isNaN(f('膨張弁入口温度'))) o.過冷却度 = r1(f('高圧飽和温度') - f('膨張弁入口温度'));
    return o;
  };
  C.diagnose = function (m, rules) {
    rules = rules === undefined ? C.rules : rules;
    if (rules == null) return { cls: 'loading', text: '診断ルール読込中...', msg: '' };
    if (!rules.length) return { cls: 'pending', text: '診断ルール未取得', msg: '' };
    const measured = C.NUM_FIELDS.some(c => !C.CALC_FIELDS.includes(c) && filled(m.v[c]));
    if (!measured) return { cls: 'pending', text: '値を入力すると自動診断します', msg: '' };
    const msgs = [], dv = C.derivedValues(m);
    rules.forEach(({ field1, operator, field2, condition, threshold, message }) => {
      const v1 = parseFloat(dv[field1]), v2 = field2 ? parseFloat(dv[field2]) : 0;
      let met;
      if (operator === '-' && field2) { const d = v1 - v2; met = condition === '<' ? d < threshold : condition === '>' ? d > threshold : d === threshold; }
      else { met = condition === '<' ? v1 < threshold : condition === '>' ? v1 > threshold : v1 === threshold; }
      if (met && !isNaN(v1)) {
        let t = String(message || '');
        const vals = Object.assign({}, dv, { x: v1, y: v2 });
        Object.keys(vals).forEach(k => { t = t.split('{' + k + '}').join(vals[k]); });
        msgs.push(t.replace(/\\n/g, '\n'));
      }
    });
    return msgs.length ? { cls: 'alert', text: msgs.join('\n\n'), msg: msgs.join('\n\n') } : { cls: 'ok', text: '✓ 異常なし', msg: '' };
  };
  C.reportText = function (m, diagMsg) {
    const d = m.v.報告書へ掲載する情報, b = m.v.備考 || '';
    if (d === '備考内容') return b;
    if (d === '自動診断') return diagMsg;
    return b ? b + '\n\n' + diagMsg : diagMsg;
  };

  // ───────── 描画 ─────────
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  C.esc = esc;

  function secCount(m, s) {
    if (s.k === 'indoor') { const p = C.progress(m); return { d: p.iDone, t: p.iTotal }; }
    const f = secFields(s).filter(c => !m.na.has(c));
    return { d: f.filter(c => filled(m.v[c])).length, t: f.length };
  }
  function dtInfo(r) {
    if (!filled(r.吸込) || !filled(r.吹出)) return { t: '温度差 —', c: '' };
    const d = parseFloat(r.吸込) - parseFloat(r.吹出);
    return { t: `温度差 ${d.toFixed(1)}℃`, c: Math.abs(d) < 5 ? 'warn' : 'ok' };
  }
  function cellHTML(m, p, c, u, calc) {
    const na = m.na.has(c), v = m.v[c] == null ? '' : m.v[c], naable = !!C.NA_OPT[c];
    return `<div class="ic-pc${na ? ' na' : ''}"><div class="ic-pl"><span>${esc(C.LBL[c] || c)}</span>${naable ? `<button type="button" class="ic-nab" data-na="${c}" aria-pressed="${na}">対象外</button>` : ''}</div>
      <div class="ic-pw"><input class="ic-pi${calc ? ' calc' : ''}${!calc && filled(v) && !na ? ' filled' : ''}" id="${p}-${c}" data-f="${c}" ${calc ? 'readonly tabindex="-1" type="text"' : 'type="number" inputmode="decimal" step="any"'} ${na ? 'disabled' : ''} value="${na ? '' : esc(v)}" placeholder="${na ? '対象外' : calc ? (m.v.冷媒種 ? '自動' : '冷媒種を選択') : '0.0'}"><span class="ic-pu">${u}</span></div></div>`;
  }
  function indoorHTML(m, p) {
    const rows = m.indoor.map((r, i) => {
      const d = dtInfo(r);
      return `<div class="ic-iu">
        <div class="ic-iu-h"><b>室内機 ${i + 1}</b><span class="ic-dt ${d.c}" id="${p}-dt-${i}">${d.t}</span>
          <div class="ic-act"><button type="button" data-act="iu-dup" data-row="${i}">複製</button><button type="button" data-act="iu-del" data-row="${i}">削除</button></div></div>
        <div class="ic-pg">
          <div class="ic-pc"><div class="ic-pl">型式</div><div class="ic-pw"><input class="ic-pi txt" id="${p}-iu${i}-型式" data-row="${i}" data-ik="型式" value="${esc(r.型式)}"></div></div>
          <div class="ic-pc"><div class="ic-pl">製造番号</div><div class="ic-pw"><input class="ic-pi txt" id="${p}-iu${i}-製造番号" data-row="${i}" data-ik="製造番号" value="${esc(r.製造番号)}"></div></div>
          <div class="ic-pc"><div class="ic-pl">吸込温度</div><div class="ic-pw"><input class="ic-pi${filled(r.吸込) ? ' filled' : ''}" type="number" inputmode="decimal" step="any" id="${p}-iu${i}-吸込" data-row="${i}" data-ik="吸込" value="${esc(r.吸込)}" placeholder="0.0"><span class="ic-pu">℃</span></div></div>
          <div class="ic-pc"><div class="ic-pl">吹出温度</div><div class="ic-pw"><input class="ic-pi${filled(r.吹出) ? ' filled' : ''}" type="number" inputmode="decimal" step="any" id="${p}-iu${i}-吹出" data-row="${i}" data-ik="吹出" value="${esc(r.吹出)}" placeholder="0.0"><span class="ic-pu">℃</span></div></div>
        </div>
        <div class="ic-frow"><div class="ic-fl">備考</div><input class="ic-fi" id="${p}-iu${i}-備考" data-row="${i}" data-ik="備考" value="${esc(r.備考)}" placeholder="任意"></div>
      </div>`;
    }).join('');
    return (rows || '<div class="ic-empty">室内機は登録されていません</div>') +
      `<div class="ic-iu-add"><button type="button" data-act="iu-add">＋ 行を追加</button><button type="button" data-act="iu-addcopy" ${m.indoor.length ? '' : 'disabled'}>＋ 前の行の型式で追加</button></div>`;
  }
  function visualHTML(m, p) {
    return C.VISUAL.map(([code, rem, label]) => {
      const yes = m.v[code] === '有';
      return `<div class="ic-vrow${yes ? ' yes' : ''}"><div class="ic-vl">${esc(label)}</div>
        <div class="ic-seg2" role="group" aria-label="${esc(label)}">
          <button type="button" data-rad="${esc(code)}" data-val="無" aria-pressed="${!yes}">無</button>
          <button type="button" data-rad="${esc(code)}" data-val="有" aria-pressed="${yes}" class="y">有</button></div></div>
        ${yes ? `<div class="ic-frow ic-vrem"><div class="ic-fl">備考</div><input class="ic-fi" id="${p}-${rem}" data-f="${rem}" value="${esc(m.v[rem])}" placeholder="状況を入力"></div>` : ''}`;
    }).join('');
  }
  const photoCount = m => C.PHOTO_FIELDS.reduce((a, f) => a + ((m.files && m.files[f]) || []).filter(x => x.fileKey || x.uploading).length, 0);
  function photoHTML(m, p) {
    return `<div class="ic-ph">${C.PHOTO_FIELDS.map((f, i) => {
      const list = (m.files && m.files[f]) || [], x = list[0];
      if (!x) return `<label class="ic-phs add"><input type="file" accept="image/*" data-phup="${f}" hidden><span class="pl">＋</span><span>写真${i + 1}</span></label>`;
      const img = isImg(x);
      return `<div class="ic-phs${x.uploading ? ' up' : ''}">
        ${x.uploading ? `<img src="${x._src || ''}" alt=""><span class="st">アップロード中...</span>`
          : img ? `<img class="ic-phimg" data-fk="${C.esc(x.fileKey)}" src="${x._src || ''}" alt="写真${i + 1}">` : `<span class="st">${C.esc(x.name || 'ファイル')}</span>`}
        ${list.length > 1 ? `<span class="more">他${list.length - 1}件</span>` : ''}
        ${x.uploading ? '' : `<button type="button" class="ic-phdel" data-phdel="${f}" aria-label="写真${i + 1}を削除">✕</button>`}</div>`;
    }).join('')}</div><div class="ic-phnote">写真は自動で縮小して保存されます。報告書には3枚まで載ります。</div>`;
  }
  // 表示されていないサムネイルを読み込む
  C.fillThumbs = function (root) {
    if (!C.photoHooks || !C.photoHooks.thumb) return;
    root.querySelectorAll('img.ic-phimg[data-fk]').forEach(img => {
      if (img.getAttribute('src') || img.dataset.loading) return;
      img.dataset.loading = '1';
      C.photoHooks.thumb(img.dataset.fk).then(src => { img.src = src; }).catch(() => { img.alt = '表示できません'; });
    });
  };
  const visualCnt = m => { const n = C.visualCount(m); return n ? `有 ${n}件` : '異常なし'; };

  const secs = () => C.SECTIONS.filter(s => s.k !== 'photo' || C.PHOTO_ENABLED);
  C.formHTML = function (m, p) {
    return secs().map(s => {
      let cnt = '';
      if (s.k === 'photo') cnt = `<span class="ic-cnt" id="${p}-cnt-photo">${photoCount(m)}枚</span>`;
      else if (s.k === 'visual') cnt = `<span class="ic-cnt" id="${p}-cnt-visual">${visualCnt(m)}</span>`;
      else if (s.k !== 'diag') { const x = secCount(m, s); cnt = `<span class="ic-cnt" id="${p}-cnt-${s.k}">${x.d}/${x.t}${s.k === 'indoor' ? '台' : ''}</span>`; }
      let inner = '';
      if (s.rows) {
        inner = s.rows.map(c => c === '冷媒種'
          ? `<div class="ic-frow"><div class="ic-fl">冷媒種</div><select class="ic-fi" id="${p}-冷媒種" data-f="冷媒種"><option value="">選択してください</option>${C.REFS.map(r => `<option value="${r}"${m.v.冷媒種 === r ? ' selected' : ''}>${r}</option>`).join('')}</select></div>`
          : `<div class="ic-frow"><div class="ic-fl">${C.LBL[c]}</div><input class="ic-fi" id="${p}-${c}" data-f="${c}" value="${esc(m.v[c])}"></div>`).join('');
      } else if (s.cells) {
        inner = `<div class="ic-pg">${s.cells.map(x => cellHTML(m, p, x[0], x[1], x[2])).join('')}</div>`;
      } else if (s.k === 'visual') {
        inner = visualHTML(m, p);
      } else if (s.k === 'indoor') {
        inner = indoorHTML(m, p);
      } else if (s.k === 'photo') {
        inner = photoHTML(m, p);
      } else {
        const d = C.diagnose(m);
        inner = `<div class="ic-diag ${d.cls}" id="${p}-diag">${esc(d.text)}</div>
          <div class="ic-frow"><div class="ic-fl">報告書掲載</div><select class="ic-fi" id="${p}-報告書へ掲載する情報" data-f="報告書へ掲載する情報">${C.REPORT_OPTS.map(o => `<option value="${o}"${m.v.報告書へ掲載する情報 === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
          <div class="ic-frow top"><div class="ic-fl">備考</div><textarea class="ic-fi" id="${p}-備考" data-f="備考" placeholder="特記事項があれば入力">${esc(m.v.備考)}</textarea></div>`;
      }
      return `<section class="ic-sec" id="${p}-sec-${s.k}"><div class="ic-sh ${s.c}">${s.ic} ${s.t}${cnt}</div>${inner}</section>`;
    }).join('');
  };
  C.chipsHTML = function (m) {
    return secs().map(s => {
      if (s.k === 'photo') { const n = photoCount(m); return `<button type="button" class="ic-chip${n ? ' full' : ''}" data-go="${s.k}">${s.chip}<span class="n">${n}枚</span></button>`; }
      if (s.k === 'diag') return `<button type="button" class="ic-chip" data-go="${s.k}">${s.chip}</button>`;
      if (s.k === 'visual') { const n = C.visualCount(m); return `<button type="button" class="ic-chip ${n ? 'warn' : 'full'}" data-go="${s.k}">${s.chip}<span class="n">${n ? '有' + n : 'OK'}</span></button>`; }
      const x = secCount(m, s), cl = x.t && x.d === x.t ? 'full' : x.d ? 'part' : '';
      return `<button type="button" class="ic-chip ${cl}" data-go="${s.k}">${s.chip}<span class="n">${x.d}/${x.t}</span></button>`;
    }).join('');
  };
  C.pillHTML = function (m) {
    const p = C.progress(m);
    return `<span class="ic-pill${C.status(m) === 2 ? ' done' : ''}">${p.done}/${p.total}</span>`;
  };
  C.ringSVG = function (m) {
    const p = C.progress(m), r = (p.done + p.iDone) / Math.max(1, p.total + p.iTotal), L = 2 * Math.PI * 19;
    const col = C.status(m) === 2 ? 'var(--ic-ok)' : 'var(--ic-primary)';
    return `<svg class="ic-ring" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="19" fill="none" stroke="var(--ic-gray-bg)" stroke-width="5"/><circle cx="23" cy="23" r="19" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${L * r} ${L}" transform="rotate(-90 23 23)"/><text x="23" y="27" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ic-text)">${Math.round(r * 100)}%</text></svg>`;
  };

  // root 内の .ic-chips / .ic-pillslot / 件数 / 診断 を更新
  C.refresh = function (root, m, p) {
    const ch = root.querySelector('.ic-chips'); if (ch) ch.innerHTML = C.chipsHTML(m);
    const pl = root.querySelector('.ic-pillslot'); if (pl) pl.innerHTML = C.pillHTML(m);
    secs().forEach(s => {
      const el = root.querySelector(`#${CSS.escape(p + '-cnt-' + s.k)}`);
      if (el && s.k === 'photo') el.textContent = photoCount(m) + '枚';
      else if (el && s.k === 'visual') el.textContent = visualCnt(m);
      else if (el) { const x = secCount(m, s); el.textContent = `${x.d}/${x.t}${s.k === 'indoor' ? '台' : ''}`; }
    });
    const dg = root.querySelector(`#${CSS.escape(p + '-diag')}`);
    if (dg) { const d = C.diagnose(m); dg.className = 'ic-diag ' + d.cls; dg.textContent = d.text; }
    if (C.PHOTO_ENABLED) C.fillThumbs(root);
  };
  C.rerender = function (root, m, p) {
    const f = root.querySelector('.ic-formslot');
    if (f) f.innerHTML = C.formHTML(m, p);
    C.refresh(root, m, p);
  };

  // 入力イベントを root に委譲。onChange(m) は値が変わるたびに呼ばれる
  C.bindForm = function (root, getModel, p, onChange) {
    const q = id => root.querySelector('#' + CSS.escape(id));
    root.addEventListener('input', e => {
      const m = getModel(); if (!m) return;
      const t = e.target;
      if (t.dataset.f) {
        m.v[t.dataset.f] = t.value;
        if (t.classList.contains('ic-pi') && !t.classList.contains('calc')) t.classList.toggle('filled', filled(t.value));
        if (['冷媒種', '高圧圧力', '低圧圧力'].includes(t.dataset.f)) {
          C.updateSat(m);
          C.CALC_FIELDS.forEach(c => { const el = q(`${p}-${c}`); if (el) { el.value = m.v[c]; el.placeholder = m.v.冷媒種 ? '自動' : '冷媒種を選択'; } });
        }
      } else if (t.dataset.ik) {
        const r = m.indoor[+t.dataset.row]; if (!r) return;
        r[t.dataset.ik] = t.value;
        if (t.type === 'number') t.classList.toggle('filled', filled(t.value));
        const d = dtInfo(r), el = q(`${p}-dt-${t.dataset.row}`);
        if (el) { el.textContent = d.t; el.className = 'ic-dt ' + d.c; }
      } else return;
      C.refresh(root, m, p);
      if (onChange) onChange(m);
    });
    root.addEventListener('change', e => {
      const t = e.target, m = getModel();
      if (!m || !t.dataset || !t.dataset.phup || !t.files || !t.files[0]) return;
      const f = t.dataset.phup, file = t.files[0];
      if (!C.photoHooks || !C.photoHooks.upload) return;
      m.files[f] = [{ uploading: true, name: file.name }];
      C.rerender(root, m, p);
      C.resizeImage(file, 400, 0.7).then(src => { if (m.files[f][0] && m.files[f][0].uploading) { m.files[f][0]._src = src; C.rerender(root, m, p); } }).catch(() => {});
      C.photoHooks.upload(file).then(info => {
        m.files[f] = [info]; C.rerender(root, m, p); if (onChange) onChange(m);
      }).catch(err => {
        m.files[f] = []; C.rerender(root, m, p);
        if (C.photoHooks.error) C.photoHooks.error('写真をアップロードできませんでした：' + (err.message || err));
      });
    });
    root.addEventListener('click', e => {
      const m = getModel(); if (!m) return;
      const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.dataset.go) {
        const sc = root.querySelector('.ic-scroll'), sec = q(`${p}-sec-${b.dataset.go}`);
        if (sc && sec) sc.scrollTo({ top: sec.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 10, behavior: 'smooth' });
        return;
      }
      if (b.dataset.rad) {
        const code = b.dataset.rad, before = m.v[code];
        m.v[code] = b.dataset.val;
        if (before === m.v[code]) return;
        const sc = root.querySelector('.ic-scroll'), top = sc ? sc.scrollTop : 0;
        C.rerender(root, m, p);
        if (sc) sc.scrollTop = top;
        if (onChange) onChange(m);
        if (m.v[code] === '有') {
          const x = C.VISUAL.find(v => v[0] === code), el = x && q(`${p}-${x[1]}`);
          if (el) el.focus({ preventScroll: true });
        }
        return;
      }
      if (b.dataset.phdel) {
        if (!b.classList.contains('danger')) {
          b.classList.add('danger'); b.textContent = '削除';
          setTimeout(() => { if (b.isConnected) { b.classList.remove('danger'); b.textContent = '✕'; } }, 2500);
          return;
        }
        m.files[b.dataset.phdel] = [];
        C.rerender(root, m, p); if (onChange) onChange(m); return;
      }
      if (b.dataset.na) {
        const c = b.dataset.na;
        if (m.na.has(c)) m.na.delete(c); else { m.na.add(c); m.v[c] = ''; }
        C.rerender(root, m, p); if (onChange) onChange(m); return;
      }
      const a = b.dataset.act; if (!a || a.indexOf('iu-') !== 0) return;
      const i = +b.dataset.row;
      if (a === 'iu-add') m.indoor.push(C.blankRow());
      if (a === 'iu-addcopy') { const l = m.indoor[m.indoor.length - 1]; m.indoor.push(Object.assign(C.blankRow(), { 型式: l ? l.型式 : '' })); }
      if (a === 'iu-dup') m.indoor.splice(i + 1, 0, Object.assign(C.blankRow(), { 型式: m.indoor[i].型式, 備考: m.indoor[i].備考 }));
      if (a === 'iu-del') {
        if (!b.classList.contains('danger')) {
          b.classList.add('danger'); b.textContent = '本当に削除';
          setTimeout(() => { if (b.isConnected) { b.classList.remove('danger'); b.textContent = '削除'; } }, 2500);
          return;
        }
        m.indoor.splice(i, 1);
      }
      C.rerender(root, m, p); if (onChange) onChange(m);
      if (a === 'iu-add' || a === 'iu-addcopy' || a === 'iu-dup') {
        const n = a === 'iu-dup' ? i + 1 : m.indoor.length - 1;
        const el = q(`${p}-iu${n}-${a === 'iu-add' ? '型式' : '製造番号'}`);
        if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
      }
    });
  };

  // ───────── CSS（.ic-root 配下に限定。kintone の CSS と衝突しないよう接頭辞 ic-） ─────────
  C.CSS = `
.ic-root{--ic-primary:#1a73e8;--ic-primary-d:#1557b0;--ic-bg:#f0f4f8;--ic-card:#fff;--ic-text:#202124;--ic-sub:#5f6368;--ic-border:#dadce0;
 --ic-calc:#edf3ff;--ic-calc-b:#b3c8f5;--ic-ok:#137333;--ic-ok-bg:#e6f4ea;--ic-warn:#9a5b00;--ic-warn-bg:#fef3d6;--ic-bad:#c5221f;--ic-bad-bg:#fce8e6;--ic-gray-bg:#f1f3f4;
 font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic UI",sans-serif;color:var(--ic-text);font-size:17px;line-height:1.5;-webkit-text-size-adjust:100%}
.ic-root *,.ic-root *::before,.ic-root *::after{box-sizing:border-box}
.ic-root button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.ic-root input,.ic-root select,.ic-root textarea{font-family:inherit;margin:0}
.ic-chips{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:var(--ic-card);border-bottom:1px solid var(--ic-border);flex-shrink:0;scrollbar-width:none}
.ic-chips::-webkit-scrollbar{display:none}
.ic-chip{border:1.5px solid var(--ic-border);background:var(--ic-card);color:var(--ic-text);border-radius:99px;padding:6px 12px;font-size:15px;white-space:nowrap;display:flex;gap:6px;align-items:center;font-weight:700}
.ic-chip .n{font-size:13px;color:var(--ic-sub);font-variant-numeric:tabular-nums}
.ic-chip.full{border-color:var(--ic-ok);color:var(--ic-ok)} .ic-chip.full .n{color:var(--ic-ok)}
.ic-chip.part{border-color:var(--ic-primary)}
.ic-pill{background:#fff;color:#1557b0;border-radius:99px;padding:6px 12px;font-weight:800;font-size:16px;white-space:nowrap;font-variant-numeric:tabular-nums}
.ic-pill.done{background:#e6f4ea;color:#137333}
.ic-sec{background:var(--ic-card);border-radius:14px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.09)}
.ic-sh{padding:12px 14px;font-size:18px;font-weight:700;display:flex;align-items:center;gap:7px}
.ic-cnt{margin-left:auto;font-size:14px;font-weight:700;opacity:.85;font-variant-numeric:tabular-nums}
.ic-sh.blue{background:#e8f0fe;color:#1a56db}.ic-sh.red{background:#fce8e6;color:#c5221f}.ic-sh.green{background:#e6f4ea;color:#137333}
.ic-sh.orange{background:#fff3e0;color:#b45309}
.ic-chip.warn{border-color:#d97706;color:#b45309} .ic-chip.warn .n{color:#b45309}
.ic-vrow{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--ic-border)}
.ic-sh+.ic-vrow{border-top:0}
.ic-vl{flex:1;min-width:0;font-size:17px}
.ic-vrow.yes .ic-vl{color:#b45309;font-weight:700}
.ic-seg2{display:flex;border:1.5px solid var(--ic-border);border-radius:10px;overflow:hidden;flex-shrink:0}
.ic-seg2 button{border:0;background:var(--ic-card);color:var(--ic-sub);width:64px;height:46px;font-size:18px;font-weight:700}
.ic-seg2 button+button{border-left:1.5px solid var(--ic-border)}
.ic-seg2 button[aria-pressed="true"]{background:#e8f0fe;color:#1a56db}
.ic-seg2 button.y[aria-pressed="true"]{background:#fef3d6;color:#b45309}
.ic-frow.ic-vrem{border-top:0;padding-top:0;background:#fffaf0}
.ic-sh.purple{background:#f3e8fd;color:#6a1b9a}.ic-sh.teal{background:#e0f7fa;color:#006064}.ic-sh.gray{background:#f1f3f4;color:#5f6368}
.ic-frow{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--ic-border)}
.ic-frow:first-of-type{border-top:0}
.ic-frow.top{align-items:flex-start}.ic-frow.top .ic-fl{padding-top:12px}
.ic-fl{font-size:17px;color:var(--ic-sub);min-width:84px;flex-shrink:0}
.ic-root .ic-fi{flex:1;min-width:0;width:auto;height:52px;border:1.5px solid var(--ic-border);border-radius:10px;padding:0 12px;font-size:20px;background:var(--ic-card);color:var(--ic-text);outline:none;-webkit-appearance:none;appearance:none;box-shadow:none}
.ic-root select.ic-fi{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%235f6368'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:36px}
.ic-root textarea.ic-fi{height:96px;padding:10px 12px;resize:vertical;line-height:1.6}
.ic-root .ic-fi:focus,.ic-root .ic-pi:focus{border-color:var(--ic-primary);box-shadow:0 0 0 3px rgba(26,115,232,.18)}
.ic-pg{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--ic-border)}
.ic-pc{padding:10px 11px;display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--ic-border);min-width:0}
.ic-pc:nth-child(-n+2){border-top:0}
.ic-pc:nth-child(even){border-left:1px solid var(--ic-border)}
.ic-pl{font-size:15px;color:var(--ic-sub);display:flex;justify-content:space-between;align-items:center;gap:4px;min-height:24px}
.ic-pw{display:flex;align-items:center;gap:4px}
.ic-root .ic-pi{flex:1;min-width:0;width:auto;height:52px;border:1.5px solid var(--ic-border);border-radius:8px;padding:0 6px;font-size:20px;text-align:center;background:var(--ic-card);color:var(--ic-text);outline:none;-webkit-appearance:none;appearance:none;box-shadow:none;font-variant-numeric:tabular-nums}
.ic-root .ic-pi.calc{background:var(--ic-calc);color:var(--ic-primary-d);font-weight:700;border-color:var(--ic-calc-b)}
.ic-root .ic-pi.filled{border-color:var(--ic-ok)}
.ic-root .ic-pi:disabled{background:var(--ic-gray-bg);border-style:dashed}
.ic-root .ic-pi.txt{text-align:left;padding:0 10px;font-size:18px}
.ic-pu{font-size:14px;color:var(--ic-sub);flex-shrink:0;min-width:22px}
.ic-nab{border:1px solid var(--ic-border);background:transparent;color:var(--ic-sub);border-radius:6px;font-size:12px;padding:2px 7px}
.ic-pc.na .ic-nab{background:var(--ic-warn-bg);color:var(--ic-warn);border-color:transparent;font-weight:700}
.ic-iu{border-top:1px solid var(--ic-border)} .ic-iu:first-child{border-top:0}
.ic-iu-h{display:flex;align-items:center;gap:8px;padding:10px 12px 0}
.ic-iu-h b{font-size:16px}
.ic-dt{font-size:13px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--ic-gray-bg);color:var(--ic-sub);font-variant-numeric:tabular-nums}
.ic-dt.ok{background:var(--ic-ok-bg);color:var(--ic-ok)} .ic-dt.warn{background:var(--ic-warn-bg);color:var(--ic-warn)}
.ic-act{margin-left:auto;display:flex;gap:6px}
.ic-act button{border:1px solid var(--ic-border);background:var(--ic-card);color:var(--ic-text);border-radius:8px;padding:6px 11px;font-size:14px}
.ic-act button.danger{border-color:var(--ic-bad);color:var(--ic-bad);background:var(--ic-bad-bg);font-weight:700}
.ic-iu .ic-pg{border-top:0}
.ic-iu .ic-frow{border-top:0;padding-top:2px}
.ic-iu-add{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--ic-border);background:var(--ic-gray-bg)}
.ic-iu-add button{flex:1;border:1.5px dashed #00838f;background:var(--ic-card);color:#006064;border-radius:10px;padding:12px 6px;font-weight:700;font-size:15px}
.ic-iu-add button:disabled{opacity:.4}
.ic-empty{padding:16px 14px;color:var(--ic-sub);font-size:15px;text-align:center}
.ic-diag{margin:10px 14px 12px;border-radius:10px;padding:12px 14px;font-size:17px;white-space:pre-wrap;line-height:1.65;word-break:break-all}
.ic-diag.ok{background:var(--ic-ok-bg);color:var(--ic-ok)} .ic-diag.alert{background:var(--ic-bad-bg);color:var(--ic-bad)}
.ic-diag.pending,.ic-diag.loading{background:var(--ic-gray-bg);color:var(--ic-sub)}
.ic-ring{width:48px;height:48px;flex-shrink:0}
.ic-ph{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px}
.ic-phs{position:relative;aspect-ratio:4/3;border:1.5px solid var(--ic-border);border-radius:10px;overflow:hidden;background:var(--ic-gray-bg);display:flex;align-items:center;justify-content:center}
.ic-phs img{width:100%;height:100%;object-fit:cover;display:block}
.ic-phs.add{border-style:dashed;border-color:#5f6368;flex-direction:column;color:var(--ic-sub);font-size:14px;font-weight:700;cursor:pointer;background:var(--ic-card)}
.ic-phs.add .pl{font-size:30px;line-height:1;color:var(--ic-primary)}
.ic-phs .st{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);color:#fff;font-size:12px;text-align:center;padding:3px;font-weight:700}
.ic-phs.up img{opacity:.6}
.ic-phs .more{position:absolute;left:6px;top:6px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:1px 6px;border-radius:6px}
.ic-phdel{position:absolute;right:6px;top:6px;border:0;background:rgba(0,0,0,.6);color:#fff;border-radius:14px;min-width:28px;height:28px;font-size:14px;padding:0 8px}
.ic-phdel.danger{background:#c5221f;font-weight:700}
.ic-phnote{font-size:13px;color:var(--ic-sub);padding:0 12px 12px}
/* kintone 用ダイアログ */
.ic-dlg-wrap{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px}
.ic-dlg-bd{position:absolute;inset:0;background:rgba(0,0,0,.5)}
.ic-dlg{position:relative;width:min(600px,100%);height:min(94vh,100%);background:var(--ic-bg);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.4)}
@media (max-width:640px){.ic-dlg-wrap{padding:0}.ic-dlg{width:100%;height:100%;border-radius:0}}
.ic-dlg-h{background:#1a73e8;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0}
.ic-dlg-h .g{flex:1;min-width:0}
.ic-dlg-h .s{font-size:13px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ic-dlg-h .t{font-size:19px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ic-dlg-h .x{border:0;background:rgba(255,255,255,.2);color:#fff;width:40px;height:40px;border-radius:50%;font-size:18px;flex-shrink:0}
.ic-scroll{flex:1;overflow-y:auto;padding:12px;-webkit-overflow-scrolling:touch}
.ic-foot{flex-shrink:0;display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:var(--ic-card);border-top:1px solid var(--ic-border)}
.ic-btn{border:0;border-radius:12px;padding:14px 16px;font-weight:700;font-size:18px;background:var(--ic-gray-bg);color:var(--ic-text)}
.ic-btn.pri{background:var(--ic-primary);color:#fff;flex:1}
.ic-btn:disabled{opacity:.4}
.ic-open-btn{padding:16px 32px;font-size:20px;font-weight:bold;border-radius:8px;background:#1a73e8;color:#fff;border:none;cursor:pointer}
.ic-open-info{margin-left:14px;font-size:15px;color:#5f6368;vertical-align:middle}
.ic-open-info b{color:#202124;font-size:18px;font-variant-numeric:tabular-nums}
`;
  C.injectCSS = function () {
    if (document.getElementById('ic-core-css')) return;
    const st = document.createElement('style');
    st.id = 'ic-core-css'; st.textContent = C.CSS;
    document.head.appendChild(st);
  };

  global.InspCore = C;
})(typeof window !== 'undefined' ? window : this);
