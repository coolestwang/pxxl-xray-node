// Minimal VLESS+WS node: Xray listens on $PORT, path $WSPATH, TLS is terminated by the platform edge
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execSync } = require('child_process');
const uuid = process.env.UUID || process.env.APP_KEY;
const wsPath = process.env.WSPATH || process.env.API_ROUTE || '/ws';
const port = parseInt(process.env.PORT || '8080', 10);
if (!uuid) { console.error('UUID env required'); process.exit(1); }

const bin = path.join(__dirname, 'xray');
if (!fs.existsSync(bin)) execSync('node setup.js', { stdio: 'inherit', cwd: __dirname });

const config = {
  log: { loglevel: 'warning' },
  inbounds: [{
    listen: '0.0.0.0', port, protocol: 'vless',
    settings: { clients: [{ id: uuid, flow: '' }], decryption: 'none' },
    streamSettings: { network: 'ws', wsSettings: { path: wsPath } }
  }],
  outbounds: [
    { protocol: 'freedom', tag: 'direct' },
    { protocol: 'blackhole', tag: 'block' }
  ]
};
// Runtime containers run as a non-root user and the app dir may be read-only,
// so fall back to the writable temp dir when writing the generated config.
let configPath = path.join(__dirname, 'config.json');
try {
  fs.writeFileSync(configPath, JSON.stringify(config));
} catch (err) {
  if (err.code !== 'EACCES') throw err;
  configPath = path.join(os.tmpdir(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config));
}
console.log('config written to', configPath);
const child = spawn(bin, ['run', '-c', configPath], { stdio: 'inherit', cwd: __dirname });
child.on('exit', (code) => process.exit(code === null ? 1 : code));
