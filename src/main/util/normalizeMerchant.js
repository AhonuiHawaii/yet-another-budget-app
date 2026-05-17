/**
 * normalizeMerchant.js
 *
 * Normalizes OFX NAME/MEMO merchant text.
 * Keeps signature:
 * normalizeMerchant(transaction = {}, learnedAliases = [])
 */

const acronymSet = new Set([
  'ACH',
  'ATM',
  'DD',
  'EFT',
  'LLC',
  'INC',
  'USA',
  'US',
  'IRS',
  'POS',
  'APY'
])

const specialCaseMap = new Map([
  ['MCDONALDS', "McDonald's"],
  ["MCDONALD'S", "McDonald's"],
  ['OREILLY', "O'Reilly"],
  ["O'REILLY", "O'Reilly"],
  ["O'REILLYS", "O'Reilly's"],
  ["O'REILLY'S", "O'Reilly's"],
  ['LOWES', "Lowe's"],
  ["LOWE'S", "Lowe's"],
  ['CHICK FIL A', 'Chick-fil-A'],
  ['CHICK-FIL-A', 'Chick-fil-A'],
  ['7 ELEVEN', '7-Eleven'],
  ['TJ MAXX', 'TJ Maxx'],
  ['T J MAXX', 'TJ Maxx']
])

const memoTerms = {
  directDeposit: /\b(?:DD|DIRECT\s+DEP(?:OSIT)?|DIR\s+DEP)\b/i,
  ach: /\bACH(?:\s+(?:DEBIT|CREDIT|PMT|PAYMENT))?\b/i,
  purchase: /\b(?:POS|PURCHASE|DEBIT\s+CARD|CARD\s+PURCHASE)\b/i,
  transfer: /\b(?:TRANSFER|XFER|ONLINE\s+TRANSFER)\b/i,
  atm: /\b(?:ATM|WITHDRAWAL|WD)\b/i,
  check: /\b(?:CHECK|CHK)\b/i,
  fee: /\b(?:FEE|SERVICE\s+CHARGE)\b/i,
  payment: /\b(?:PMT|PAYMENT|WEB\s+AUTHORIZED\s+PMT)\b/i,
  deposit: /\bDEP(?:OSIT)?\b/i,
  refund: /\b(?:REFUND|REVERSAL|RETURN)\b/i,
  payroll: /\b(?:PAYROLL|DIRECT\s+DEP(?:OSIT)?)\b/i
}

const processorPatterns = [
  { pattern: /^\s*PAYPAL\s*\*/i, replace: '' },
  { pattern: /^\s*SQ\s*\*/i, replace: '' },
  { pattern: /^\s*TST\s*\*/i, replace: '' },
  { pattern: /^\s*SP\s*\*/i, replace: '' },
  { pattern: /^\s*STRIPE\s*\*/i, replace: '' },
  { pattern: /^\s*VENMO\s*/i, replace: '' },
  { pattern: /^\s*ZELLE\s*/i, replace: '' },
  { pattern: /^\s*CASH\s*APP\s*\*/i, replace: '' },
  { pattern: /^\s*APL\s*\*/i, replace: 'APPLE ' },
  { pattern: /^\s*GOOGLE\s*\*/i, replace: 'GOOGLE ' },
  { pattern: /\bAMZN\.COM\/BILL\b/i, replace: 'AMAZON' },
  { pattern: /\bAMZN\s+MKTP\b/i, replace: 'AMAZON MARKETPLACE' }
]

const leadingNoisePattern =
  /^(?:ACH|POS|DD|DEP|DEPOSIT|PURCHASE|DEBIT\s+CARD|CARD\s+PURCHASE|RECURRING\s+CARD\s+PURCHASE|ONLINE\s+TRANSFER|WEB\s+AUTHORIZED\s+PMT|ELECTRONIC\s+WITHDRAWAL|PMT|PAYMENT|CHECK|CHK|ATM|WITHDRAWAL|WD|XFER|TRANSFER)\b\s*/i

const trailingNoisePattern =
  /\s*\b(?:ACH|POS|DD|DEP|DEPOSIT|PURCHASE|PMT|PAYMENT|CHECK|CHK|ATM|WITHDRAWAL|WD|XFER|TRANSFER|FEE|SERVICE\s+CHARGE)\b$/i

// Merchants that should never be classified as recurring regardless of
// payment regularity. Walk-in stores, rideshares, and grocery chains where
// same-amount repeats are coincidence (same combo, same fill-up), not a
// subscription. The detector skips any tx whose normalized merchant is here.
export const neverRecurringMerchants = new Set([
  'Walmart',
  'Target',
  'Costco',
  'Safeway',
  'Whole Foods',
  'Home Depot',
  "Lowe's",
  'Ross',
  'TJ Maxx',
  'Walgreens',
  'CVS',
  '7-Eleven',
  'Shell',
  'Chevron',
  'Texaco',
  "McDonald's",
  'Starbucks',
  'DoorDash',
  'Uber',
  'Lyft',
  'Instacart',
  'Taco Bell',
  'Jollibee',
  'Burger King',
  'KFC',
  'Subway',
  "Wendy's",
  'Panda Express',
  'Chipotle',
  'Dunkin',
  'Foodland',
  'Longs Drugs'
])

const merchantAliases = [
  { pattern: /\b(?:WM\s+SUPERCENTER|WAL-?MART|WALMART|WAL\s*MART)\b/i, merchant: 'Walmart' },
  { pattern: /\bTARGET\b/i, merchant: 'Target' },
  { pattern: /\bNETFLIX\b/i, merchant: 'Netflix' },
  { pattern: /\b(?:AMAZON|AMZN|AMAZON\s+MARKETPLACE)\b/i, merchant: 'Amazon' },
  { pattern: /\bCOSTCO\b/i, merchant: 'Costco' },
  { pattern: /\bSAFEWAY\b/i, merchant: 'Safeway' },
  { pattern: /\b(?:STARBUCKS|SBUX)\b/i, merchant: 'Starbucks' },
  { pattern: /\bMCDONALD'?S\b/i, merchant: "McDonald's" },
  { pattern: /\bUBER\b/i, merchant: 'Uber' },
  { pattern: /\bLYFT\b/i, merchant: 'Lyft' },
  { pattern: /\bDOORDASH\b/i, merchant: 'DoorDash' },
  { pattern: /\bINSTACART\b/i, merchant: 'Instacart' },
  { pattern: /\b(?:APPLE|APPLE\.COM\/BILL)\b/i, merchant: 'Apple' },
  { pattern: /\b(?:GOOGLE|GOOGLE\s+PLAY)\b/i, merchant: 'Google' },
  { pattern: /\bHULU\b/i, merchant: 'Hulu' },
  { pattern: /\bSPOTIFY\b/i, merchant: 'Spotify' },
  { pattern: /\bDISNEY\b/i, merchant: 'Disney' },
  { pattern: /\bSHELL\b/i, merchant: 'Shell' },
  { pattern: /\bCHEVRON\b/i, merchant: 'Chevron' },
  { pattern: /\bTEXACO\b/i, merchant: 'Texaco' },
  { pattern: /\bLOWE'?S\b/i, merchant: "Lowe's" },
  { pattern: /\bHOME\s+DEPOT\b/i, merchant: 'Home Depot' },
  { pattern: /\bWHOLE\s+FOODS\b/i, merchant: 'Whole Foods' },
  { pattern: /\bTJ\s*MAXX\b/i, merchant: 'TJ Maxx' },
  { pattern: /\bROSS\b/i, merchant: 'Ross' },
  { pattern: /\bWALGREENS\b/i, merchant: 'Walgreens' },
  { pattern: /\bCVS\b/i, merchant: 'CVS' },
  { pattern: /\b7[-\s]?ELEVEN\b/i, merchant: '7-Eleven' },
  { pattern: /\bO'?REILLY'?S?\b/i, merchant: "O'Reilly" },
  { pattern: /\bCHICK[-\s]?FIL[-\s]?A\b/i, merchant: 'Chick-fil-A' },
  { pattern: /\bTACO\s*BELL\b/i, merchant: 'Taco Bell' },
  { pattern: /\bJOLLIBEE\b/i, merchant: 'Jollibee' },
  { pattern: /\bBURGER\s*KING\b/i, merchant: 'Burger King' },
  { pattern: /\bKFC\b/i, merchant: 'KFC' },
  { pattern: /\bSUBWAY\b/i, merchant: 'Subway' },
  { pattern: /\bWENDY'?S\b/i, merchant: "Wendy's" },
  { pattern: /\bPANDA\s*EXPRESS\b/i, merchant: 'Panda Express' },
  { pattern: /\bCHIPOTLE\b/i, merchant: 'Chipotle' },
  { pattern: /\bDUNKIN\b/i, merchant: 'Dunkin' },
  { pattern: /\b(?:FOODLAND|FOOD\s*LAND)\b/i, merchant: 'Foodland' },
  { pattern: /\bLONGS?\s*DRUGS?\b/i, merchant: 'Longs Drugs' }
]

const regexCache = new Map()

/**
 * Normalizes string whitespace and specific symbols.
 * @param {string} [value=''] - Raw text string.
 * @returns {string} Normalized string.
 */
export function normalizeText(value = '') {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Combines NAME and MEMO fields from an OFX transaction into a single string.
 * @param {object} [transaction={}] - The OFX transaction object.
 * @returns {string} The combined raw text.
 */
export function getRawMerchantText(transaction = {}) {
  return normalizeText([transaction.NAME, transaction.MEMO].filter(Boolean).join(' '))
}

/**
 * Detects the transaction category/type based on the memo text.
 * @param {string} [value=''] - The raw text string.
 * @returns {string|null} The detected memo type, or null if none.
 */
export function detectMemoType(value = '') {
  for (const [type, pattern] of Object.entries(memoTerms)) {
    if (pattern.test(value)) return type
  }

  return null
}

/**
 * Capitalizes a single word properly, handling acronyms, special cases, hyphens, and apostrophes.
 * @param {string} [word=''] - The word to format.
 * @returns {string} The properly capitalized word.
 */
export function titleCaseWord(word = '') {
  const upperWord = word.toUpperCase()

  if (acronymSet.has(upperWord)) return upperWord
  if (specialCaseMap.has(upperWord)) return specialCaseMap.get(upperWord)

  return word
    .split('-')
    .map((part) => {
      const pieces = part.split("'")

      return pieces
        .map((piece, index) => {
          if (!piece) return piece
          if (index > 0 && piece.toLowerCase() === 's') return 's'

          return piece.charAt(0).toUpperCase() + piece.slice(1)
        })
        .join("'")
    })
    .join('-')
}

/**
 * Converts a string to Title Case while respecting acronyms and special cases.
 * @param {string} [value=''] - The string to convert.
 * @returns {string} The Title Cased string.
 */
export function toTitleCase(value = '') {
  const text = normalizeText(value)

  if (!text) return ''

  const upperText = text.toUpperCase()

  if (specialCaseMap.has(upperText)) return specialCaseMap.get(upperText)

  return text.toLowerCase().split(' ').map(titleCaseWord).join(' ')
}

/**
 * Strips out known payment processor prefixes (like PAYPAL, SQ, STRIPE).
 * @param {string} [value=''] - The string to clean.
 * @returns {string} The string without processor noise.
 */
export function removeProcessors(value = '') {
  return processorPatterns.reduce(
    (text, { pattern, replace }) => text.replace(pattern, replace),
    value
  )
}

/**
 * Removes common banking jargon from the beginning and end of the string.
 * @param {string} [value=''] - The string to clean.
 * @returns {string} The string without edge noise.
 */
export function removeEdgeNoise(value = '') {
  let text = value

  for (let i = 0; i < 3; i += 1) {
    text = text.replace(leadingNoisePattern, '').replace(trailingNoisePattern, '')
  }

  return normalizeText(text)
}

/**
 * Removes dates, phone numbers, store numbers, and reference IDs.
 * @param {string} [value=''] - The string to clean.
 * @returns {string} The string without transaction noise.
 */
export function removeTransactionNoise(value = '') {
  return (
    normalizeText(value)
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, ' ')
      .replace(/\b\d{10}\b/g, ' ')
      .replace(/\b\d{2}\/\d{2}(?:\/\d{2,4})?\b/g, ' ')
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
      .replace(/\b(?:REF|ID|AUTH|TRACE|CONF|CONFIRMATION)\s*#?\s*[A-Z0-9-]{5,}\b/gi, ' ')
      .replace(/\b(?:STORE|ST|LOC)\s*#?\s*\d{2,6}\b/gi, ' ')
      .replace(/\b#\s*\d{2,6}\b/g, ' ')
      .replace(/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/g, ' ')
      // Street addresses: number + words + suffix, then anything that follows
      // (city, state, country). Catches "615 Waiakamilo Ave Honolulu, Hi, US".
      .replace(
        /\b\d{1,6}\s+[\w'.-]+(?:\s+[\w'.-]+)*\s+(?:AVE|AVENUE|ST|STREET|RD|ROAD|BLVD|BOULEVARD|DR|DRIVE|WAY|LN|LANE|HWY|HIGHWAY|PKWY|PARKWAY|CT|COURT|PL|PLACE|TER|TERRACE|CIR|CIRCLE)\b.*$/gi,
        ' '
      )
      // Bare numeric store/location IDs (3–7 digits) left after edge-noise pass.
      .replace(/\b\d{3,7}\b/g, ' ')
      // Trailing ", City, ST, US" or ", US" fragments
      .replace(/,\s*US\s*$/i, ' ')
      .replace(/,\s*[A-Z]{2}\s*$/i, ' ')
      .replace(/[,;]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}

/**
 * Collapse consecutive repeated phrases. Bank imports sometimes concatenate
 * NAME and MEMO when MEMO is missing, producing "Foo Foo" or "Foo Foo Foo".
 * @param {string} [value=''] - The string to dedupe.
 * @returns {string} The deduped string.
 */
export function dedupeRepeatedPhrases(value = '') {
  const text = normalizeText(value)
  if (!text) return ''
  const match = text.match(/^(.+?)(?:\s+\1)+$/)
  return match ? match[1].trim() : text
}

/**
 * Strips out remaining symbols like parentheses, asterisks, and underscores.
 * @param {string} [value=''] - The string to clean.
 * @returns {string} The cleaned string.
 */
export function stripSymbols(value = '') {
  return normalizeText(value)
    .replace(/[()*_]/g, ' ')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Runs the text through the full cleaning pipeline (processors, edge noise, symbols).
 * @param {string} [value=''] - The raw text.
 * @returns {string} The fully cleaned merchant candidate string.
 */
export function cleanMerchantText(value = '') {
  const text = normalizeText(value)
  const deduped = dedupeRepeatedPhrases(text)
  const withoutProcessors = removeProcessors(deduped)
  const withoutEdgeNoise = removeEdgeNoise(withoutProcessors)
  const withoutTransactionNoise = removeTransactionNoise(withoutEdgeNoise)
  const withoutSymbols = stripSymbols(withoutTransactionNoise)

  return dedupeRepeatedPhrases(normalizeText(withoutSymbols))
}

/**
 * Matches a string against the hardcoded list of common merchant aliases.
 * @param {string} [value=''] - The text to match.
 * @param {Array} [aliases=merchantAliases] - The aliases array to check against.
 * @returns {string|null} The resolved merchant name, or null.
 */
export function findMerchantAlias(value = '', aliases = merchantAliases) {
  const text = normalizeText(value)

  return aliases.find(({ pattern }) => pattern.test(text))?.merchant || null
}

/**
 * Retrieves a compiled regex from the cache, or compiles and caches it.
 * @param {string} pattern - The regex pattern to compile.
 * @returns {RegExp|null} The compiled RegExp object.
 */
export function getCachedRegex(pattern) {
  if (!pattern) return null

  if (regexCache.has(pattern)) return regexCache.get(pattern)

  try {
    const regex = new RegExp(pattern, 'i')
    regexCache.set(pattern, regex)
    return regex
  } catch {
    regexCache.set(pattern, null)
    return null
  }
}

/**
 * Matches a string against user-defined/learned aliases from the database.
 * @param {string} [value=''] - The text to match.
 * @param {Array} [learnedAliases=[]] - Array of learned alias rule objects.
 * @returns {string|null} The resolved merchant name, or null.
 */
export function findLearnedAlias(value = '', learnedAliases = []) {
  const text = normalizeText(value)
  const upperText = text.toUpperCase()

  for (const rule of learnedAliases) {
    if (!rule?.merchant) continue

    if (rule.rawMerchant && normalizeText(rule.rawMerchant).toUpperCase() === upperText) {
      return rule.merchant
    }

    const regex = getCachedRegex(rule.pattern)

    if (regex?.test(text)) return rule.merchant
  }

  return null
}

/**
 * Calculates a confidence score for the matched merchant name.
 * @param {object} payload - The input properties for the calculation.
 * @param {boolean} [payload.hasLearnedAlias=false] - If a learned alias was matched.
 * @param {boolean} [payload.hasBuiltInAlias=false] - If a built-in alias was matched.
 * @param {string} [payload.cleanedText=''] - The cleaned merchant string.
 * @param {string|null} [payload.memoType=null] - The detected memo type.
 * @returns {number} Confidence score from 0 to 100.
 */
export function getMerchantConfidence({
  hasLearnedAlias = false,
  hasBuiltInAlias = false,
  cleanedText = '',
  memoType = null
} = {}) {
  if (hasLearnedAlias) return 100
  if (hasBuiltInAlias) return 92
  if (cleanedText && memoType) return 78
  if (cleanedText) return 65

  return 0
}

/**
 * Main export: parses and normalizes an OFX transaction into a structured merchant result.
 * @param {object} [transaction={}] - The OFX transaction containing NAME and MEMO fields.
 * @param {Array} [learnedAliases=[]] - User-saved aliases from the database.
 * @returns {{
 * rawText: string,
 * name: string,
 * memo: string,
 * memoType: string|null,
 * cleanedText: string,
 * merchant: string,
 * confidence: number,
 * reason: string
 * }} Normalized merchant result object.
 */
export function normalizeMerchant(transaction = {}, learnedAliases = []) {
  const name = normalizeText(transaction.NAME)
  const memo = normalizeText(transaction.MEMO)
  const rawText = getRawMerchantText(transaction)
  const memoType = detectMemoType(rawText)

  const learnedAlias = findLearnedAlias(rawText, learnedAliases)
  const cleanedText = cleanMerchantText(rawText)
  const builtInAlias = findMerchantAlias(`${rawText} ${cleanedText}`)
  const merchant = learnedAlias || builtInAlias || toTitleCase(cleanedText) || 'Unknown Merchant'

  const confidence = getMerchantConfidence({
    hasLearnedAlias: Boolean(learnedAlias),
    hasBuiltInAlias: Boolean(builtInAlias),
    cleanedText,
    memoType
  })

  const reason = learnedAlias
    ? 'learned_alias'
    : builtInAlias
      ? 'built_in_alias'
      : cleanedText
        ? 'cleaned_text'
        : 'unknown'

  return {
    rawText,
    name,
    memo,
    memoType,
    cleanedText,
    merchant,
    confidence,
    reason
  }
}

export default normalizeMerchant
