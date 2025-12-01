// filepath: /Users/czern/IdeaProjects/personio-attendance-recorder/services/ui-log-service.js
// UILogService - Zentrale Verwaltung von Progress-/Result-Logs
class UILogService {
  addLog(containerId, message, isError = false) {
    const log = document.getElementById(containerId);
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = 'progress-log-entry' + (isError ? ' error' : ' success');
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  clear(containerId) {
    const log = document.getElementById(containerId);
    if (log) log.innerHTML = '';
  }

  showResults(type, results) {
    const progressSection = document.getElementById(type === 'import' ? 'importProgressSection' : 'progressSection');
    const resultSection = document.getElementById(type === 'import' ? 'importResultSection' : 'resultSection');
    const summary = document.getElementById(type === 'import' ? 'importResultSummary' : 'resultSummary');
    const details = document.getElementById(type === 'import' ? 'importResultDetails' : 'resultDetails');

    if (progressSection) progressSection.style.display = 'none';
    if (resultSection) resultSection.style.display = 'block';

    const hasErrors = results.failed > 0;
    summary.className = 'result-summary' + (hasErrors ? ' has-errors' : '');
    summary.innerHTML = `<h4>${results.successful} / ${results.total} erfolgreich</h4>` +
      `<p>${results.failed > 0 ? results.failed + ' fehlgeschlagen' : 'Alle Tage erfolgreich'}</p>`;

    details.innerHTML = '';
    for (const item of results.details) {
      const div = document.createElement('div');
      div.className = 'result-item' + (item.success ? '' : ' error');
      div.innerHTML = `<div class="result-item-date">${item.success ? '✅' : '❌'} ${item.date}</div>` +
        `<div class="result-item-message">${item.success ? item.message : item.error}</div>`;
      details.appendChild(div);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UILogService;
}
