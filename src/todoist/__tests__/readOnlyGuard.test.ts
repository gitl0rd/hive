// Protects rule 0.1: Hive never writes to Todoist. Scans the source, not just behaviour.
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(ROOT, 'src');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(p);
    return /\.(ts|tsx|js|jsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

const appFiles = [...sourceFiles(SRC), path.join(ROOT, 'App.tsx')];
const todoistFiles = sourceFiles(path.join(SRC, 'todoist'));

describe('Todoist read-only guard', () => {
  it('finds the files it is meant to check', () => {
    expect(todoistFiles.map((f) => path.basename(f))).toContain('client.ts');
  });

  it('src/todoist never mentions a write method', () => {
    for (const f of todoistFiles) {
      const text = fs.readFileSync(f, 'utf8');
      expect({ file: f, hit: text.match(/\b(POST|PUT|PATCH|DELETE)\b/i)?.[0] }).toEqual({
        file: f,
        hit: undefined,
      });
      for (const m of text.matchAll(/method\s*[:=]\s*['"`](\w+)['"`]/g)) {
        expect({ file: f, method: m[1] }).toEqual({ file: f, method: 'GET' });
      }
    }
  });

  it('only src/todoist/client.ts talks to api.todoist.com or calls fetch', () => {
    const client = path.join(SRC, 'todoist', 'client.ts');
    for (const f of appFiles) {
      if (f === client) continue;
      const text = fs.readFileSync(f, 'utf8');
      expect({ file: f, api: text.includes('api.todoist.com') }).toEqual({ file: f, api: false });
      expect({ file: f, fetch: /\bfetch\s*\(/.test(text) }).toEqual({ file: f, fetch: false });
    }
  });

  it('client.ts allows exactly GET', () => {
    const text = fs.readFileSync(path.join(SRC, 'todoist', 'client.ts'), 'utf8');
    expect(text).toMatch(/new Set\(\['GET'\]\)/);
  });
});
