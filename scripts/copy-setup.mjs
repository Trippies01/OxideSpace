#!/usr/bin/env node
/** Build sonrası NSIS kurulum dosyasını public/downloads/ içine kopyalar (Windows için indir). */
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const nsisDir = join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
const outDir = join(root, 'public', 'downloads');
const outFile = join(outDir, 'OxideSpace-Windows-Setup.exe');

if (!existsSync(nsisDir)) {
  console.warn('NSIS klasörü yok (önce npm run tauri build çalıştırın):', nsisDir);
  process.exit(1);
}

const files = readdirSync(nsisDir);
const setupExe = files.find((f) => f.endsWith('-setup.exe'));
if (!setupExe) {
  console.warn('NSIS içinde *-setup.exe bulunamadı.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(join(nsisDir, setupExe), outFile);
console.log('Kurulum kopyalandı: public/downloads/OxideSpace-Windows-Setup.exe');
