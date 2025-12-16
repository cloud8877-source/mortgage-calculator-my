// Malaysian Mortgage Calculator - Data & Constants
// All rates and data specific to Malaysia

const MALAYSIAN_BANKS = {
  conventional: [
    { name: 'Maybank', rate: 4.10, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'CIMB Bank', rate: 4.15, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'Public Bank', rate: 4.05, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'RHB Bank', rate: 4.20, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'Hong Leong Bank', rate: 4.18, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'AmBank', rate: 4.25, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'OCBC Bank', rate: 4.12, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'UOB Bank', rate: 4.22, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'Alliance Bank', rate: 4.28, type: 'conventional', minLoan: 100000, maxTenure: 35 },
    { name: 'Bank Rakyat', rate: 4.30, type: 'conventional', minLoan: 50000, maxTenure: 35 },
  ],
  islamic: [
    { name: 'Maybank Islamic', rate: 4.15, type: 'islamic', product: 'Home Financing-i', minLoan: 100000, maxTenure: 35 },
    { name: 'CIMB Islamic', rate: 4.20, type: 'islamic', product: 'Home Financing-i', minLoan: 100000, maxTenure: 35 },
    { name: 'Public Islamic Bank', rate: 4.10, type: 'islamic', product: 'Musharakah Mutanaqisah', minLoan: 100000, maxTenure: 35 },
    { name: 'RHB Islamic', rate: 4.25, type: 'islamic', product: 'Musharakah Mutanaqisah', minLoan: 100000, maxTenure: 35 },
    { name: 'Hong Leong Islamic', rate: 4.22, type: 'islamic', product: 'Home Financing-i', minLoan: 100000, maxTenure: 35 },
    { name: 'Bank Islam', rate: 4.18, type: 'islamic', product: 'Baiti Home Financing-i', minLoan: 100000, maxTenure: 35 },
    { name: 'Bank Muamalat', rate: 4.35, type: 'islamic', product: 'Home Financing-i', minLoan: 50000, maxTenure: 35 },
    { name: 'Affin Islamic', rate: 4.28, type: 'islamic', product: 'Home Financing-i', minLoan: 100000, maxTenure: 35 },
    { name: 'MBSB Bank', rate: 4.40, type: 'islamic', product: 'Home Financing-i', minLoan: 50000, maxTenure: 35 },
  ]
};

// Stamp Duty Rates for Property Purchase (MOT - Memorandum of Transfer)
const STAMP_DUTY_MOT = {
  standard: [
    { min: 0, max: 100000, rate: 0.01 },       // 1% for first RM100,000
    { min: 100000, max: 500000, rate: 0.02 },  // 2% for RM100,001 - RM500,000
    { min: 500000, max: 1000000, rate: 0.03 }, // 3% for RM500,001 - RM1,000,000
    { min: 1000000, max: Infinity, rate: 0.04 } // 4% above RM1,000,000
  ],
  // First-time buyer exemption for properties up to RM500,000
  firstTimeBuyerExemption: {
    maxPrice: 500000,
    exemptionRate: 1.0 // 100% exemption
  },
  // HOC exemption rates (when applicable)
  hocExemption: {
    minPrice: 300000,
    maxPrice: 2500000,
    exemptionRate: 0.75 // 75% exemption on stamp duty
  }
};

// Stamp Duty for Loan Agreement
const STAMP_DUTY_LOAN = {
  rate: 0.005, // 0.5% of loan amount
  maxExemption: 500000, // First RM500,000 exempt for first-time buyers
  firstTimeBuyerMaxPrice: 500000
};

// Legal Fees Scale (Solicitors' Remuneration Order 2023)
const LEGAL_FEES = {
  scale: [
    { min: 0, max: 500000, rate: 0.01 },       // 1% for first RM500,000
    { min: 500000, max: 1000000, rate: 0.008 }, // 0.8% for RM500,001 - RM1,000,000
    { min: 1000000, max: 3000000, rate: 0.007 }, // 0.7% for RM1,000,001 - RM3,000,000
    { min: 3000000, max: 5000000, rate: 0.006 }, // 0.6% for RM3,000,001 - RM5,000,000
    { min: 5000000, max: 7500000, rate: 0.005 }, // 0.5% for RM5,000,001 - RM7,500,000
    { min: 7500000, max: Infinity, rate: 0.005 } // 0.5% above RM7,500,000
  ],
  // Additional standard fees
  additionalFees: {
    disbursement: 1500,      // Estimated disbursement
    searchFees: 300,         // Title search, bankruptcy search etc
    registrationFees: 200,   // Land office registration
    stampingFees: 100        // Document stamping
  }
};

// BNM DSR Guidelines
const DSR_CONFIG = {
  defaultLimit: 0.60,        // 60% default
  maxLimit: 0.70,            // 70% for high income
  highIncomeThreshold: 10000 // Monthly income threshold for higher DSR
};

// Islamic Financing Products Info
const ISLAMIC_PRODUCTS = {
  murabahah: {
    name: 'Murabahah (BBA)',
    description: 'Bank buys property and sells to customer at marked-up price',
    notes: 'Cost-plus financing. Fixed selling price determined upfront.'
  },
  musharakahMutanaqisah: {
    name: 'Musharakah Mutanaqisah (MM)',
    description: 'Diminishing partnership where customer gradually buys bank\'s share',
    notes: 'Partnership-based. Monthly payment = rental + equity purchase.'
  },
  ijarah: {
    name: 'Ijarah (Lease)',
    description: 'Bank leases property to customer with option to purchase',
    notes: 'Lease-to-own structure. Rental payments with transfer at end.'
  }
};

// Common loan tenures in Malaysia
const COMMON_TENURES = [5, 10, 15, 20, 25, 30, 35];

// Maximum age at loan maturity
const MAX_AGE_AT_MATURITY = {
  employed: 65,
  selfEmployed: 70
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MALAYSIAN_BANKS,
    STAMP_DUTY_MOT,
    STAMP_DUTY_LOAN,
    LEGAL_FEES,
    DSR_CONFIG,
    ISLAMIC_PRODUCTS,
    COMMON_TENURES,
    MAX_AGE_AT_MATURITY
  };
}
