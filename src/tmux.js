const { execFile } = require('child_process');

const ENV = { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}` };

function run(args) {
  return new Promise((resolve) => {
    execFile('tmux', args, { env: ENV, timeout: 5000 }, (err, stdout) => {
      resolve(err ? '' : stdout);
    });
  });
}

exports.listSessions = async () => {
  const out = await run(['list-sessions', '-F', '#{session_name}']);
  return out.split('\n').filter(Boolean);
};

exports.capture = (session) => run(['capture-pane', '-t', `${session}:0.0`, '-p', '-S', '-300']);

exports.sendKeys = async (session, text) => {
  if (text) {
    await run(['send-keys', '-t', `${session}:0.0`, '-l', text]);
  }
  await run(['send-keys', '-t', `${session}:0.0`, 'Enter']);
};

exports.getCurrentPath = async (session) => {
  const out = await run(['display-message', '-t', `${session}:0.0`, '-p', '#{pane_current_path}']);
  const trimmed = out.trim();
  return trimmed || null;
};
