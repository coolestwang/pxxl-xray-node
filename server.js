// Minimal VLESS+WS node: Xray listens on $PORT, path $WSPATH, TLS is terminated by the platform edge
const fs = require('fs');
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
fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config));
const child = spawn(bin, ['run', '-c', 'config.json'], { stdio: 'inherit', cwd: __dirname });
child.on('exit', (code) => process.exit(code === null ? 1 : code));
