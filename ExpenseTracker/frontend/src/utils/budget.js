/** Progress-bar colour for a budget: green < 80%, amber 80-100%, red when exceeded. */
export function budgetColor(percentUsed) {
  if (percentUsed > 100) return 'error';
  if (percentUsed >= 80) return 'warning';
  return 'success';
}
