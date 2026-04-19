/* eslint-disable */
// setup-content-link.js — Creates directory junction/symlink from
// apps/docs/src/content/docs/ → docs/product/ (project root)
// Starlight 0.34.x requires content at src/content/docs/ — no contentDir option.
// This script is idempotent and runs automatically via the "prepare" hook.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/** @param {string} level @param {string} msg */
function log(level, msg) {
  process.stderr.write(JSON.stringify({ level, msg }) + '\n');
}

function main() {
  const linkPath = path.resolve(__dirname, '..', 'src', 'content', 'docs');
  const targetPath = path.resolve(__dirname, '..', '..', '..', 'docs', 'product');

  if (!fs.existsSync(targetPath)) {
    log('error', `Target directory does not exist: ${targetPath}`);
    process.exitCode = 1;
    return;
  }

  if (fs.existsSync(linkPath)) {
    const stats = fs.lstatSync(linkPath);
    if (stats.isSymbolicLink()) {
      const existing = fs.realpathSync(linkPath);
      const resolved = fs.realpathSync(targetPath);
      if (existing === resolved) {
        log('info', 'Junction already exists: src/content/docs/ → docs/product/');
        return;
      }
    }
    if (!stats.isSymbolicLink()) {
      log('error', `Path exists but is not a symlink/junction: ${linkPath}`);
      process.exitCode = 1;
      return;
    }
  }

  // Ensure parent directory exists
  fs.mkdirSync(path.resolve(linkPath, '..'), { recursive: true });

  const type = os.platform() === 'win32' ? 'junction' : 'dir';
  try {
    fs.symlinkSync(targetPath, linkPath, type);
    log('info', 'Junction created: src/content/docs/ → docs/product/');
  } catch (err) {
    if (err.code !== 'EEXIST') {
      log('error', err.message);
      process.exitCode = 1;
    } else {
      log('info', 'Junction exists but target might be unreachable. Ignored.');
    }
  }
}

main();
