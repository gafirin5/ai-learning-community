/**
 * SSH Command Runner for VPS Deployment
 * Usage: VPS_HOST=... VPS_USER=... VPS_PASS=... node run.js "<command>"
 *
 * Credentials are read from the environment only. Never hardcode them here —
 * this file is committed to a public repository.
 */
const { Client } = require('ssh2');

const host = process.env.VPS_HOST;
const username = process.env.VPS_USER;
const password = process.env.VPS_PASS;

if (!host || !username || !password) {
  console.error('ERROR: set VPS_HOST, VPS_USER and VPS_PASS env vars first');
  process.exit(1);
}

const CONFIG = {
  host,
  port: Number(process.env.VPS_PORT) || 22,
  username,
  password,
  readyTimeout: 20000,
};

const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('Usage: node run.js "<command>"');
  process.exit(1);
}

const conn = new Client();

conn.on('ready', () => {
  conn.exec(command, { pty: false }, (err, stream) => {
    if (err) {
      console.error('EXEC ERROR:', err.message);
      conn.end();
      process.exit(1);
    }
    let output = '';
    let stderr = '';
    stream.on('close', (code) => {
      if (output) process.stdout.write(output);
      if (stderr) process.stderr.write(stderr);
      conn.end();
      process.exit(code);
    })
      .on('data', (data) => { output += data.toString(); })
      .stderr.on('data', (data) => { stderr += data.toString(); });
  });
});

conn.on('error', (err) => {
  console.error('SSH ERROR:', err.message);
  process.exit(1);
});

conn.connect(CONFIG);
