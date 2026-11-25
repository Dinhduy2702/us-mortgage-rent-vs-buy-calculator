/**
 * HomeMath US - 2026 Mortgage Payment, PMI Auto-Drop, Rent vs. Buy & Refinance Engine
 */
(function () {
  "use strict";

  const CFG = window.HOMEMATH_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  // 2026 Average Effective Property Tax Rates across all 50 US States + DC (%)
  const STATE_PROP_TAX = [
    ["AL", "Alabama", 0.40], ["AK", "Alaska", 1.16], ["AZ", "Arizona", 0.56], ["AR", "Arkansas", 0.61],
    ["CA", "California", 0.71], ["CO", "Colorado", 0.49], ["CT", "Connecticut", 1.96], ["DE", "Delaware", 0.55],
    ["DC", "District of Columbia", 0.57], ["FL", "Florida", 0.82], ["GA", "Georgia", 0.83], ["HI", "Hawaii", 0.27],
    ["ID", "Idaho", 0.56], ["IL", "Illinois", 2.08], ["IN", "Indiana", 0.77], ["IA", "Iowa", 1.43],
    ["KS", "Kansas", 1.34], ["KY", "Kentucky", 0.80], ["LA", "Louisiana", 0.55], ["ME", "Maine", 1.17],
    ["MD", "Maryland", 1.00], ["MA", "Massachusetts", 1.12], ["MI", "Michigan", 1.32], ["MN", "Minnesota", 1.05],
    ["MS", "Mississippi", 0.75], ["MO", "Missouri", 0.91], ["MT", "Montana", 0.74], ["NE", "Nebraska", 1.54],
    ["NV", "Nevada", 0.50], ["NH", "New Hampshire", 1.77], ["NJ", "New Jersey", 2.23], ["NM", "New Mexico", 0.72],
    ["NY", "New York", 1.62], ["NC", "North Carolina", 0.73], ["ND", "North Dakota", 0.98], ["OH", "Ohio", 1.43],
    ["OK", "Oklahoma", 0.85], ["OR", "Oregon", 0.86], ["PA", "Pennsylvania", 1.38], ["RI", "Rhode Island", 1.35],
    ["SC", "South Carolina", 0.53], ["SD", "South Dakota", 1.08], ["TN", "Tennessee", 0.56], ["TX", "Texas", 1.63],
    ["UT", "Utah", 0.52], ["VT", "Vermont", 1.78], ["VA", "Virginia", 0.76], ["WA", "Washington", 0.84],
    ["WV", "West Virginia", 0.55], ["WI", "Wisconsin", 1.51], ["WY", "Wyoming", 0.56]
  ];

  const TOOL_META = {
    mortgage: {
      heading: "2026 US Mortgage Payment & True Monthly Cost Calculator",
      desc: "Calculate true all-in monthly housing cost — Principal & Interest, 50-state property tax, homeowners insurance, HOA, and PMI that automatically drops off once LTV hits 80%."
    },
    rentbuy: {
      heading: "2026 Rent vs. Buy Brutal Math (Home Equity vs. S&P 500)",
      desc: "Compare 5-, 10-, and 30-year net worth between buying a home vs. renting and investing your down payment & monthly savings into the S&P 500 at 8%–10%."
    },
    refi: {
      heading: "2026 Mortgage Refinance Break-Even & Extra Payment Payoff",
      desc: "Find your exact refinance break-even month after closing costs and see how adding extra monthly principal crushes lifetime interest and shaves years off your loan."
    }
  };

  const PRESETS = {
    mortgage: [
      { label: "Median US Home ($435k · 10% Down · TX)", values: { mgPrice: 435000, mgDownPct: 10, mgRate: 6.5, mgTerm: "30", mgState: "TX", mgPropTaxPct: 1.63, mgIns: 2100, mgHoa: 75, mgPmiPct: 0.65 } },
      { label: "California Coastal ($850k · 20% Down · CA)", values: { mgPrice: 850000, mgDownPct: 20, mgRate: 6.375, mgTerm: "30", mgState: "CA", mgPropTaxPct: 0.71, mgIns: 2400, mgHoa: 180, mgPmiPct: 0.65 } },
      { label: "First-Time 5% Down ($360k · FL)", values: { mgPrice: 360000, mgDownPct: 5, mgRate: 6.625, mgTerm: "30", mgState: "FL", mgPropTaxPct: 0.82, mgIns: 3200, mgHoa: 120, mgPmiPct: 0.75 } },
      { label: "15-Year Crusher ($500k · 20% Down · CO)", values: { mgPrice: 500000, mgDownPct: 20, mgRate: 5.75, mgTerm: "15", mgState: "CO", mgPropTaxPct: 0.49, mgIns: 1900, mgHoa: 50, mgPmiPct: 0.65 } }
    ],
    rentbuy: [
      { label: "2026 High-Rate Reality ($500k vs $2,400 Rent)", values: { rbHomePrice: 500000, rbDownPct: 20, rbRate: 6.5, rbRent: 2400, rbSpReturn: 9.0, rbApprec: 3.5, rbRentGrowth: 3.5, rbCarryPct: 2.4, rbSellCostPct: 6.0 } },
      { label: "Bay Area / NYC ($900k vs $3,500 Rent)", values: { rbHomePrice: 900000, rbDownPct: 20, rbRate: 6.5, rbRent: 3500, rbSpReturn: 9.0, rbApprec: 4.0, rbRentGrowth: 3.5, rbCarryPct: 2.1, rbSellCostPct: 6.0 } },
      { label: "Buy-Friendly Midwest ($320k vs $2,200 Rent)", values: { rbHomePrice: 320000, rbDownPct: 20, rbRate: 6.25, rbRent: 2200, rbSpReturn: 8.5, rbApprec: 3.5, rbRentGrowth: 4.0, rbCarryPct: 2.5, rbSellCostPct: 6.0 } }
    ],
    refi: [
      { label: "Drop 7.25% → 5.875% ($400k + $250 Extra)", values: { rfBalance: 400000, rfCurRate: 7.25, rfCurYrs: 28, rfNewRate: 5.875, rfNewTerm: "30", rfClosing: 4500, rfExtra: 250 } },
      { label: "Switch to 15-Year (7.0% → 5.5%)", values: { rfBalance: 350000, rfCurRate: 7.0, rfCurYrs: 27, rfNewRate: 5.5, rfNewTerm: "15", rfClosing: 4000, rfExtra: 0 } },
      { label: "Keep Rate + $400/mo Extra Principal", values: { rfBalance: 420000, rfCurRate: 6.5, rfCurYrs: 29, rfNewRate: 6.5, rfNewTerm: "30", rfClosing: 0, rfExtra: 400 } }
    ]
  };

  let activeTool = "mortgage";
  let lastMgRows = [];
  let lastRbRows = [];
  let lastRfRows = [];

  const fmtUSD = (n) => {
    const v = Number.isFinite(n) ? n : 0;
    return (v < 0 ? "-" : "") + "$" + Math.round(Math.abs(v)).toLocaleString("en-US");
  };
  const numVal = (id, fb = 0) => {
    const el = $(id);
    if (!el) return fb;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : fb;
  };
  function showToast(msg) {
    const box = $("toastBox");
    if (!box) return;
    box.textContent = msg;
    box.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { box.hidden = true; }, 2600);
  }
  function calcMonthlyPI(principal, annualRatePct, years) {
    if (principal <= 0 || years <= 0) return 0;
    const r = (annualRatePct / 100) / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  /* ================= TAB 1: MORTGAGE PAYMENT & PMI AUTO-DROP ================= */
  function computeMortgage() {
    const price = Math.max(10000, numVal("mgPrice", 435000));
    const downPct = Math.max(0, Math.min(80, numVal("mgDownPct", 10)));
    const rate = Math.max(0.5, Math.min(20, numVal("mgRate", 6.5)));
    const term = Math.max(5, Math.min(40, parseInt($("mgTerm").value, 10) || 30));
    const propTaxPct = Math.max(0, Math.min(6, numVal("mgPropTaxPct", 1.63)));
    const insYr = Math.max(0, numVal("mgIns", 2100));
    const hoaMo = Math.max(0, numVal("mgHoa", 75));
    const pmiPct = Math.max(0, Math.min(3, numVal("mgPmiPct", 0.65)));

    const downAmt = price * (downPct / 100);
    const loan = Math.max(0, price - downAmt);
    const piMo = calcMonthlyPI(loan, rate, term);
    const propTaxMo = (price * (propTaxPct / 100)) / 12;
    const insMo = insYr / 12;
    const hasInitPmi = downPct < 20 && pmiPct > 0 && loan > 0;
    const initPmiMo = hasInitPmi ? (loan * (pmiPct / 100)) / 12 : 0;

    const totalMoInit = piMo + propTaxMo + insMo + hoaMo + initPmiMo;
    const totalMoAfterPmi = piMo + propTaxMo + insMo + hoaMo;

    // Month-by-month amortization with PMI auto-drop when balance <= 80% of original price
    const ltv80Target = price * 0.80;
    const r = (rate / 100) / 12;
    let bal = loan;
    let pmiDropMonth = hasInitPmi ? null : 0;
    let totalInterest = 0;
    let totalPmiPaid = 0;
    const yearly = [];

    for (let yr = 1; yr <= term; yr++) {
      let yrPrin = 0, yrInt = 0, yrPmi = 0;
      for (let m = 1; m <= 12; m++) {
        if (bal <= 0.01) break;
        const mNum = (yr - 1) * 12 + m;
        const interest = bal * r;
        const principal = Math.min(bal, Math.max(0, piMo - interest));
        if (hasInitPmi && bal > ltv80Target) {
          yrPmi += initPmiMo;
          totalPmiPaid += initPmiMo;
        } else if (hasInitPmi && pmiDropMonth === null) {
          pmiDropMonth = mNum;
        }
        bal = Math.max(0, bal - principal);
        yrPrin += principal;
        yrInt += interest;
        totalInterest += interest;
      }
      yearly.push({ yr, prin: yrPrin, int: yrInt, pmi: yrPmi, bal, ltv: (bal / price) * 100 });
    }

    $("mgTotalMo").textContent = fmtUSD(totalMoInit);
    $("mgSubline").textContent = hasInitPmi && pmiDropMonth
      ? `Loan: ${fmtUSD(loan)} · Drops to ${fmtUSD(totalMoAfterPmi)}/mo in Month ${pmiDropMonth} (Yr ${(pmiDropMonth / 12).toFixed(1)})`
      : `Loan: ${fmtUSD(loan)} (${downPct.toFixed(1)}% down = ${fmtUSD(downAmt)}) · $0 PMI`;

    const badge = $("mgPmiBadge");
    if (!hasInitPmi) {
      badge.textContent = "Zero PMI (20%+ Down)";
      badge.className = "status-pill pass tabular";
    } else {
      badge.textContent = `PMI Drops Mo ${pmiDropMonth || "--"}`;
      badge.className = "status-pill warn tabular";
    }

    $("mgPiMo").textContent = fmtUSD(piMo) + "/mo";
    $("mgTaxInsMo").textContent = fmtUSD(propTaxMo + insMo) + "/mo";
    $("mgPmiMo").textContent = fmtUSD(initPmiMo) + "/mo";
    $("mgTotalInt").textContent = fmtUSD(totalInterest);

    // 4-color stacked bar
    const segs = [
      { label: "Principal & Interest", val: piMo, color: "#0F766E" },
      { label: "Property Tax", val: propTaxMo, color: "#D97706" },
      { label: "Ins. & HOA", val: insMo + hoaMo, color: "#475569" },
      { label: "PMI", val: initPmiMo, color: "#DC2626" }
    ];
    $("mgStackBar").innerHTML = segs.map((s) => {
      const pct = totalMoInit > 0 ? (s.val / totalMoInit) * 100 : 0;
      return pct > 0.3 ? `<div class="stack-seg" style="width:${pct.toFixed(2)}%; background:${s.color};"></div>` : "";
    }).join("");
    $("mgStackLegend").innerHTML = segs.filter((s) => s.val > 0).map((s) => {
      const pct = totalMoInit > 0 ? (s.val / totalMoInit) * 100 : 0;
      return `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}: <strong>${fmtUSD(s.val)}</strong> (${pct.toFixed(1)}%)</span>`;
    }).join("");

    // SVG 30-year stacked bar + balance line chart
    renderAmortChart(yearly, loan);

    // Insight
    const safeIncome28 = (totalMoInit * 12) / 0.28;
    const pmiNote = hasInitPmi
      ? `Your <strong>${fmtUSD(initPmiMo)}/mo PMI</strong> automatically terminates in <strong>Month ${pmiDropMonth} (Year ${(pmiDropMonth / 12).toFixed(1)})</strong> when LTV hits 80% (total PMI cost: <strong>${fmtUSD(totalPmiPaid)}</strong>).`
      : `Putting ${downPct.toFixed(0)}% down eliminates PMI completely, saving you thousands in non-equity fees.`;
    $("mgInsightBox").innerHTML = `<strong>2026 HomeMath Verdict:</strong> Under the lender 28% front-end rule, this ${fmtUSD(totalMoInit)}/mo payment fits a household gross income of <strong>${fmtUSD(safeIncome28)}/yr</strong>. ${pmiNote}`;

    // Table
    lastMgRows = yearly.map((y) => [
      `Year ${y.yr}`, fmtUSD(y.prin), fmtUSD(y.int), fmtUSD(y.pmi), fmtUSD(y.bal), y.ltv.toFixed(1) + "%"
    ]);
    $("mgTableBody").innerHTML = yearly.map((y) => {
      const dropHit = hasInitPmi && pmiDropMonth && Math.ceil(pmiDropMonth / 12) === y.yr;
      const cls = dropHit ? ' class="is-total"' : "";
      const tag = dropHit ? " ★ PMI Drops" : "";
      return `<tr${cls}><td>Year ${y.yr}${tag}</td><td class="num">${fmtUSD(y.prin)}</td><td class="num">${fmtUSD(y.int)}</td><td class="num">${fmtUSD(y.pmi)}</td><td class="num">${fmtUSD(y.bal)}</td><td class="num">${y.ltv.toFixed(1)}%</td></tr>`;
    }).join("");
  }

  function renderAmortChart(yearly, initLoan) {
    const host = $("mgChartHost");
    if (!host || !yearly.length) return;
    const W = 560, H = 148, padL = 8, padR = 8, padT = 12, padB = 22;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxAnnual = Math.max(1, ...yearly.map((y) => y.prin + y.int));
    const barW = plotW / yearly.length;

    let bars = "";
    const pts = [];
    yearly.forEach((y, i) => {
      const x = padL + i * barW + barW * 0.14;
      const w = Math.max(2, barW * 0.72);
      const totH = ((y.prin + y.int) / maxAnnual) * plotH;
      const prinH = (y.prin / maxAnnual) * plotH;
      const intH = totH - prinH;
      const yIntTop = padT + plotH - totH;
      const yPrinTop = padT + plotH - prinH;
      bars += `<rect x="${x.toFixed(1)}" y="${yIntTop.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, intH).toFixed(1)}" fill="#D97706" opacity="0.82" rx="1"/>`;
      bars += `<rect x="${x.toFixed(1)}" y="${yPrinTop.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, prinH).toFixed(1)}" fill="#0F766E" opacity="0.92" rx="1"/>`;
      const cx = padL + (i + 0.5) * barW;
      const cy = padT + plotH - (initLoan > 0 ? (y.bal / initLoan) * plotH : 0);
      pts.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
    });

    const ticks = [1, Math.round(yearly.length / 2), yearly.length].map((yr) => {
      const x = padL + ((yr - 0.5) / yearly.length) * plotW;
      return `<text x="${x.toFixed(1)}" y="${H - 5}" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.65">Yr ${yr}</text>`;
    }).join("");

    host.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Principal vs interest amortization chart">
      ${bars}
      <polyline fill="none" stroke="#1E293B" stroke-width="2" points="${pts.join(" ")}"/>
      ${ticks}
    </svg>`;
  }

  /* ================= TAB 2: RENT VS. BUY 2026 BRUTAL MATH ================= */
  function computeRentBuy() {
    const price = Math.max(50000, numVal("rbHomePrice", 500000));
    const downPct = Math.max(3, Math.min(80, numVal("rbDownPct", 20)));
    const rate = Math.max(1, Math.min(15, numVal("rbRate", 6.5)));
    const rent0 = Math.max(300, numVal("rbRent", 2400));
    const spRet = Math.max(0, Math.min(20, numVal("rbSpReturn", 9.0))) / 100;
    const apprec = Math.max(-5, Math.min(15, numVal("rbApprec", 3.5))) / 100;
    const rentGrow = Math.max(0, Math.min(15, numVal("rbRentGrowth", 3.5))) / 100;
    const carryPct = Math.max(0.5, Math.min(8, numVal("rbCarryPct", 2.4))) / 100;
    const sellCostPct = Math.max(0, Math.min(12, numVal("rbSellCostPct", 6.0))) / 100;

    const downAmt = price * (downPct / 100);
    const buyClose = price * 0.03; // 3% buyer closing costs
    const loan = price - downAmt;
    const piMo = calcMonthlyPI(loan, rate, 30);
    const rLoan = (rate / 100) / 12;
    const rSpMo = Math.pow(1 + spRet, 1 / 12) - 1;

    let bal = loan;
    let homeVal = price;
    let curRent = rent0;
    let renterPort = downAmt + buyClose; // Renter invests down payment + closing costs on Day 0
    let breakEvenYr = null;
    const yr1BuyMo = piMo + (price * carryPct) / 12;
    const yr1Diff = yr1BuyMo - rent0;

    const snaps = {};
    const checkpoints = [1, 3, 5, 7, 10, 15, 20, 30];

    for (let yr = 1; yr <= 30; yr++) {
      const monthlyCarry = (homeVal * carryPct) / 12;
      const buyerMo = piMo + monthlyCarry;
      for (let m = 1; m <= 12; m++) {
        const interest = bal * rLoan;
        const principal = Math.min(bal, Math.max(0, piMo - interest));
        bal = Math.max(0, bal - principal);

        // Monthly cash-flow difference invested (or drawn if rent > buy)
        const monthlySavingsForRenter = buyerMo - curRent;
        renterPort = renterPort * (1 + rSpMo) + monthlySavingsForRenter;
      }
      homeVal = homeVal * (1 + apprec);
      curRent = curRent * (1 + rentGrow);

      const buyerNetEquity = Math.max(0, homeVal * (1 - sellCostPct) - bal);
      const diff = buyerNetEquity - renterPort;
      if (diff >= 0 && breakEvenYr === null) breakEvenYr = yr;
      if (checkpoints.includes(yr)) {
        snaps[yr] = { yr, buyer: buyerNetEquity, renter: renterPort, diff };
      }
    }

    const s5 = snaps[5], s10 = snaps[10], s30 = snaps[30];
    const win10 = s10.diff >= 0 ? "Buying Wins" : "Rent + S&P 500 Wins";
    $("rbWinnerHero").textContent = `${win10} (${s10.diff >= 0 ? "+" : ""}${fmtUSD(s10.diff)})`;
    $("rbWinnerSub").textContent = breakEvenYr
      ? `Buying catches up to Rent + S&P 500 in Year ${breakEvenYr}`
      : `At ${(spRet * 100).toFixed(1)}% S&P 500 return, Renting + Investing stays ahead all 30 years`;

    const badge = $("rbBreakEvenBadge");
    badge.textContent = breakEvenYr ? `Break-Even: Yr ${breakEvenYr}` : "Rent Wins 30 Yrs";
    badge.className = "status-pill tabular " + (breakEvenYr && breakEvenYr <= 10 ? "pass" : "warn");

    const fmtGap = (d) => (d >= 0 ? `Buy +${fmtUSD(d)}` : `Rent +${fmtUSD(Math.abs(d))}`);
    $("rbGap5").textContent = fmtGap(s5.diff);
    $("rbGap10").textContent = fmtGap(s10.diff);
    $("rbGap30").textContent = fmtGap(s30.diff);
    $("rbMoDiff").textContent = (yr1Diff >= 0 ? `Buy +${fmtUSD(yr1Diff)}` : `Rent +${fmtUSD(Math.abs(yr1Diff))}`) + "/mo";

    $("rbInsightBox").innerHTML = `<strong>Brutal Math Reality Check:</strong> In Year 1, buying costs <strong>${fmtUSD(yr1BuyMo)}/mo</strong> (P&amp;I + ${(carryPct * 100).toFixed(1)}% tax/ins/maint) vs. <strong>${fmtUSD(rent0)}/mo</strong> rent. Investing your <strong>${fmtUSD(downAmt + buyClose)}</strong> upfront cash + monthly savings at ${(spRet * 100).toFixed(1)}% compounds to <strong>${fmtUSD(s10.renter)}</strong> by Year 10 vs. <strong>${fmtUSD(s10.buyer)}</strong> net home equity.`;

    lastRbRows = checkpoints.map((yr) => {
      const s = snaps[yr];
      return [`Year ${yr}`, fmtUSD(s.buyer), fmtUSD(s.renter), (s.diff >= 0 ? "+" : "") + fmtUSD(s.diff), s.diff >= 0 ? "Buying" : "Rent + S&P 500"];
    });
    $("rbTableBody").innerHTML = checkpoints.map((yr) => {
      const s = snaps[yr];
      const cls = yr === 10 || yr === 30 ? ' class="is-total"' : "";
      return `<tr${cls}><td>Year ${yr}</td><td class="num">${fmtUSD(s.buyer)}</td><td class="num">${fmtUSD(s.renter)}</td><td class="num">${s.diff >= 0 ? "+" : ""}${fmtUSD(s.diff)}</td><td class="num">${s.diff >= 0 ? "Buying" : "Rent + S&P 500"}</td></tr>`;
    }).join("");
  }

  /* ================= TAB 3: REFINANCE BREAK-EVEN & EXTRA PAYOFF ================= */
  function simLoan(balance, ratePct, termYrs, extraMo) {
    const baseMo = calcMonthlyPI(balance, ratePct, termYrs);
    const r = (ratePct / 100) / 12;
    let bal = balance, months = 0, totalInt = 0;
    while (bal > 0.01 && months < 600) {
      months++;
      const interest = bal * r;
      const prin = Math.min(bal, Math.max(0, baseMo + extraMo - interest));
      if (prin <= 0) break;
      bal -= prin;
      totalInt += interest;
    }
    return { baseMo, outflow: baseMo + extraMo, months, totalInt };
  }

  function computeRefi() {
    const balance = Math.max(10000, numVal("rfBalance", 400000));
    const curRate = Math.max(1, Math.min(18, numVal("rfCurRate", 7.25)));
    const curYrs = Math.max(1, Math.min(30, numVal("rfCurYrs", 28)));
    const newRate = Math.max(1, Math.min(15, numVal("rfNewRate", 5.875)));
    const newTerm = Math.max(5, Math.min(30, parseInt($("rfNewTerm").value, 10) || 30));
    const closing = Math.max(0, numVal("rfClosing", 4500));
    const extra = Math.max(0, numVal("rfExtra", 250));

    const keep = simLoan(balance, curRate, curYrs, 0);
    const refiOnly = simLoan(balance, newRate, newTerm, 0);
    const refiExtra = simLoan(balance, newRate, newTerm, extra);

    const moRelief = keep.baseMo - refiOnly.baseMo;
    const breakEvenMo = moRelief > 0 && closing > 0 ? Math.ceil(closing / moRelief) : (closing === 0 && moRelief > 0 ? 1 : null);

    const saveRefiOnly = keep.totalInt - (refiOnly.totalInt + closing);
    const saveRefiExtra = keep.totalInt - (refiExtra.totalInt + closing);
    const monthsShaved = Math.max(0, keep.months - refiExtra.months);
    const yrsShavedStr = `${Math.floor(monthsShaved / 12)}y ${monthsShaved % 12}m`;

    $("rfTotalSaved").textContent = (saveRefiExtra >= 0 ? "+" : "") + fmtUSD(saveRefiExtra);
    $("rfSubline").textContent = breakEvenMo
      ? `Refi Break-Even: ${breakEvenMo} months (${(breakEvenMo / 12).toFixed(1)} yrs) · Shaves ${yrsShavedStr} off payoff`
      : `Monthly payment does not drop (shorter term or equal rate) · Shaves ${yrsShavedStr} off payoff`;

    const badge = $("rfBadge");
    if (breakEvenMo && breakEvenMo <= 36) {
      badge.textContent = `Fast Break-Even (${breakEvenMo} mo)`;
      badge.className = "status-pill pass tabular";
    } else if (saveRefiExtra > 0) {
      badge.textContent = `Saves ${fmtUSD(saveRefiExtra)}`;
      badge.className = "status-pill pass tabular";
    } else {
      badge.textContent = "Keep Current Loan";
      badge.className = "status-pill warn tabular";
    }

    $("rfCurMo").textContent = fmtUSD(keep.baseMo) + "/mo";
    $("rfNewMo").textContent = fmtUSD(refiOnly.baseMo) + "/mo";
    $("rfMoDelta").textContent = (moRelief >= 0 ? "-" : "+") + fmtUSD(Math.abs(moRelief)) + "/mo";
    $("rfTimeSaved").textContent = yrsShavedStr;

    const extraAloneSaved = refiOnly.totalInt - refiExtra.totalInt;
    $("rfInsightBox").innerHTML = `<strong>Refi + Extra Principal Verdict:</strong> Refinancing from ${curRate.toFixed(2)}% to ${newRate.toFixed(2)}% changes your required P&amp;I by <strong>${moRelief >= 0 ? "-" : "+"}${fmtUSD(Math.abs(moRelief))}/mo</strong>${breakEvenMo ? ` (recouping your ${fmtUSD(closing)} closing costs in <strong>${breakEvenMo} months</strong>)` : ""}. Adding <strong>${fmtUSD(extra)}/mo</strong> in extra principal wipes out an additional <strong>${fmtUSD(extraAloneSaved)}</strong> of pure interest!`;

    const fmtYm = (m) => `${Math.floor(m / 12)}y ${m % 12}m`;
    const rows = [
      ["1. Keep Current Loan", fmtUSD(keep.outflow) + "/mo", fmtYm(keep.months), fmtUSD(keep.totalInt), "$0 (Baseline)"],
      ["2. Refinance Only (Incl. Closing)", fmtUSD(refiOnly.outflow) + "/mo", fmtYm(refiOnly.months), fmtUSD(refiOnly.totalInt + closing), (saveRefiOnly >= 0 ? "+" : "") + fmtUSD(saveRefiOnly)],
      ["3. Refinance + Extra Principal", fmtUSD(refiExtra.outflow) + "/mo", fmtYm(refiExtra.months), fmtUSD(refiExtra.totalInt + closing), (saveRefiExtra >= 0 ? "+" : "") + fmtUSD(saveRefiExtra)]
    ];
    lastRfRows = rows;
    $("rfTableBody").innerHTML = rows.map((r, i) => `<tr${i === 2 ? ' class="is-total"' : ""}><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td><td class="num">${r[4]}</td></tr>`).join("");
  }

  /* ================= UI WIRING, PRESETS, SHARE URL & CSV ================= */
  function populateStates() {
    const sel = $("mgState");
    if (!sel) return;
    sel.innerHTML = STATE_PROP_TAX.map(([c, n, r]) => `<option value="${c}">${n} (${c}) — ${r.toFixed(2)}%</option>`).join("");
    sel.value = "TX";
    sel.addEventListener("change", () => {
      const match = STATE_PROP_TAX.find(([c]) => c === sel.value);
      if (match) $("mgPropTaxPct").value = match[2].toFixed(2);
      recomputeAll();
    });
  }

  function renderPresets() {
    const row = $("quickPresetsRow");
    const list = PRESETS[activeTool] || [];
    row.innerHTML = list.map((p, i) => `<button type="button" class="preset-chip" data-idx="${i}">${p.label}</button>`).join("");
    row.querySelectorAll(".preset-chip").forEach((b) => {
      b.addEventListener("click", () => {
        const p = list[parseInt(b.dataset.idx, 10)];
        Object.keys(p.values).forEach((k) => { if ($(k)) $(k).value = p.values[k]; });
        recomputeAll();
        showToast("Loaded scenario: " + p.label);
      });
    });
  }

  function renderOffersAndEco() {
    const grid = $("offersGrid");
    if (grid && CFG.affiliates) {
      grid.innerHTML = CFG.affiliates.map((o) => `
        <article class="offer-card">
          <span class="offer-badge">${o.badge}</span>
          <h3>${o.title}</h3>
          <p>${o.summary}</p>
          <a class="btn btn-primary btn-sm" href="${o.url}" target="_blank" rel="noopener noreferrer">${o.ctaLabel}</a>
        </article>
      `).join("");
    }
    const wUrl = CFG.ecosystem && CFG.ecosystem.gumroadWealthOs && CFG.ecosystem.gumroadWealthOs.url;
    const rUrl = CFG.ecosystem && CFG.ecosystem.gumroadRentalOs && CFG.ecosystem.gumroadRentalOs.url;
    document.querySelectorAll("[data-result-cta]").forEach((slot) => {
      const isRb = slot.dataset.resultCta === "rentbuy";
      const url = isRb ? rUrl : wUrl;
      const lbl = isRb ? "Get Rental & BRRRR OS ($0 / $24)" : "Get Wealth OS ($0 Lite / $19)";
      const title = isRb ? "Comparing Rental Cash Flow or House Hacking?" : "Track Your 2026 Mortgage, 50/30/20 Budget & Net Worth";
      const sub = isRb ? "Pair HomeMath US with our 2026 Schedule E & BRRRR Google Sheet OS." : "Pair HomeMath US with our 2026 US Personal Finance & Wealth OS on Gumroad.";
      slot.innerHTML = `<div><strong>${title}</strong><span>${sub}</span></div><a class="btn btn-primary btn-sm" href="${url}" target="_blank" rel="noopener noreferrer">${lbl}</a>`;
    });

    const eco = $("ecoLinksContainer");
    if (eco && CFG.ecosystem) {
      const links = [
        { label: "All Tools Hub", url: CFG.ecosystem.hubUrl },
        { label: "SmartMoney US", url: CFG.ecosystem.smartMoneyUrl },
        { label: "PropYield US", url: CFG.ecosystem.propYieldUrl },
        { label: "CapGain US", url: CFG.ecosystem.capGainUrl },
        { label: "RetireSmart US", url: CFG.ecosystem.retireSmartUrl },
        { label: "The Ledger YouTube", url: CFG.ecosystem.youtubeLedgerUrl }
      ];
      eco.innerHTML = links.filter((l) => l.url).map((l) => `<a class="btn btn-sm" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`).join("");
    }
  }

  function switchTool(tool) {
    if (!TOOL_META[tool]) tool = "mortgage";
    activeTool = tool;
    document.querySelectorAll(".tool-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tool === tool)));
    document.querySelectorAll(".calc-panel").forEach((p) => { p.hidden = p.id !== "panel-" + tool; });
    $("activeToolHeading").textContent = TOOL_META[tool].heading;
    $("activeToolDesc").textContent = TOOL_META[tool].desc;
    renderPresets();
    recomputeAll();
  }

  function recomputeAll() {
    computeMortgage();
    computeRentBuy();
    computeRefi();
  }

  function downloadCsv(filename, headers, rows) {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(",")].concat(rows.map((r) => r.map(esc).join(","))).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast("Exported " + filename);
  }

  function initTheme() {
    const saved = localStorage.getItem("homemath_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    const btn = $("themeToggleBtn");
    const sync = () => { if (btn) btn.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "Light Mode" : "Dark Mode"; };
    sync();
    if (btn) btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("homemath_theme", next);
      sync();
    });
  }

  function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return;
    const st = (params.get("state") || "").toUpperCase();
    const match = STATE_PROP_TAX.find(([c]) => c === st);
    if (match) {
      $("mgState").value = match[0];
      $("mgPropTaxPct").value = match[2].toFixed(2);
    }
    params.forEach((v, k) => { if (k !== "tool" && k !== "state" && $(k)) $(k).value = v; });
    if (TOOL_META[params.get("tool")]) activeTool = params.get("tool");
  }

  document.addEventListener("DOMContentLoaded", () => {
    populateStates();
    initTheme();
    loadFromUrl();
    renderOffersAndEco();

    document.querySelectorAll(".tool-tab").forEach((t) => t.addEventListener("click", () => switchTool(t.dataset.tool)));
    document.querySelectorAll("input, select").forEach((el) => {
      if (el.id === "mgState") return;
      el.addEventListener("input", recomputeAll);
      el.addEventListener("change", recomputeAll);
    });

    $("shareLinkBtn").addEventListener("click", () => {
      const p = new URLSearchParams();
      p.set("tool", activeTool);
      ["mgPrice","mgDownPct","mgRate","mgTerm","mgState","mgPropTaxPct","mgIns","mgHoa","mgPmiPct","rbHomePrice","rbDownPct","rbRate","rbRent","rbSpReturn","rfBalance","rfCurRate","rfCurYrs","rfNewRate","rfNewTerm","rfClosing","rfExtra"].forEach((id) => {
        if ($(id)) p.set(id, $(id).value);
      });
      const url = window.location.origin + window.location.pathname + "?" + p.toString();
      window.history.replaceState({}, "", url);
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast("Shareable link copied!")).catch(() => showToast("URL updated."));
    });
    $("copyScenarioBtn").addEventListener("click", () => {
      const txt = activeTool === "mortgage"
        ? `HomeMath US 2026 Mortgage: ${$("mgTotalMo").textContent}/mo | ${$("mgSubline").textContent}`
        : activeTool === "rentbuy"
          ? `HomeMath US Rent vs Buy: ${$("rbWinnerHero").textContent} | ${$("rbWinnerSub").textContent}`
          : `HomeMath US Refi: ${$("rfTotalSaved").textContent} saved | ${$("rfSubline").textContent}`;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => showToast("Summary copied!")).catch(() => showToast(txt));
    });
    $("printReportBtn").addEventListener("click", () => window.print());
    $("resetDefaultsBtn").addEventListener("click", () => {
      const first = (PRESETS[activeTool] || [])[0];
      if (first) Object.keys(first.values).forEach((k) => { if ($(k)) $(k).value = first.values[k]; });
      window.history.replaceState({}, "", window.location.pathname);
      recomputeAll();
      showToast("Reset to 2026 default scenario.");
    });
    $("exportMgCsvBtn").addEventListener("click", () => downloadCsv("homemath-us-amortization-2026.csv", ["Year","Principal","Interest","PMI","Ending Balance","LTV %"], lastMgRows));
    $("exportRbCsvBtn").addEventListener("click", () => downloadCsv("homemath-us-rent-vs-buy-2026.csv", ["Horizon","Buyer Net Equity","Renter S&P 500","Difference","Winner"], lastRbRows));
    $("exportRfCsvBtn").addEventListener("click", () => downloadCsv("homemath-us-refinance-2026.csv", ["Strategy","Monthly Outflow","Payoff Time","Total Interest + Fees","Net Savings"], lastRfRows));

    switchTool(activeTool);
  });
})();
