// ============ 子項表單範本 ============
function subRowTemplate(opts = []) {
  const tr = document.createElement('tr');
  tr.className = 'sub-row';
  tr.innerHTML = `
    <td>
      <select class="form-select form-select-sm sub-item-select">
        <option value="">--請選擇--</option>
        ${opts.map(o => `<option data-unit="${o.unit}">${o.label}</option>`).join('')}
        <option value="__other__">其他（自行填寫）</option>
      </select>
      <input type="text" class="form-control form-control-sm mt-1 sub-item-custom" placeholder="請輸入項目名稱" style="display:none;">
    </td>
    <td><div class="input-group input-group-sm"><input type="number" class="form-control qty" value="1"><span class="input-group-text unit-text"></span></div></td>
    <td><input type="text" class="form-control form-control-sm price" placeholder="單價"></td>
    <td><input type="text" class="form-control form-control-sm subtotal" placeholder="小計" readonly></td>
    <td class="text-center"><button class="btn btn-danger btn-sm py-1 px-2" onclick="removeSub(this)"><i class="fas fa-trash"></i></button></td>
  `;
  return tr;
}

// ============ 主項範本 ============
function mainGroupTemplate() {
  const div = document.createElement('div');
  div.className = 'cost-main card mb-3';
  div.innerHTML = `
    <div class="card-body p-3">
      <div class="d-flex align-items-center mb-2">
        <select class="form-select form-select-sm cost-main-select me-2" style="max-width:200px">
          <option value="">--請選擇--</option>
          <option value="decoration">裝潢</option>
          <option value="cleaning">清潔清運</option>
          <option value="appliance">家電配備</option>
          <option value="development">開發費用</option>
        </select>
        <button class="btn btn-danger btn-sm ms-auto py-1 px-2" onclick="removeMain(this)">刪除主項</button>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-bordered align-middle mb-2">
          <thead class="table-light">
            <tr>
              <th style="width:35%">成本項目</th>
              <th style="width:20%">單位</th>
              <th style="width:20%">單價</th>
              <th style="width:20%">小計</th>
              <th style="width:5%" class="text-center">操作</th>
            </tr>
          </thead>
          <tbody class="cost-subs"></tbody>
        </table>
      </div>
      <button class="btn btn-outline-primary btn-sm add-sub"><i class="fas fa-plus me-1"></i>新增子項</button>
    </div>
  `;
  div.querySelector('.cost-subs').appendChild(subRowTemplate());
  return div;
}

// ============ 事件處理 ============
function removeSub(btn) { btn.closest('tr').remove(); recalcTotal(); }
function removeMain(btn) { btn.closest('.cost-main').remove(); recalcTotal(); }

document.getElementById('add-main')?.addEventListener('click', () => {
  document.getElementById('cost-groups').appendChild(mainGroupTemplate());
});

// 新增子項（事件委派）
document.addEventListener('click', e => {
  const target = e.target.closest('.add-sub');
  if (target) {
    const main = target.closest('.cost-main');
    const tbody = main?.querySelector('.cost-subs');
    if (tbody) {
      const key = main.querySelector('.cost-main-select')?.value || '';
      const opts = COST_SUB_OPTIONS[key] || [];
      tbody.appendChild(subRowTemplate(opts));
    }
  }
});

// 自動計算小計與總計
document.addEventListener('input', e => {
  if (e.target.classList.contains('qty') || e.target.classList.contains('price')) {
    const row = e.target.closest('.sub-row');
    const qty = parseFloat(row.querySelector('.qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.price')?.value) || 0;
    const sub = row.querySelector('.subtotal');
    if (sub) sub.value = qty * price;
    recalcTotal();
  }
});

function recalcTotal() {
  let total = 0;
  document.querySelectorAll('.subtotal').forEach(el => {
    total += parseFloat(el.value) || 0;
  });
  const totalEl = document.getElementById('total-cost');
  if (totalEl) totalEl.value = total;
  updateInvestKeys();
}

// ============ 樓層詳細資訊：新增列 / 刪除列 ============
document.getElementById('addFloorRow')?.addEventListener('click', () => {
  const tbody = document.querySelector('#floorDetailTable tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <div class="input-group input-group-sm">
        <input type="number" class="form-control" min="1" placeholder="3">
        <span class="input-group-text">F</span>
      </div>
    </td>
    <td>
      <div class="input-group input-group-sm">
        <input type="text" class="form-control" step="0.01" placeholder="0.00">
        <span class="input-group-text">坪</span>
      </div>
    </td>
    <td class="text-center">
      <button type="button" class="btn btn-danger btn-sm py-1 px-2 remove-floor-row"><i class="fas fa-trash"></i></button>
    </td>
  `;
  tbody.appendChild(tr);
});

document.addEventListener('click', e => {
  const btn = e.target.closest('.remove-floor-row');
  if (btn) btn.closest('tr')?.remove();
});

// ============ 招租價格預估：新增列 / 刪除列 ============
// TODO: 選擇房型後，AI 自動填入樂觀 / 保守 / 悲觀預估租金

function recalcExpectedRevenue() {
  const rows = document.querySelectorAll('#rentEstimateTable tbody tr');
  let totalOpt = 0, totalMid = 0, totalPes = 0;
  rows.forEach(tr => {
    const inputs = tr.querySelectorAll('input[type=number]');
    // inputs[0]=樓層, inputs[1]=樂觀, inputs[2]=保守, inputs[3]=悲觀
    totalOpt += parseFloat(inputs[1]?.value) || 0;
    totalMid += parseFloat(inputs[2]?.value) || 0;
    totalPes += parseFloat(inputs[3]?.value) || 0;
  });
  const el = document.getElementById('expectedRevenue');
  if (el) el.value = Math.round((totalOpt + totalMid + totalPes) / 3).toLocaleString();

  const setSpan = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = Math.round(v).toLocaleString(); };
  setSpan('rentOptSum', totalOpt);
  setSpan('rentMidSum', totalMid);
  setSpan('rentPesSum', totalPes);

  updateOpCost();
}

document.getElementById('addRentEstimateRow')?.addEventListener('click', () => {
  const tbody = document.querySelector('#rentEstimateTable tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><div class="input-group input-group-sm"><input type="number" class="form-control" placeholder="3"><span class="input-group-text">F</span></div></td>
    <td>
      <select class="form-select form-select-sm">
        <option value="">--請選擇--</option>
        <option>三房一廳</option>
        <option>三房二廳</option>
        <option>兩房一廳</option>
        <option>兩房二廳</option>
        <option>套房</option>
        <option>雅房</option>
      </select>
    </td>
    <td><div class="input-group input-group-sm"><input type="number" class="form-control rent-est" placeholder="0"><span class="input-group-text">元</span></div></td>
    <td><div class="input-group input-group-sm"><input type="number" class="form-control rent-est" placeholder="0"><span class="input-group-text">元</span></div></td>
    <td><div class="input-group input-group-sm"><input type="number" class="form-control rent-est" placeholder="0"><span class="input-group-text">元</span></div></td>
    <td class="text-center">
      <button type="button" class="btn btn-danger btn-sm py-1 px-2 remove-rent-row"><i class="fas fa-trash"></i></button>
    </td>
  `;
  tbody.appendChild(tr);
});

document.addEventListener('click', e => {
  const btn = e.target.closest('.remove-rent-row');
  if (btn) { btn.closest('tr')?.remove(); recalcExpectedRevenue(); }
});

document.querySelector('#rentEstimateTable')?.addEventListener('input', e => {
  if (e.target.classList.contains('rent-est')) recalcExpectedRevenue();
});

// ============ 室內設備：新增列 / 刪除列 / 自填切換 ============
document.getElementById('addEquipmentRow')?.addEventListener('click', () => {
  const tbody = document.querySelector('#equipmentTable tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <select class="form-select form-select-sm equipment-name">
        <option value="">--請選擇--</option>
        <option>冷氣</option>
        <option>熱水器</option>
        <option>瓦斯爐</option>
        <option>冰箱</option>
        <option>洗衣機</option>
        <option>抽油煙機</option>
        <option>電視機</option>
        <option data-custom="1">其他（自行填寫）</option>
      </select>
      <input type="text" class="form-control form-control-sm mt-1 equipment-custom" placeholder="自行填寫設備名稱" style="display:none;">
    </td>
    <td>
      <div class="input-group input-group-sm">
        <input type="number" class="form-control" value="0" min="0">
        <span class="input-group-text">台</span>
      </div>
    </td>
    <td class="text-center">
      <button type="button" class="btn btn-danger btn-sm py-1 px-2 remove-equipment-row"><i class="fas fa-trash"></i></button>
    </td>
  `;
  tbody.appendChild(tr);
});

document.addEventListener('click', e => {
  const btn = e.target.closest('.remove-equipment-row');
  if (btn) btn.closest('tr')?.remove();
});

// 選擇「其他」時顯示自填欄
document.addEventListener('change', e => {
  if (!e.target.classList.contains('equipment-name')) return;
  const opt = e.target.selectedOptions[0];
  const customInput = e.target.parentElement.querySelector('.equipment-custom');
  if (!customInput) return;
  customInput.style.display = opt?.dataset.custom ? '' : 'none';
  if (!opt?.dataset.custom) customInput.value = '';
});

// ============ 承租條件：模式切換 + 五年租金自動計算 ============
function setRaiseMode(mode) {
  const pctInput = document.getElementById('rentRaisePct');
  const pctSpan = document.getElementById('raisePctGroup');
  const amtInput = document.getElementById('rentRaiseAmt');
  const amtSpan = document.getElementById('raiseAmtGroup');
  if (!pctInput) return;
  const showPct = mode !== 'amount';
  pctInput.style.display = showPct ? '' : 'none';
  pctSpan.style.display = showPct ? '' : 'none';
  amtInput.style.display = showPct ? 'none' : '';
  amtSpan.style.display = showPct ? 'none' : '';
}

document.querySelectorAll('input[name="raiseMode"]').forEach(r => {
  r.addEventListener('change', e => {
    setRaiseMode(e.target.value);
    recalcRentTable();
  });
});

function recalcRentTable() {
  const base = parseFloat(document.getElementById('rentMonth')?.value);
  const years = parseInt(document.getElementById('leaseYear')?.value) || 0;
  const freeMonths = parseFloat(document.getElementById('freeLeaseMonth')?.value) || 0;
  const everyN = parseInt(document.getElementById('rentRaiseYear')?.value) || 0;
  const mode = document.querySelector('input[name="raiseMode"]:checked')?.value || 'percent';
  const pct = parseFloat(document.getElementById('rentRaisePct')?.value) || 0;
  const amt = parseFloat(document.getElementById('rentRaiseAmt')?.value) || 0;

  const tbody = document.getElementById('rentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (isNaN(base) || base <= 0 || years <= 0) return;

  let currentMonthly = base;
  for (let year = 1; year <= years; year++) {
    let delta = '—';
    if (year > 1 && everyN > 0 && year % everyN === 0) {
      if (mode === 'percent') {
        currentMonthly = Math.round(currentMonthly * (1 + pct / 100));
        delta = `${pct}%`;
      } else {
        currentMonthly = currentMonthly + amt;
        delta = `+${amt} 元`;
      }
    }
    const annualRent = Math.round(currentMonthly * 12 - (year === 1 ? freeMonths * base : 0));
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="text-center">第${year}年</td><td><div class="input-group input-group-sm"><input type="text" class="form-control text-end bg-light annual-rent" readonly value="${annualRent.toLocaleString()}"><span class="input-group-text">元</span></div></td><td><div class="input-group input-group-sm"><input type="text" class="form-control text-end bg-light rent-delta" readonly value="${delta}"></div></td><td><div class="input-group input-group-sm"><input type="text" class="form-control text-end bg-light fw-bold monthly-rent" readonly value="${currentMonthly.toLocaleString()}"><span class="input-group-text">元</span></div></td>`;
    tbody.appendChild(tr);
  }
  updateInvestKeys();
}

['rentMonth', 'leaseYear', 'freeLeaseMonth', 'rentRaiseYear', 'rentRaisePct', 'rentRaiseAmt'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', recalcRentTable);
});

// 初始化（若 placeholder 有值，畫面載入時也計算一次）
document.addEventListener('DOMContentLoaded', () => {
  recalcRentTable();
  updateOpCost();
  updateInvestKeys();
});

// ============ 營運成本估算 ============
function updateOpCost() {
  const expectedRev = parseFloat(
    (document.getElementById('expectedRevenue')?.value || '0').replace(/,/g, '')
  ) || 0;
  const rentMonth = parseFloat(document.getElementById('rentMonth')?.value) || 0;
  const taxRate   = parseFloat(document.getElementById('taxType')?.value) || 0.096;
  const insurance = parseFloat(document.getElementById('insuranceCost')?.value) || 0;

  const taxTypeEl = document.getElementById('taxType');
  const isCompany = taxTypeEl?.selectedOptions[0]?.textContent.trim() === '公司戶';

  const brokerageFee  = Math.round(expectedRev * 0.5);
  const mgmtFee       = Math.round((expectedRev - rentMonth) * 0.05);
  const personnelCost = Math.round(brokerageFee / 12 + mgmtFee);
  const repairCount   = Math.round(expectedRev * 0.5);
  const repairCost    = Math.round(repairCount / 12);
  const taxBase       = isCompany ? expectedRev : (expectedRev - rentMonth);
  const taxCost       = Math.round(taxBase * taxRate);
  const otherCost     = Math.round(insurance / 12);
  const total         = personnelCost + repairCost + taxCost + otherCost;

  const fmt    = n => n.toLocaleString();
  const setInp = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const setSp  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setInp('opBrokerageFee',   fmt(brokerageFee));
  setInp('opMgmtFee',        fmt(mgmtFee));
  setSp ('opPersonnelCost',  fmt(personnelCost));
  setInp('opRepairCount',    fmt(repairCount));
  setSp ('opRepairCost',     fmt(repairCost));
  setSp ('opTaxCost',        fmt(taxCost));
  setInp('opTaxRate',        (taxRate * 100).toFixed(1) + '%');
  setSp ('opOtherCost',      otherCost > 0 ? fmt(otherCost) : '-');
  setInp('opPersonnelTotal', fmt(total));

  // ── 三情境欄位 ──────────────────────────────────────────
  function revOf(id) {
    return parseFloat((document.getElementById(id)?.textContent || '0').replace(/,/g, '')) || 0;
  }
  function calc(rev) {
    const brokerage = Math.round(rev * 0.5 / 12);
    const mgmt      = Math.round((rev - rentMonth) * 0.05);
    const repair    = Math.round(rev * 0.5 / 12);
    const tax       = Math.round((isCompany ? rev : rev - rentMonth) * taxRate);
    const ins       = Math.round(insurance / 12);
    return { brokerage, mgmt, repair, tax, ins };
  }
  const s = {
    opt: calc(revOf('rentOptSum')),
    mid: calc(revOf('rentMidSum')),
    pes: calc(revOf('rentPesSum'))
  };
  [['Opt', s.opt], ['Mid', s.mid], ['Pes', s.pes]].forEach(([sfx, d]) => {
    setInp('opBrokerageFee' + sfx, fmt(d.brokerage));
    setInp('opMgmtFee'      + sfx, fmt(d.mgmt));
    setInp('opRepairCount'  + sfx, fmt(d.repair));
    setInp('opTaxCost'      + sfx, fmt(d.tax));
    setInp('opInsurance'    + sfx, fmt(d.ins));
    setInp('opTotal'        + sfx, fmt(d.brokerage + d.mgmt + d.repair + d.tax + d.ins));
  });

  updateInvestKeys();
}

document.getElementById('rentMonth')?.addEventListener('input', updateOpCost);

// ============ 投資關鍵指標 ============
function updateInvestKeys() {
  const fmt = n => Number.isFinite(n) ? n.toLocaleString() : '';
  const setInp = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };

  // 租期 / 免租期 — 直接帶入承租條件
  const leaseYear   = parseInt(document.getElementById('leaseYear')?.value) || 0;
  const freeMonth   = parseFloat(document.getElementById('freeLeaseMonth')?.value) || 0;
  setInp('investLeaseYear', leaseYear || '');
  setInp('investFreeMonth', freeMonth !== 0 ? freeMonth : '');

  // 啟動成本 = 啟動成本估算的預期投入成本總計
  const startCost = parseFloat(document.getElementById('total-cost')?.value) || 0;
  setInp('investStartCost', fmt(startCost));

  // 前五年平均收房租金 / 年平均租金 — 從租金表讀取月租金
  const monthlyRents = Array.from(
    document.querySelectorAll('#rentTableBody .monthly-rent')
  ).map(el => parseFloat((el.value || '0').replace(/,/g, '')) || 0);

  const first5Monthly = monthlyRents.slice(0, 5);
  const avg5yRent = first5Monthly.length
    ? Math.round(first5Monthly.reduce((s, v) => s + v, 0) / 5)
    : 0;
  const avgYearRent = monthlyRents.length && leaseYear
    ? Math.round(monthlyRents.reduce((s, v) => s + v, 0) / leaseYear)
    : 0;
  setInp('avg5yRent',   fmt(avg5yRent));
  setInp('avgYearRent', fmt(avgYearRent));

  // 營業收入 — 從預期營業收入帶入
  const expectedRev = parseFloat(
    (document.getElementById('expectedRevenue')?.value || '0').replace(/,/g, '')
  ) || 0;
  setInp('bizRevenue', fmt(expectedRev));

  // 價差 = 營業收入 − 年平均租金
  const spread = expectedRev - avgYearRent;
  setInp('bizSpread', fmt(spread));

  // 營業成本 — 從營運成本估算人事及管理支出帶入
  const opCost = parseFloat(
    (document.getElementById('opPersonnelTotal')?.value || '0').replace(/,/g, '')
  ) || 0;
  setInp('bizCost', fmt(opCost));

  // 營業淨利 = 價差 − 營業成本
  const netProfit = spread - opCost;
  setInp('bizNetProfit', fmt(netProfit));

  updateIrrMatrix();
}

// 承租條件變動時同步更新指標
['leaseYear', 'freeLeaseMonth', 'investAdMonth', 'investDecoMonth'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateInvestKeys);
});

// ============ 投報率詳盡分析（3×3 矩陣） ============
function updateIrrMatrix() {
  const getNum = id => parseFloat((document.getElementById(id)?.value || '0').replace(/,/g, '')) || 0;
  const getSpanNum = id => parseFloat((document.getElementById(id)?.textContent || '0').replace(/,/g, '')) || 0;

  const startCost  = getNum('investStartCost');
  const avg5yRent  = getNum('avg5yRent');       // 月均（前五年）
  const avgYearRent = getNum('avgYearRent');    // 月均（全租期）
  const leaseYear  = parseInt(document.getElementById('leaseYear')?.value) || 0;
  const freeMonth  = parseFloat(document.getElementById('freeLeaseMonth')?.value) || 0;
  const decoMonth  = parseFloat(document.getElementById('investDecoMonth')?.value) || 0;
  const adMonth    = parseFloat(document.getElementById('investAdMonth')?.value) || 0;

  const revOpt = getSpanNum('rentOptSum');
  const revMid = getSpanNum('rentMidSum');
  const revPes = getSpanNum('rentPesSum');

  const opOpt = parseFloat((document.getElementById('opTotalOpt')?.value || '0').replace(/,/g, '')) || 0;
  const opMid = parseFloat((document.getElementById('opTotalMid')?.value || '0').replace(/,/g, '')) || 0;
  const opPes = parseFloat((document.getElementById('opTotalPes')?.value || '0').replace(/,/g, '')) || 0;

  const OCC = { opt: 1.0, mid: 0.95, pes: 0.90 };
  const REV = { opt: revOpt, mid: revMid, pes: revPes };
  const OP  = { opt: opOpt, mid: opMid, pes: opPes };

  const SUGGEST_PAYBACK = 2;   // 年
  const SUGGEST_IRR     = 0.50;

  const leaseMon = leaseYear * 12;
  const waitMon  = Math.max(decoMonth + adMonth - freeMonth, 0);

  let score = 0;

  document.querySelectorAll('#irrMatrix .matrix-cell').forEach(cell => {
    const rent = cell.dataset.rent;
    const occ  = cell.dataset.occ;
    if (!rent || !occ) return;

    const rev    = REV[rent] * OCC[occ];   // 月收入（情境）
    const opCost = OP[rent];               // 月營運成本（對應租金情境）
    const net    = rev - avg5yRent - opCost;

    let paybackYr;
    if (net <= 0) {
      paybackYr = 0;
    } else if (startCost <= 0) {
      paybackYr = 0;
    } else {
      const raw = (startCost / net + decoMonth + adMonth - freeMonth) / 12;
      paybackYr = Math.max(raw, 0);
    }

    // 年投報率
    let irrRate = 0;
    if (startCost > 0 && leaseYear > 0) {
      const netForIrr = REV[rent] * OCC[occ] - avgYearRent - OP[rent];
      irrRate = (((netForIrr * (leaseMon - waitMon)) / startCost) - 1) / leaseYear;
    }

    const invest = startCost > 0 && irrRate >= SUGGEST_IRR && paybackYr <= SUGGEST_PAYBACK;
    if (invest) score += 15;

    cell.querySelector('.irr-payback').textContent =
      paybackYr === 0 ? '0 年' : paybackYr.toFixed(2) + ' 年';
    cell.querySelector('.irr-rate').textContent =
      isFinite(irrRate) ? (irrRate * 100).toFixed(1) + '%' : '—';
    const badge = cell.querySelector('.irr-badge');
    if (badge) {
      badge.textContent = invest ? '是' : '否';
      badge.className = 'badge mt-1 ' + (invest ? 'bg-success' : 'bg-secondary');
    }
  });

  const scoreEl = document.getElementById('totalScore');
  if (scoreEl) scoreEl.textContent = score;
}

// ============ 成本主項：選擇主項時，子項下拉自動帶入對應選項 ============
const COST_SUB_OPTIONS = {
  decoration: [
    { label: '衛浴工程', unit: '間' },
    { label: '防水工程', unit: '坪' },
    { label: '地板工程', unit: '坪' },
    { label: '油漆工程', unit: '式' },
    { label: '水電工程', unit: '元' }
  ],
  cleaning: [
    { label: '車趟', unit: '車' },
    { label: '粗清', unit: '式' }
  ],
  appliance: [
    { label: '軟裝設計', unit: '次' },
    { label: '軟裝品', unit: '式' },
    { label: '冷氣-客廳', unit: '台' },
    { label: '冷氣-房間', unit: '台' },
    { label: '電冰箱', unit: '台' },
    { label: '洗衣機', unit: '台' },
    { label: '電視', unit: '台' },
    { label: '床組', unit: '個' },
    { label: '沙發', unit: '個' },
    { label: '書桌椅', unit: '套' },
    { label: '瓦斯爐', unit: '個' },
    { label: '抽油煙機', unit: '個' },
    { label: '燈具', unit: '式' }
  ],
  development: [
    { label: '開發仲介費', unit: '元' },
    { label: '開發業務獎金', unit: '元' }
  ]
};

document.addEventListener('change', e => {
  if (!e.target.classList.contains('cost-main-select')) return;
  const main = e.target.closest('.cost-main');
  const key = e.target.value;
  const opts = COST_SUB_OPTIONS[key] || [];
  main.querySelectorAll('.sub-row .sub-item-select').forEach(sel => {
    sel.innerHTML = '<option value="">--請選擇--</option>' +
      opts.map(o => `<option data-unit="${o.unit}">${o.label}</option>`).join('') +
      '<option value="__other__">其他（自行填寫）</option>';
    const custom = sel.closest('td').querySelector('.sub-item-custom');
    if (custom) custom.style.display = 'none';
  });
});

// 子項：選擇後自動帶入單位，選「其他」時顯示自填欄
document.addEventListener('change', e => {
  if (!e.target.classList.contains('sub-item-select')) return;
  const opt = e.target.selectedOptions[0];
  const row = e.target.closest('.sub-row');
  const unitText = row.querySelector('.unit-text');
  const custom = e.target.closest('td').querySelector('.sub-item-custom');
  const isOther = e.target.value === '__other__';
  if (custom) custom.style.display = isOther ? '' : 'none';
  if (unitText) unitText.textContent = isOther ? '' : (opt?.dataset.unit || '');
});
