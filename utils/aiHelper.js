// utils/aiHelper.js
//
// Lightweight, rule/keyword-based "AI" helper module.
// In a real-world project this could call an external LLM API (e.g. Anthropic/OpenAI),
// but for this mini-project we simulate AI behaviour using NLP-style keyword
// matching and heuristics so the project runs fully offline with no API keys.

/**
 * AI Leave Type Suggestion
 * Analyzes the free-text reason given by the employee and suggests
 * the most appropriate leave type.
 * Example: "I have fever and need rest" -> "Sick"
 */
const suggestLeaveType = (reason = '') => {
  const text = reason.toLowerCase();

  const keywordMap = {
    Sick: ['fever', 'sick', 'ill', 'cold', 'cough', 'headache', 'pain', 'hospital',
           'doctor', 'flu', 'infection', 'surgery', 'unwell', 'vomit', 'injury', 'rest'],
    Maternity: ['maternity', 'pregnan', 'delivery', 'childbirth', 'baby'],
    Casual: ['personal', 'function', 'wedding', 'marriage', 'travel', 'trip',
             'family event', 'festival', 'shopping', 'outing', 'visit'],
    Earned: ['vacation', 'holiday', 'planned', 'earned', 'annual leave', 'long leave'],
    Other: [],
  };

  let bestMatch = 'Other';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(keywordMap)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }

  return bestMatch;
};

/**
 * AI Reason Summarization
 * Converts a long leave reason into a short summary (max ~8 words).
 * Uses simple extractive summarization: picks the most informative
 * sentence/clause and trims it.
 */
const summarizeReason = (reason = '') => {
  if (!reason) return '';

  const cleaned = reason.trim().replace(/\s+/g, ' ');

  // If already short, return as-is
  const words = cleaned.split(' ');
  if (words.length <= 8) return cleaned;

  // Remove common filler/stop words to shorten the sentence
  const stopWords = new Set([
    'i', 'am', 'is', 'are', 'was', 'were', 'a', 'an', 'the', 'to', 'and',
    'for', 'of', 'in', 'on', 'at', 'my', 'me', 'so', 'that', 'this',
    'because', 'due', 'as', 'will', 'be', 'need', 'have', 'has', 'had',
    'please', 'kindly', 'would', 'like', 'request', 'requesting',
  ]);

  const importantWords = words.filter(
    (w) => !stopWords.has(w.toLowerCase().replace(/[.,!?]/g, ''))
  );

  const summaryWords = importantWords.slice(0, 8);
  let summary = summaryWords.join(' ');

  // Capitalize first letter for readability
  summary = summary.charAt(0).toUpperCase() + summary.slice(1);
  return summary + (importantWords.length > 8 ? '...' : '');
};

/**
 * AI Auto Approval Rule
 * Leave requests of 1-2 days are automatically approved.
 * Longer requests are routed to the admin for manual approval.
 * Returns: { autoApproved: boolean, status: 'Approved' | 'Pending' }
 */
const evaluateAutoApproval = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate total number of days (inclusive of both start and end date)
  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (totalDays >= 1 && totalDays <= 2) {
    return { autoApproved: true, status: 'Approved', totalDays };
  }

  return { autoApproved: false, status: 'Pending', totalDays };
};

module.exports = { suggestLeaveType, summarizeReason, evaluateAutoApproval };
