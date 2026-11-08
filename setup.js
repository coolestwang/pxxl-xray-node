// Minimal setup: fetch the official Xray release zip (latest) and unpack the binary as ./xray
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ZIP_URL = 'https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip';
const dir = __dirname;
const zipPath = path.join(dir, 'xray.zip');
const binPath = path.join(dir, 'xray');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'pxxl-setup' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const f = fs.createWriteStream(dest);
      res.pipe(f);
      f.on('finish', () => f.close(resolve));
      f.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  if (fs.existsSync(binPath)) return;
  console.log('downloading Xray...');
  await download(ZIP_URL, zipPath);
  try {
    execSync(`unzip -o "${zipPath}" xray -d "${dir}"`, { stdio: 'inherit' });
  } catch (e) {
    execSync(`python3 -m zipfile -e "${zipPath}" "${dir}"`, { stdio: 'inherit' });
  }
  fs.chmodSync(binPath, 0o755);
  fs.unlinkSync(zipPath);
  console.log('xray ready');
}

main().catch((e) => { console.error(e); process.exit(1); });
