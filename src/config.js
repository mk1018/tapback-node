const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.tapback.json');

const DEFAULTS = {
  pinEnabled: true,
  proxyPorts: {}, // { "3000": 3001 } = localhost:3000 -> :3001
  quickButtons: [], // [{ label, command }]
};

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = { load, save, CONFIG_PATH };
