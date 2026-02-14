#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const cargoBin = path.join(process.env.USERPROFILE || process.env.HOME || '', '.cargo', 'bin');
const sep = process.platform === 'win32' ? ';' : ':';
const newPath = cargoBin + sep + (process.env.PATH || '');

const env = { ...process.env, PATH: newPath };

const child = spawn('npx', ['tauri', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env,
  cwd: projectRoot,
});

child.on('exit', (code) => process.exit(code ?? 0));
