// Malaysian Mortgage Calculator - Main Application

// State management
const state = {
  activeTab: 'calculator',
  loanType: 'conventional',
  amortizationData: [],
  currentResults: null
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Set up event listeners
  setupNavigation();
  setupForms();
  populateBankDropdowns();
  setDefaultValues();

  // Show first tab
  showTab('calculator');
}

// Navigation
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      showTab(tab);
    });
  });
}

function showTab(tabId) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });

  state.activeTab = tabId;
}

// Form setup
function setupForms() {
  // Main calculator form
  const calcForm = document.getElementById('calculatorForm');
  if (calcForm) {
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateMortgage();
    });
  }

  // Loan type toggle
  document.querySelectorAll('input[name="loanType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.loanType = e.target.value;
      updateBankOptions();
      updateIslamicOptions();
    });
  });

  // Bank selection
  const bankSelect = document.getElementById('bankSelect');
  if (bankSelect) {
    bankSelect.addEventListener('change', (e) => {
      if (e.target.value !== 'custom') {
        const rate = e.target.options[e.target.selectedIndex].dataset.rate;
        document.getElementById('interestRate').value = rate;
      }
    });
  }

  // Extra payments form
  const extraForm = document.getElementById('extraPaymentForm');
  if (extraForm) {
    extraForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateExtraPayments();
    });
  }

  // Refinancing form
  const refiForm = document.getElementById('refinancingForm');
  if (refiForm) {
    refiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateRefinancing();
    });
  }

  // Affordability form
  const affordForm = document.getElementById('affordabilityForm');
  if (affordForm) {
    affordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateAffordabilityCheck();
    });
  }

  // Stamp duty form
  const stampForm = document.getElementById('stampDutyForm');
  if (stampForm) {
    stampForm.addEventListener('submit', (e) => {
      e.preventDefault();
      calculateStampDutyAndFees();
    });
  }

  // Number input formatting
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('blur', () => {
      if (input.value) {
        input.value = parseFloat(input.value).toFixed(input.step === '0.01' ? 2 : 0);
      }
    });
  });
}

// Populate bank dropdowns
function populateBankDropdowns() {
  const bankSelect = document.getElementById('bankSelect');
  if (!bankSelect) return;

  updateBankOptions();
}

function updateBankOptions() {
  const bankSelect = document.getElementById('bankSelect');
  if (!bankSelect) return;

  const banks = state.loanType === 'islamic'
    ? MALAYSIAN_BANKS.islamic
    : MALAYSIAN_BANKS.conventional;

  bankSelect.innerHTML = `
    <option value="custom">-- Custom Rate --</option>
    ${banks.map(bank => `
      <option value="${bank.name}" data-rate="${bank.rate}">
        ${bank.name} (${bank.rate}% p.a.)
      </option>
    `).join('')}
  `;
}

function updateIslamicOptions() {
  const islamicOptions = document.getElementById('islamicOptions');
  if (islamicOptions) {
    islamicOptions.style.display = state.loanType === 'islamic' ? 'block' : 'none';
  }
}

// Set default values
function setDefaultValues() {
  const defaults = {
    loanAmount: 500000,
    interestRate: 4.10,
    tenure: 30,
    monthlyIncome: 8000,
    existingCommitments: 500,
    propertyPrice: 600000,
    downPaymentPercent: 10
  };

  Object.entries(defaults).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

// Main mortgage calculation
function calculateMortgage() {
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const interestRate = parseFloat(document.getElementById('interestRate').value);
  const tenure = parseInt(document.getElementById('tenure').value);

  if (!loanAmount || !interestRate || !tenure) {
    showError('Please fill in all required fields');
    return;
  }

  let results;

  if (state.loanType === 'islamic') {
    const islamicType = document.getElementById('islamicType')?.value || 'mm';
    if (islamicType === 'murabahah') {
      results = calculateIslamicMurabahah(loanAmount, interestRate, tenure);
    } else {
      // MM - using loan amount as bank's share, assume 10% customer contribution
      const propertyValue = loanAmount / 0.9;
      results = calculateIslamicMM(propertyValue, propertyValue * 0.1, interestRate, tenure);
    }
  } else {
    results = calculateMonthlyPayment(loanAmount, interestRate, tenure);
  }

  state.currentResults = results;

  // Generate amortization schedule
  state.amortizationData = generateAmortizationSchedule(loanAmount, interestRate, tenure);

  // Display results
  displayMainResults(results, loanAmount, interestRate, tenure);
  displayAmortizationTable();
}

function displayMainResults(results, loanAmount, rate, tenure) {
  const resultsDiv = document.getElementById('calculatorResults');
  if (!resultsDiv) return;

  const isIslamic = state.loanType === 'islamic';
  const interestLabel = isIslamic ? 'Total Profit' : 'Total Interest';
  const rateLabel = isIslamic ? 'Profit Rate' : 'Interest Rate';

  resultsDiv.innerHTML = `
    <div class="results-grid">
      <div class="result-card primary">
        <span class="result-label">Monthly Payment</span>
        <span class="result-value">${formatCurrency(results.monthlyPayment)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">Loan Amount</span>
        <span class="result-value">${formatCurrency(loanAmount)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">${interestLabel}</span>
        <span class="result-value">${formatCurrency(results.totalInterest || results.totalProfit || results.totalRental)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">Total Payment</span>
        <span class="result-value">${formatCurrency(results.totalPayment || results.sellingPrice)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">${rateLabel}</span>
        <span class="result-value">${rate}% p.a.</span>
      </div>
      <div class="result-card">
        <span class="result-label">Loan Tenure</span>
        <span class="result-value">${tenure} years (${tenure * 12} months)</span>
      </div>
    </div>

    ${isIslamic && results.type ? `
      <div class="islamic-note">
        <strong>${results.type}</strong>
        <p>${results.note}</p>
      </div>
    ` : ''}

    <div class="chart-section">
      <div class="chart-container">
        <canvas id="paymentChart" width="200" height="200"></canvas>
      </div>
      <div class="chart-legend">
        <div class="legend-item">
          <span class="legend-color principal"></span>
          <span class="legend-text">Principal: ${((loanAmount / (results.totalPayment || results.sellingPrice)) * 100).toFixed(1)}%</span>
        </div>
        <div class="legend-item">
          <span class="legend-color interest"></span>
          <span class="legend-text">Interest: ${(((results.totalInterest || results.totalProfit || results.totalRental) / (results.totalPayment || results.sellingPrice)) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  `;

  // Draw chart
  setTimeout(() => {
    drawPaymentChart(loanAmount, results.totalInterest || results.totalProfit || results.totalRental);
  }, 50);
}

function displayAmortizationTable() {
  const tableContainer = document.getElementById('amortizationTable');
  if (!tableContainer || !state.amortizationData.length) return;

  const viewMode = document.getElementById('amortizationView')?.value || 'yearly';

  let data = state.amortizationData;

  // Aggregate yearly if needed
  if (viewMode === 'yearly') {
    data = aggregateYearly(state.amortizationData);
  }

  const isMonthly = viewMode === 'monthly';

  tableContainer.innerHTML = `
    <div class="table-controls">
      <select id="amortizationView" onchange="displayAmortizationTable()">
        <option value="yearly" ${viewMode === 'yearly' ? 'selected' : ''}>Yearly Summary</option>
        <option value="monthly" ${viewMode === 'monthly' ? 'selected' : ''}>Monthly Detail</option>
      </select>
      <button type="button" class="btn-secondary" onclick="exportToCSV()">
        <span class="icon">↓</span> Export CSV
      </button>
      <button type="button" class="btn-secondary" onclick="printAmortization()">
        <span class="icon">🖨</span> Print
      </button>
    </div>

    <div class="table-wrapper">
      <table class="amortization-table">
        <thead>
          <tr>
            <th>${isMonthly ? 'Month' : 'Year'}</th>
            <th>Payment</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Balance</th>
            <th>Cumulative Interest</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${isMonthly ? row.month : row.year}</td>
              <td>${formatCurrency(row.payment)}</td>
              <td>${formatCurrency(row.principal)}</td>
              <td>${formatCurrency(row.interest)}</td>
              <td>${formatCurrency(row.balance)}</td>
              <td>${formatCurrency(row.cumulativeInterest)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function aggregateYearly(monthlyData) {
  const yearly = {};

  monthlyData.forEach(row => {
    if (!yearly[row.year]) {
      yearly[row.year] = {
        year: row.year,
        payment: 0,
        principal: 0,
        interest: 0,
        balance: 0,
        cumulativeInterest: 0
      };
    }
    yearly[row.year].payment += row.payment;
    yearly[row.year].principal += row.principal;
    yearly[row.year].interest += row.interest;
    yearly[row.year].balance = row.balance;
    yearly[row.year].cumulativeInterest = row.cumulativeInterest;
  });

  return Object.values(yearly);
}

// Extra payments calculation
function calculateExtraPayments() {
  const loanAmount = parseFloat(document.getElementById('extraLoanAmount').value);
  const rate = parseFloat(document.getElementById('extraRate').value);
  const tenure = parseInt(document.getElementById('extraTenure').value);
  const extraMonthly = parseFloat(document.getElementById('extraMonthlyPayment').value) || 0;
  const lumpSum = parseFloat(document.getElementById('lumpSumPayment').value) || 0;
  const lumpSumMonth = parseInt(document.getElementById('lumpSumMonth').value) || 1;

  if (!loanAmount || !rate || !tenure) {
    showError('Please fill in loan details');
    return;
  }

  const results = calculateExtraPaymentImpact(loanAmount, rate, tenure, extraMonthly, lumpSum, lumpSumMonth);

  displayExtraPaymentResults(results);
}

function displayExtraPaymentResults(results) {
  const resultsDiv = document.getElementById('extraPaymentResults');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = `
    <h3>Extra Payment Analysis</h3>

    <div class="comparison-grid">
      <div class="comparison-column">
        <h4>Without Extra Payments</h4>
        <div class="stat">
          <span class="stat-label">Monthly Payment</span>
          <span class="stat-value">${formatCurrency(results.original.monthlyPayment)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Interest</span>
          <span class="stat-value">${formatCurrency(results.original.totalInterest)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Loan Duration</span>
          <span class="stat-value">${results.original.totalYears} years</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Payment</span>
          <span class="stat-value">${formatCurrency(results.original.totalPayment)}</span>
        </div>
      </div>

      <div class="comparison-column highlight">
        <h4>With Extra Payments</h4>
        <div class="stat">
          <span class="stat-label">Monthly Payment</span>
          <span class="stat-value">${formatCurrency(results.withExtraPayments.monthlyPayment)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Interest</span>
          <span class="stat-value">${formatCurrency(results.withExtraPayments.totalInterest)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Loan Duration</span>
          <span class="stat-value">${results.withExtraPayments.totalYears} years</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Payment</span>
          <span class="stat-value">${formatCurrency(results.withExtraPayments.totalPayment)}</span>
        </div>
      </div>
    </div>

    <div class="savings-summary">
      <h4>Your Savings</h4>
      <div class="savings-grid">
        <div class="saving-item">
          <span class="saving-value text-success">${formatCurrency(results.savings.interestSaved)}</span>
          <span class="saving-label">Interest Saved</span>
        </div>
        <div class="saving-item">
          <span class="saving-value text-success">${results.savings.yearsSaved} years</span>
          <span class="saving-label">Time Saved</span>
        </div>
        <div class="saving-item">
          <span class="saving-value text-success">${results.savings.monthsSaved} months</span>
          <span class="saving-label">Months Earlier</span>
        </div>
      </div>
    </div>
  `;
}

// Refinancing calculation
function calculateRefinancing() {
  const currentBalance = parseFloat(document.getElementById('currentBalance').value);
  const currentRate = parseFloat(document.getElementById('currentRate').value);
  const remainingYears = parseInt(document.getElementById('remainingYears').value);
  const newRate = parseFloat(document.getElementById('newRate').value);
  const newTenure = parseInt(document.getElementById('newTenure').value);
  const closingCosts = parseFloat(document.getElementById('closingCosts').value) || 0;

  if (!currentBalance || !currentRate || !remainingYears || !newRate || !newTenure) {
    showError('Please fill in all required fields');
    return;
  }

  const results = compareRefinancing(
    { balance: currentBalance, rate: currentRate, remainingYears },
    { rate: newRate, tenureYears: newTenure, closingCosts }
  );

  displayRefinancingResults(results);
}

function displayRefinancingResults(results) {
  const resultsDiv = document.getElementById('refinancingResults');
  if (!resultsDiv) return;

  const isWorth = results.comparison.worthRefinancing;

  resultsDiv.innerHTML = `
    <h3>Refinancing Analysis</h3>

    <div class="recommendation ${isWorth ? 'positive' : 'negative'}">
      <span class="recommendation-icon">${isWorth ? '✓' : '✗'}</span>
      <span class="recommendation-text">
        ${isWorth
          ? 'Refinancing is recommended based on your inputs'
          : 'Refinancing may not be beneficial in this scenario'}
      </span>
    </div>

    <div class="comparison-grid">
      <div class="comparison-column">
        <h4>Current Loan</h4>
        <div class="stat">
          <span class="stat-label">Monthly Payment</span>
          <span class="stat-value">${formatCurrency(results.current.monthlyPayment)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Remaining Interest</span>
          <span class="stat-value">${formatCurrency(results.current.totalInterest)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Remaining Payments</span>
          <span class="stat-value">${results.current.remainingMonths} months</span>
        </div>
      </div>

      <div class="comparison-column ${isWorth ? 'highlight' : ''}">
        <h4>Refinanced Loan</h4>
        <div class="stat">
          <span class="stat-label">Monthly Payment</span>
          <span class="stat-value">${formatCurrency(results.refinanced.monthlyPayment)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Interest</span>
          <span class="stat-value">${formatCurrency(results.refinanced.totalInterest)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">New Tenure</span>
          <span class="stat-value">${results.refinanced.newTenureMonths} months</span>
        </div>
        <div class="stat">
          <span class="stat-label">Closing Costs</span>
          <span class="stat-value">${formatCurrency(results.refinanced.closingCosts)}</span>
        </div>
      </div>
    </div>

    <div class="savings-summary">
      <h4>Comparison Summary</h4>
      <div class="savings-grid">
        <div class="saving-item">
          <span class="saving-value ${results.comparison.monthlyDifference > 0 ? 'text-success' : 'text-warning'}">
            ${results.comparison.monthlyDifference > 0 ? '-' : '+'}${formatCurrency(Math.abs(results.comparison.monthlyDifference))}
          </span>
          <span class="saving-label">Monthly Change</span>
        </div>
        <div class="saving-item">
          <span class="saving-value ${results.comparison.netSavings > 0 ? 'text-success' : 'text-warning'}">
            ${formatCurrency(results.comparison.netSavings)}
          </span>
          <span class="saving-label">Net Savings</span>
        </div>
        <div class="saving-item">
          <span class="saving-value">${results.comparison.breakEvenYears} years</span>
          <span class="saving-label">Break-even Time</span>
        </div>
      </div>
    </div>
  `;
}

// Affordability calculation
function calculateAffordabilityCheck() {
  const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value);
  const existingCommitments = parseFloat(document.getElementById('existingCommitments').value) || 0;
  const dsrLimit = parseFloat(document.getElementById('dsrLimit').value) / 100;
  const affordRate = parseFloat(document.getElementById('affordRate').value);
  const affordTenure = parseInt(document.getElementById('affordTenure').value);

  if (!monthlyIncome || !dsrLimit || !affordRate || !affordTenure) {
    showError('Please fill in all required fields');
    return;
  }

  const results = calculateAffordability(monthlyIncome, existingCommitments, dsrLimit, affordRate, affordTenure);

  displayAffordabilityResults(results);
}

function displayAffordabilityResults(results) {
  const resultsDiv = document.getElementById('affordabilityResults');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = `
    <h3>Affordability Analysis</h3>

    ${!results.canAfford ? `
      <div class="recommendation negative">
        <span class="recommendation-icon">!</span>
        <span class="recommendation-text">${results.message}</span>
      </div>
    ` : ''}

    <div class="results-grid">
      <div class="result-card primary">
        <span class="result-label">Maximum Loan Amount</span>
        <span class="result-value">${formatCurrency(results.maxLoanAmount)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">Est. Property Price (90% Margin)</span>
        <span class="result-value">${formatCurrency(results.estimatedPropertyPrice || 0)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">Max Monthly Payment</span>
        <span class="result-value">${formatCurrency(results.maxMonthlyPayment)}</span>
      </div>
      <div class="result-card">
        <span class="result-label">Current DSR</span>
        <span class="result-value">${results.currentDSR}%</span>
      </div>
      <div class="result-card">
        <span class="result-label">Available DSR</span>
        <span class="result-value">${results.availableDSR || 0}%</span>
      </div>
      <div class="result-card">
        <span class="result-label">DSR Limit</span>
        <span class="result-value">${results.maxDSR}%</span>
      </div>
    </div>

    ${results.breakdown ? `
      <div class="breakdown-section">
        <h4>Income Breakdown</h4>
        <div class="breakdown-bar">
          <div class="bar-segment existing" style="width: ${(results.breakdown.existingCommitments / results.breakdown.grossIncome) * 100}%">
            <span class="bar-label">Existing</span>
          </div>
          <div class="bar-segment available" style="width: ${(results.breakdown.availableForMortgage / results.breakdown.grossIncome) * 100}%">
            <span class="bar-label">Available</span>
          </div>
          <div class="bar-segment unused" style="width: ${((results.breakdown.grossIncome - results.breakdown.maxTotalDebt) / results.breakdown.grossIncome) * 100}%">
            <span class="bar-label">Reserved</span>
          </div>
        </div>
        <div class="breakdown-legend">
          <span><span class="dot existing"></span> Existing Commitments: ${formatCurrency(results.breakdown.existingCommitments)}</span>
          <span><span class="dot available"></span> Available for Mortgage: ${formatCurrency(results.breakdown.availableForMortgage)}</span>
          <span><span class="dot unused"></span> Reserved (40%): ${formatCurrency(results.breakdown.grossIncome - results.breakdown.maxTotalDebt)}</span>
        </div>
      </div>
    ` : ''}
  `;
}

// Stamp duty calculation
function calculateStampDutyAndFees() {
  const propertyPrice = parseFloat(document.getElementById('stampPropertyPrice').value);
  const loanPercent = parseFloat(document.getElementById('loanMargin').value);
  const isFirstTimeBuyer = document.getElementById('firstTimeBuyer').checked;
  const applyHOC = document.getElementById('applyHOC').checked;

  if (!propertyPrice || !loanPercent) {
    showError('Please fill in property price and loan margin');
    return;
  }

  const loanAmount = propertyPrice * (loanPercent / 100);
  const results = calculateTotalUpfrontCosts(propertyPrice, loanAmount, isFirstTimeBuyer, applyHOC);

  displayStampDutyResults(results);
}

function displayStampDutyResults(results) {
  const resultsDiv = document.getElementById('stampDutyResults');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = `
    <h3>Upfront Costs Breakdown</h3>

    <div class="cost-summary">
      <div class="cost-total">
        <span class="cost-label">Total Cash Required</span>
        <span class="cost-value">${formatCurrency(results.totalCosts)}</span>
      </div>
    </div>

    <div class="cost-breakdown">
      <div class="cost-item">
        <div class="cost-header">
          <span class="cost-name">Down Payment (${results.downPaymentPercent}%)</span>
          <span class="cost-amount">${formatCurrency(results.downPayment)}</span>
        </div>
      </div>

      <div class="cost-item">
        <div class="cost-header">
          <span class="cost-name">Stamp Duty (MOT)</span>
          <span class="cost-amount">${formatCurrency(results.stampDutyMOT.netStampDuty)}</span>
        </div>
        ${results.stampDutyMOT.exemption > 0 ? `
          <div class="cost-detail">
            <span>Gross: ${formatCurrency(results.stampDutyMOT.grossStampDuty)}</span>
            <span class="text-success">Exemption: -${formatCurrency(results.stampDutyMOT.exemption)}</span>
            <small>${results.stampDutyMOT.exemptionNote}</small>
          </div>
        ` : ''}
      </div>

      <div class="cost-item">
        <div class="cost-header">
          <span class="cost-name">Stamp Duty (Loan Agreement)</span>
          <span class="cost-amount">${formatCurrency(results.stampDutyLoan.netStampDuty)}</span>
        </div>
        ${results.stampDutyLoan.exemption > 0 ? `
          <div class="cost-detail">
            <span>Gross: ${formatCurrency(results.stampDutyLoan.grossStampDuty)}</span>
            <span class="text-success">Exemption: -${formatCurrency(results.stampDutyLoan.exemption)}</span>
            <small>${results.stampDutyLoan.exemptionNote}</small>
          </div>
        ` : ''}
      </div>

      <div class="cost-item">
        <div class="cost-header">
          <span class="cost-name">Legal Fees (SPA)</span>
          <span class="cost-amount">${formatCurrency(results.legalFeesSPA.totalFees)}</span>
        </div>
        <div class="cost-detail">
          <span>Professional fees: ${formatCurrency(results.legalFeesSPA.baseFees)}</span>
          <span>Disbursements: ${formatCurrency(results.legalFeesSPA.totalAdditionalFees)}</span>
        </div>
      </div>

      <div class="cost-item">
        <div class="cost-header">
          <span class="cost-name">Legal Fees (Loan)</span>
          <span class="cost-amount">${formatCurrency(results.legalFeesLoan.totalFees)}</span>
        </div>
      </div>

      <div class="cost-item">
        <div class="cost-header">
          <span class="cost-name">Valuation Fee</span>
          <span class="cost-amount">${formatCurrency(results.valuationFee)}</span>
        </div>
      </div>
    </div>

    <div class="summary-table">
      <h4>Quick Summary</h4>
      <table>
        <tr>
          <td>Property Price</td>
          <td>${formatCurrency(results.propertyPrice)}</td>
        </tr>
        <tr>
          <td>Loan Amount</td>
          <td>${formatCurrency(results.loanAmount)}</td>
        </tr>
        <tr>
          <td>Down Payment</td>
          <td>${formatCurrency(results.summary.downPayment)}</td>
        </tr>
        <tr>
          <td>Total Stamp Duty</td>
          <td>${formatCurrency(results.summary.stampDuty)}</td>
        </tr>
        <tr>
          <td>Total Legal Fees</td>
          <td>${formatCurrency(results.summary.legalFees)}</td>
        </tr>
        <tr>
          <td>Valuation</td>
          <td>${formatCurrency(results.summary.valuationFee)}</td>
        </tr>
        <tr class="total-row">
          <td><strong>Total Cash Required</strong></td>
          <td><strong>${formatCurrency(results.summary.total)}</strong></td>
        </tr>
      </table>
    </div>
  `;
}

// Chart drawing
function drawPaymentChart(principal, interest) {
  const canvas = document.getElementById('paymentChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const total = principal + interest;

  // Handle high DPI displays
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Set dimensions
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const radius = Math.min(centerX, centerY) - 10;

  // Draw principal slice (teal - primary color)
  const principalAngle = (principal / total) * 2 * Math.PI;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + principalAngle);
  ctx.closePath();
  ctx.fillStyle = '#0F766E';
  ctx.fill();

  // Draw interest slice (amber - accent color)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, -Math.PI / 2 + principalAngle, -Math.PI / 2 + 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#D97706';
  ctx.fill();

  // Draw center circle (donut effect)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = '#F0FDFA';
  ctx.fill();
}

// Export functions
function exportToCSV() {
  if (!state.amortizationData.length) {
    showError('No data to export. Please calculate first.');
    return;
  }

  const headers = ['Month', 'Year', 'Payment', 'Principal', 'Interest', 'Balance', 'Cumulative Interest'];
  const rows = state.amortizationData.map(row =>
    [row.month, row.year, row.payment, row.principal, row.interest, row.balance, row.cumulativeInterest]
  );

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amortization-schedule-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printAmortization() {
  window.print();
}

// Error handling
function showError(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast error';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Utility
function formatCurrency(num) {
  if (isNaN(num) || num === null || num === undefined) return 'RM 0.00';
  return 'RM ' + num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
