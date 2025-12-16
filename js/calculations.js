// Malaysian Mortgage Calculator - Core Calculations

/**
 * Calculate monthly mortgage payment
 * @param {number} principal - Loan amount in RM
 * @param {number} annualRate - Annual interest rate (e.g., 4.5 for 4.5%)
 * @param {number} tenureYears - Loan tenure in years
 * @returns {object} Payment details
 */
function calculateMonthlyPayment(principal, annualRate, tenureYears) {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = tenureYears * 12;

  if (monthlyRate === 0) {
    return {
      monthlyPayment: principal / totalMonths,
      totalPayment: principal,
      totalInterest: 0,
      effectiveRate: 0
    };
  }

  // PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment: roundToTwoDecimals(monthlyPayment),
    totalPayment: roundToTwoDecimals(totalPayment),
    totalInterest: roundToTwoDecimals(totalInterest),
    effectiveRate: roundToTwoDecimals((totalInterest / principal) * 100)
  };
}

/**
 * Generate full amortization schedule
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} tenureYears - Loan tenure in years
 * @returns {array} Monthly breakdown
 */
function generateAmortizationSchedule(principal, annualRate, tenureYears) {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = tenureYears * 12;
  const { monthlyPayment } = calculateMonthlyPayment(principal, annualRate, tenureYears);

  const schedule = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);

    cumulativeInterest += interestPayment;
    cumulativePrincipal += principalPayment;

    schedule.push({
      month,
      year: Math.ceil(month / 12),
      payment: roundToTwoDecimals(monthlyPayment),
      principal: roundToTwoDecimals(principalPayment),
      interest: roundToTwoDecimals(interestPayment),
      balance: roundToTwoDecimals(balance),
      cumulativeInterest: roundToTwoDecimals(cumulativeInterest),
      cumulativePrincipal: roundToTwoDecimals(cumulativePrincipal)
    });
  }

  return schedule;
}

/**
 * Calculate impact of extra payments
 * @param {number} principal - Original loan amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} tenureYears - Original tenure
 * @param {number} extraMonthly - Extra monthly payment
 * @param {number} lumpSum - One-time extra payment
 * @param {number} lumpSumMonth - Month to apply lump sum (1-indexed)
 * @returns {object} Comparison with and without extra payments
 */
function calculateExtraPaymentImpact(principal, annualRate, tenureYears, extraMonthly = 0, lumpSum = 0, lumpSumMonth = 1) {
  const original = calculateMonthlyPayment(principal, annualRate, tenureYears);
  const monthlyRate = annualRate / 100 / 12;

  // Calculate with extra payments
  let balance = principal;
  let month = 0;
  let totalInterestPaid = 0;
  let totalPaid = 0;

  while (balance > 0) {
    month++;

    // Apply lump sum if it's the specified month
    if (month === lumpSumMonth && lumpSum > 0) {
      balance = Math.max(0, balance - lumpSum);
      totalPaid += lumpSum;
    }

    if (balance <= 0) break;

    const interestPayment = balance * monthlyRate;
    const regularPrincipal = original.monthlyPayment - interestPayment;
    const totalPrincipalPayment = regularPrincipal + extraMonthly;

    // If remaining balance is less than payment
    if (balance <= totalPrincipalPayment + interestPayment) {
      totalInterestPaid += interestPayment;
      totalPaid += balance + interestPayment;
      balance = 0;
    } else {
      balance -= totalPrincipalPayment;
      totalInterestPaid += interestPayment;
      totalPaid += original.monthlyPayment + extraMonthly;
    }
  }

  const originalTotalMonths = tenureYears * 12;

  return {
    original: {
      monthlyPayment: original.monthlyPayment,
      totalMonths: originalTotalMonths,
      totalYears: tenureYears,
      totalInterest: original.totalInterest,
      totalPayment: original.totalPayment
    },
    withExtraPayments: {
      monthlyPayment: original.monthlyPayment + extraMonthly,
      totalMonths: month,
      totalYears: roundToTwoDecimals(month / 12),
      totalInterest: roundToTwoDecimals(totalInterestPaid),
      totalPayment: roundToTwoDecimals(totalPaid)
    },
    savings: {
      monthsSaved: originalTotalMonths - month,
      yearsSaved: roundToTwoDecimals((originalTotalMonths - month) / 12),
      interestSaved: roundToTwoDecimals(original.totalInterest - totalInterestPaid),
      totalSaved: roundToTwoDecimals(original.totalPayment - totalPaid)
    }
  };
}

/**
 * Compare refinancing options
 * @param {object} currentLoan - Current loan details
 * @param {object} newLoan - Proposed new loan
 * @returns {object} Comparison analysis
 */
function compareRefinancing(currentLoan, newLoan) {
  // Current loan: { balance, rate, remainingYears }
  // New loan: { rate, tenureYears, closingCosts }

  const current = calculateMonthlyPayment(
    currentLoan.balance,
    currentLoan.rate,
    currentLoan.remainingYears
  );

  const newCalc = calculateMonthlyPayment(
    currentLoan.balance,
    newLoan.rate,
    newLoan.tenureYears
  );

  const monthlyDifference = current.monthlyPayment - newCalc.monthlyPayment;
  const totalInterestDifference = current.totalInterest - newCalc.totalInterest;

  // Break-even calculation (months to recover closing costs)
  const breakEvenMonths = monthlyDifference > 0
    ? Math.ceil(newLoan.closingCosts / monthlyDifference)
    : Infinity;

  // Net savings over loan term
  const netSavings = totalInterestDifference - newLoan.closingCosts;

  return {
    current: {
      monthlyPayment: current.monthlyPayment,
      totalInterest: current.totalInterest,
      totalPayment: current.totalPayment,
      remainingMonths: currentLoan.remainingYears * 12
    },
    refinanced: {
      monthlyPayment: newCalc.monthlyPayment,
      totalInterest: newCalc.totalInterest,
      totalPayment: newCalc.totalPayment + newLoan.closingCosts,
      newTenureMonths: newLoan.tenureYears * 12,
      closingCosts: newLoan.closingCosts
    },
    comparison: {
      monthlyDifference: roundToTwoDecimals(monthlyDifference),
      totalInterestSaved: roundToTwoDecimals(totalInterestDifference),
      breakEvenMonths: breakEvenMonths === Infinity ? 'N/A' : breakEvenMonths,
      breakEvenYears: breakEvenMonths === Infinity ? 'N/A' : roundToTwoDecimals(breakEvenMonths / 12),
      netSavings: roundToTwoDecimals(netSavings),
      worthRefinancing: netSavings > 0 && breakEvenMonths < (newLoan.tenureYears * 12)
    }
  };
}

/**
 * Calculate maximum affordable loan based on DSR
 * @param {number} monthlyIncome - Gross monthly income
 * @param {number} existingCommitments - Monthly debt payments
 * @param {number} dsrLimit - DSR limit (e.g., 0.60 for 60%)
 * @param {number} annualRate - Interest rate
 * @param {number} tenureYears - Loan tenure
 * @returns {object} Affordability analysis
 */
function calculateAffordability(monthlyIncome, existingCommitments, dsrLimit, annualRate, tenureYears) {
  const maxTotalDebt = monthlyIncome * dsrLimit;
  const availableForMortgage = maxTotalDebt - existingCommitments;

  if (availableForMortgage <= 0) {
    return {
      canAfford: false,
      maxLoanAmount: 0,
      maxMonthlyPayment: 0,
      currentDSR: roundToTwoDecimals((existingCommitments / monthlyIncome) * 100),
      message: 'Existing commitments exceed DSR limit'
    };
  }

  // Reverse PMT to find principal
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = tenureYears * 12;

  // P = PMT * [(1+r)^n - 1] / [r(1+r)^n]
  const maxLoan = availableForMortgage *
    (Math.pow(1 + monthlyRate, totalMonths) - 1) /
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));

  return {
    canAfford: true,
    maxLoanAmount: roundToTwoDecimals(maxLoan),
    maxMonthlyPayment: roundToTwoDecimals(availableForMortgage),
    currentDSR: roundToTwoDecimals((existingCommitments / monthlyIncome) * 100),
    maxDSR: roundToTwoDecimals(dsrLimit * 100),
    availableDSR: roundToTwoDecimals(((maxTotalDebt - existingCommitments) / monthlyIncome) * 100),
    estimatedPropertyPrice: roundToTwoDecimals(maxLoan / 0.9), // Assuming 90% margin
    breakdown: {
      grossIncome: monthlyIncome,
      maxTotalDebt: roundToTwoDecimals(maxTotalDebt),
      existingCommitments: existingCommitments,
      availableForMortgage: roundToTwoDecimals(availableForMortgage)
    }
  };
}

/**
 * Calculate stamp duty for property transfer (MOT)
 * @param {number} propertyPrice - Property price
 * @param {boolean} isFirstTimeBuyer - First-time buyer status
 * @param {boolean} applyHOC - Apply HOC exemption
 * @returns {object} Stamp duty breakdown
 */
function calculateStampDutyMOT(propertyPrice, isFirstTimeBuyer = false, applyHOC = false) {
  let stampDuty = 0;
  let remainingValue = propertyPrice;
  const breakdown = [];

  // Calculate standard stamp duty
  for (const tier of STAMP_DUTY_MOT.standard) {
    if (remainingValue <= 0) break;

    const tierMin = tier.min;
    const tierMax = tier.max;
    const tierRange = tierMax - tierMin;

    const taxableAmount = Math.min(remainingValue, tierRange);
    const tierDuty = taxableAmount * tier.rate;

    stampDuty += tierDuty;
    breakdown.push({
      range: `RM ${formatNumber(tierMin)} - RM ${tierMax === Infinity ? '∞' : formatNumber(tierMax)}`,
      rate: `${tier.rate * 100}%`,
      taxableAmount: roundToTwoDecimals(taxableAmount),
      duty: roundToTwoDecimals(tierDuty)
    });

    remainingValue -= taxableAmount;
  }

  let exemption = 0;
  let exemptionNote = '';

  // First-time buyer exemption
  if (isFirstTimeBuyer && propertyPrice <= STAMP_DUTY_MOT.firstTimeBuyerExemption.maxPrice) {
    exemption = stampDuty * STAMP_DUTY_MOT.firstTimeBuyerExemption.exemptionRate;
    exemptionNote = 'First-time buyer exemption (100% for property ≤ RM500,000)';
  }
  // HOC exemption
  else if (applyHOC &&
           propertyPrice >= STAMP_DUTY_MOT.hocExemption.minPrice &&
           propertyPrice <= STAMP_DUTY_MOT.hocExemption.maxPrice) {
    exemption = stampDuty * STAMP_DUTY_MOT.hocExemption.exemptionRate;
    exemptionNote = 'Home Ownership Campaign exemption (75%)';
  }

  return {
    grossStampDuty: roundToTwoDecimals(stampDuty),
    exemption: roundToTwoDecimals(exemption),
    exemptionNote,
    netStampDuty: roundToTwoDecimals(stampDuty - exemption),
    breakdown
  };
}

/**
 * Calculate stamp duty for loan agreement
 * @param {number} loanAmount - Loan amount
 * @param {boolean} isFirstTimeBuyer - First-time buyer status
 * @param {number} propertyPrice - Property price (for exemption eligibility)
 * @returns {object} Loan stamp duty
 */
function calculateStampDutyLoan(loanAmount, isFirstTimeBuyer = false, propertyPrice = 0) {
  const grossStampDuty = loanAmount * STAMP_DUTY_LOAN.rate;

  let exemption = 0;
  let exemptionNote = '';

  if (isFirstTimeBuyer && propertyPrice <= STAMP_DUTY_LOAN.firstTimeBuyerMaxPrice) {
    // 100% exemption on first RM500,000 of loan
    const exemptableAmount = Math.min(loanAmount, STAMP_DUTY_LOAN.maxExemption);
    exemption = exemptableAmount * STAMP_DUTY_LOAN.rate;
    exemptionNote = 'First-time buyer exemption (100% on first RM500,000)';
  }

  return {
    grossStampDuty: roundToTwoDecimals(grossStampDuty),
    exemption: roundToTwoDecimals(exemption),
    exemptionNote,
    netStampDuty: roundToTwoDecimals(grossStampDuty - exemption)
  };
}

/**
 * Calculate legal fees
 * @param {number} amount - Property price or loan amount
 * @returns {object} Legal fees breakdown
 */
function calculateLegalFees(amount) {
  let fees = 0;
  let remainingValue = amount;
  const breakdown = [];

  for (const tier of LEGAL_FEES.scale) {
    if (remainingValue <= 0) break;

    const tierMin = tier.min;
    const tierMax = tier.max;
    const tierRange = tierMax - tierMin;

    const feeableAmount = Math.min(remainingValue, tierRange);
    const tierFee = feeableAmount * tier.rate;

    fees += tierFee;
    breakdown.push({
      range: `RM ${formatNumber(tierMin)} - RM ${tierMax === Infinity ? '∞' : formatNumber(tierMax)}`,
      rate: `${tier.rate * 100}%`,
      amount: roundToTwoDecimals(feeableAmount),
      fee: roundToTwoDecimals(tierFee)
    });

    remainingValue -= feeableAmount;
  }

  // Add additional fees
  const additionalFees = Object.values(LEGAL_FEES.additionalFees).reduce((a, b) => a + b, 0);

  return {
    baseFees: roundToTwoDecimals(fees),
    additionalFees: LEGAL_FEES.additionalFees,
    totalAdditionalFees: additionalFees,
    totalFees: roundToTwoDecimals(fees + additionalFees),
    breakdown
  };
}

/**
 * Calculate total upfront costs for property purchase
 * @param {number} propertyPrice - Property price
 * @param {number} loanAmount - Loan amount
 * @param {boolean} isFirstTimeBuyer - First-time buyer status
 * @param {boolean} applyHOC - Apply HOC exemption
 * @returns {object} Complete cost breakdown
 */
function calculateTotalUpfrontCosts(propertyPrice, loanAmount, isFirstTimeBuyer = false, applyHOC = false) {
  const downPayment = propertyPrice - loanAmount;
  const stampDutyMOT = calculateStampDutyMOT(propertyPrice, isFirstTimeBuyer, applyHOC);
  const stampDutyLoan = calculateStampDutyLoan(loanAmount, isFirstTimeBuyer, propertyPrice);
  const legalFeesSPA = calculateLegalFees(propertyPrice);
  const legalFeesLoan = calculateLegalFees(loanAmount);

  // Valuation fee estimate (typically 0.25% of property price, min RM500)
  const valuationFee = Math.max(500, propertyPrice * 0.0025);

  const totalCosts = downPayment +
    stampDutyMOT.netStampDuty +
    stampDutyLoan.netStampDuty +
    legalFeesSPA.totalFees +
    legalFeesLoan.totalFees +
    valuationFee;

  return {
    propertyPrice,
    loanAmount,
    downPayment: roundToTwoDecimals(downPayment),
    downPaymentPercent: roundToTwoDecimals((downPayment / propertyPrice) * 100),
    stampDutyMOT,
    stampDutyLoan,
    legalFeesSPA,
    legalFeesLoan,
    valuationFee: roundToTwoDecimals(valuationFee),
    totalCosts: roundToTwoDecimals(totalCosts),
    summary: {
      downPayment: roundToTwoDecimals(downPayment),
      stampDuty: roundToTwoDecimals(stampDutyMOT.netStampDuty + stampDutyLoan.netStampDuty),
      legalFees: roundToTwoDecimals(legalFeesSPA.totalFees + legalFeesLoan.totalFees),
      valuationFee: roundToTwoDecimals(valuationFee),
      total: roundToTwoDecimals(totalCosts)
    }
  };
}

/**
 * Islamic financing calculation (Murabahah/BBA style - fixed selling price)
 * @param {number} principal - Financing amount
 * @param {number} profitRate - Annual profit rate
 * @param {number} tenureYears - Tenure in years
 * @returns {object} Islamic financing details
 */
function calculateIslamicMurabahah(principal, profitRate, tenureYears) {
  // In Murabahah, the total selling price is fixed upfront
  // Profit = Principal × Rate × Years (simple calculation for illustration)
  const totalProfit = principal * (profitRate / 100) * tenureYears;
  const sellingPrice = principal + totalProfit;
  const monthlyPayment = sellingPrice / (tenureYears * 12);

  return {
    type: 'Murabahah (BBA)',
    principal: roundToTwoDecimals(principal),
    profitRate: profitRate,
    totalProfit: roundToTwoDecimals(totalProfit),
    sellingPrice: roundToTwoDecimals(sellingPrice),
    monthlyPayment: roundToTwoDecimals(monthlyPayment),
    tenureYears,
    totalMonths: tenureYears * 12,
    note: 'Selling price is fixed at contract signing. No rebate for early settlement typically.'
  };
}

/**
 * Islamic financing calculation (Musharakah Mutanaqisah - diminishing partnership)
 * @param {number} principal - Property value
 * @param {number} customerContribution - Customer's initial contribution
 * @param {number} rentalRate - Annual rental/profit rate
 * @param {number} tenureYears - Tenure in years
 * @returns {object} MM financing details
 */
function calculateIslamicMM(principal, customerContribution, rentalRate, tenureYears) {
  // Simplified MM calculation
  // Bank's share = Principal - Customer Contribution
  const bankShare = principal - customerContribution;
  const totalMonths = tenureYears * 12;
  const monthlyRate = rentalRate / 100 / 12;

  // Monthly payment similar to conventional for practical purposes
  // But consists of: Rental (for bank's share) + Equity acquisition
  const monthlyPayment = bankShare *
    (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalPayment = monthlyPayment * totalMonths;
  const totalRental = totalPayment - bankShare;

  return {
    type: 'Musharakah Mutanaqisah',
    propertyValue: roundToTwoDecimals(principal),
    customerInitialShare: roundToTwoDecimals(customerContribution),
    bankShare: roundToTwoDecimals(bankShare),
    rentalRate: rentalRate,
    monthlyPayment: roundToTwoDecimals(monthlyPayment),
    totalPayment: roundToTwoDecimals(totalPayment),
    totalRental: roundToTwoDecimals(totalRental),
    tenureYears,
    totalMonths,
    note: 'Customer gradually acquires bank\'s share. Rebate possible for early settlement.'
  };
}

// Utility functions
function roundToTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}

function formatNumber(num) {
  return num.toLocaleString('en-MY');
}

function formatCurrency(num) {
  return 'RM ' + formatNumber(roundToTwoDecimals(num));
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateMonthlyPayment,
    generateAmortizationSchedule,
    calculateExtraPaymentImpact,
    compareRefinancing,
    calculateAffordability,
    calculateStampDutyMOT,
    calculateStampDutyLoan,
    calculateLegalFees,
    calculateTotalUpfrontCosts,
    calculateIslamicMurabahah,
    calculateIslamicMM,
    roundToTwoDecimals,
    formatNumber,
    formatCurrency
  };
}
