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
  // Fast explicit DNS: the container's own resolver is slow, which stalls the first dial
  dns: { servers: ['1.1.1.1', '8.8.8.8'], queryStrategy: 'UseIPv4' },
  inbounds: [{
    listen: '0.0.0.0', port, protocol: 'vless',
    settings: { clients: [{ id: uuid, flow: '' }], decryption: 'none' },
    sniffing: { enabled: true, destOverride: ['http', 'tls'] },
    streamSettings: { network: 'ws', wsSettings: { path: wsPath } }
  }],
  outbounds: [
    // UseIP: resolve once and dial the IP, no re-resolution per connection
    { protocol: 'freedom', tag: 'direct', settings: { domainStrategy: 'UseIP' }, streamSettings: { sockopt: { tcpFastOpen: true } } },
    { protocol: 'blackhole', tag: 'block' }
  ]
};
// App dir is read-only at runtime on Pxxl; write the config to the temp dir
const configPath = path.join(os.tmpdir(), 'xray-config.json');
fs.writeFileSync(configPath, JSON.stringify(config));
const child = spawn(bin, ['run', '-c', configPath], { stdio: 'inherit', cwd: __dirname });
child.on('exit', (code) => process.exit(code === null ? 1 : code));
