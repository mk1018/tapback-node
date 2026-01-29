const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeStatusStore {
  constructor() {
    this.statuses = new Map(); // key: project_dir or session_id
  }

  update(status) {
    const key = status.project_dir || status.session_id;
    this.statuses.set(key, { ...status, timestamp: new Date().toISOString() });
    // Clean up old (>1h)
    const cutoff = Date.now() - 3600000;
    for (const [k, v] of this.statuses) {
      if (new Date(v.timestamp).getTime() < cutoff) this.statuses.delete(k);
    }
  }

  getAll() {
    return [...this.statuses.values()].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }
}

function installHooks(port = 9876) {
  const homeDir = os.homedir();
  const hooksDir = path.join(homeDir, '.claude', 'hooks');
  const hookScriptPath = path.join(hooksDir, 'tapback-status-hook.sh');
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');

  fs.mkdirSync(hooksDir, { recursive: true });

  const hookScript = `#!/bin/bash
# Tapback Status Hook for Claude Code
# Auto-installed by Tapback

set -e

input=$(cat)

hook_event_name=$(echo "$input" | jq -r '.hook_event_name // empty')
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
model=$(echo "$input" | jq -r '.model // empty')

if [ -z "$session_id" ]; then
    exit 0
fi

case "$hook_event_name" in
    "SessionStart") status="starting" ;;
    "UserPromptSubmit") status="processing" ;;
    "Stop") status="idle" ;;
    "Notification")
        notification_type=$(echo "$input" | jq -r '.notification_type // empty')
        if [ "$notification_type" = "idle_prompt" ]; then
            status="waiting"
        else
            exit 0
        fi
        ;;
    "SessionEnd") status="ended" ;;
    *) exit 0 ;;
esac

TAPBACK_URL="\${TAPBACK_URL:-http://localhost:${port}}"

curl -s -X POST "\${TAPBACK_URL}/api/claude-status" \\
    -H "Content-Type: application/json" \\
    -d "{\\"session_id\\":\\"$session_id\\",\\"status\\":\\"$status\\",\\"project_dir\\":\\"$cwd\\",\\"model\\":\\"$model\\"}" \\
    >/dev/null 2>&1 || true

exit 0
`;

  fs.writeFileSync(hookScriptPath, hookScript, { mode: 0o755 });

  // Update settings.json
  const hooksConfig = {};
  const hookCommand = hookScriptPath;
  for (const event of ['SessionStart', 'UserPromptSubmit', 'Stop', 'SessionEnd']) {
    hooksConfig[event] = [{ hooks: [{ type: 'command', command: hookCommand }] }];
  }
  hooksConfig['Notification'] = [
    { matcher: 'idle_prompt', hooks: [{ type: 'command', command: hookCommand }] },
  ];

  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {}

  const existing = settings.hooks || {};
  for (const [key, value] of Object.entries(hooksConfig)) {
    const arr = existing[key] || [];
    const hasTapback = arr.some(
      (item) =>
        item.hooks &&
        item.hooks.some((h) => h.command && h.command.includes('tapback-status-hook.sh'))
    );
    if (!hasTapback) {
      existing[key] = [...arr, ...value];
    }
  }
  settings.hooks = existing;

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  return true;
}

module.exports = { ClaudeStatusStore, installHooks };
