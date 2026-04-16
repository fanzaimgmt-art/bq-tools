// ── BQ Tools — Auth (Email-based) ──
// Replaced old pro-code system. Now uses email + 6-digit code via Worker.

// These functions are defined in ai.js: isLoggedIn(), isPro(), getCredits(), getCachedUser()
// This file only adds the upgrade modal for backward compatibility.

function showUpgradeModal() {
  if (!isLoggedIn()) {
    window.location.href = '/auth.html';
    return;
  }
  // User is logged in but has no credits
  showNoCreditModal();
}
