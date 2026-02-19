const DEFAULT_MAX_TABS = 10;

// Load the saved setting and populate the input field.
function loadOptions() {
  chrome.storage.sync.get({ maxTabs: DEFAULT_MAX_TABS }, (result) => {
    document.getElementById('maxTabs').value = result.maxTabs;
  });
}

// Persist the setting and show a brief confirmation message.
function saveOptions() {
  const input = document.getElementById('maxTabs');
  const maxTabs = parseInt(input.value, 10);

  if (!Number.isFinite(maxTabs) || maxTabs < 1) {
    showStatus('Please enter a valid number (minimum 1).', true);
    return;
  }

  chrome.storage.sync.set({ maxTabs }, () => {
    showStatus('Options saved.');
  });
}

function showStatus(message, isError = false) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.style.color = isError ? '#dc3545' : '#28a745';
  setTimeout(() => {
    status.textContent = '';
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  loadOptions();
  document.getElementById('save').addEventListener('click', saveOptions);
});
