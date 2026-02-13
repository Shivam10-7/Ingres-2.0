/**
 * Domain validator — ensures queries fall within groundwater / water-resource analytics.
 */

const DOMAIN_KEYWORDS = [
  "groundwater",
  "ground water",
  "water",
  "extraction",
  "recharge",
  "aquifer",
  "well",
  "borewell",
  "bore well",
  "rainfall",
  "irrigation",
  "over-exploited",
  "overexploited",
  "semi-critical",
  "critical",
  "safe",
  "categorization",
  "category",
  "state",
  "district",
  "block",
  "assessment",
  "resource",
  "stage",
  "extractable",
  "depletion",
  "usage",
  "consumption",
  "level",
  "table",
  "trend",
  "compare",
  "analysis",
  "analyze",
  "top",
  "highest",
  "lowest",
  "distribution",
  "status",
  "india",
];

const STATE_NAMES = [
  "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
  "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
  "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
  "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
  "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
  "delhi", "chandigarh", "dadra", "daman", "lakshadweep", "puducherry",
  "andaman", "jammu", "kashmir", "ladakh",
];

export function isDomainQuery(query: string): boolean {
  const lower = query.toLowerCase();

  // Check for state names — always domain-relevant
  if (STATE_NAMES.some((s) => lower.includes(s))) return true;

  // Check for domain keywords — at least one must match
  return DOMAIN_KEYWORDS.some((kw) => lower.includes(kw));
}

export const DOMAIN_ERROR_MESSAGE =
  "This system is restricted to groundwater and water-resource analytics. Please ask a question about groundwater extraction, recharge, categorization, or related metrics.";
