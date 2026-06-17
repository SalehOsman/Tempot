/* eslint-disable */
// Creates apps/docs/src/content/docs/ as a link to docs/product/.
// Docker build contexts can expand that link into a regular directory; when
// the expanded directory mirrors docs/product, the prepare hook accepts it.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/** @param {string} level @param {string} msg */
function log(level, msg) {
  process.stderr.write(JSON.stringify({ level, msg }) + '\n');
}

function collectRelativeFiles(rootPath) {
  const files = [];

  function visit(currentPath, relativePath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const childPath = path.join(currentPath, entry.name);
      const childRelativePath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        visit(childPath, childRelativePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(childRelativePath.split(path.sep).join('/'));
      }
    }
  }

  visit(rootPath, '');
  return files;
}

function directoriesHaveSameFiles(leftPath, rightPath) {
  const leftFiles = collectRelativeFiles(leftPath);
  const rightFiles = collectRelativeFiles(rightPath);

  if (leftFiles.length !== rightFiles.length) {
    return false;
  }

  for (let index = 0; index < leftFiles.length; index += 1) {
    const relativeFile = leftFiles[index];
    if (relativeFile !== rightFiles[index]) {
      return false;
    }

    const leftContent = fs.readFileSync(path.join(leftPath, relativeFile));
    const rightContent = fs.readFileSync(path.join(rightPath, relativeFile));
    if (!leftContent.equals(rightContent)) {
      return false;
    }
  }

  return true;
}

function ensureContentLink(options = {}) {
  const logger = options.logger ?? log;
  const linkPath = options.linkPath ?? path.resolve(__dirname, '..', 'src', 'content', 'docs');
  const targetPath = options.targetPath ?? path.resolve(__dirname, '..', '..', '..', 'docs', 'product');
  const platform = options.platform ?? os.platform();

  if (!fs.existsSync(targetPath)) {
    logger('error', `Target directory does not exist: ${targetPath}`);
    return false;
  }

  if (fs.existsSync(linkPath)) {
    const stats = fs.lstatSync(linkPath);
    if (stats.isSymbolicLink()) {
      const existing = fs.realpathSync(linkPath);
      const resolved = fs.realpathSync(targetPath);
      if (existing === resolved) {
        logger('info', 'Junction already exists: src/content/docs/ -> docs/product/');
        return true;
      }
    }

    if (stats.isDirectory() && directoriesHaveSameFiles(linkPath, targetPath)) {
      logger('info', 'Directory already mirrors docs/product; keeping Docker-expanded content.');
      return true;
    }

    if (!stats.isSymbolicLink()) {
      logger('error', `Path exists but is not a symlink/junction: ${linkPath}`);
      return false;
    }
  }

  fs.mkdirSync(path.resolve(linkPath, '..'), { recursive: true });

  const type = platform === 'win32' ? 'junction' : 'dir';
  try {
    fs.symlinkSync(targetPath, linkPath, type);
    logger('info', 'Junction created: src/content/docs/ -> docs/product/');
    return true;
  } catch (err) {
    if (err.code !== 'EEXIST') {
      logger('error', err.message);
      return false;
    }

    logger('info', 'Junction exists but target might be unreachable. Ignored.');
    return true;
  }
}

function main() {
  if (!ensureContentLink()) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ensureContentLink,
};
