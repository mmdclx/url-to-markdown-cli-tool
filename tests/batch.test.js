const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { Writable } = require('node:stream');
const { setTimeout } = require('node:timers/promises');
const { runBatch } = require('../src/lib/batch');

test('keeps fetches within the concurrency limit and processes duplicate URLs', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'url-to-md-workers-'));
    const input = path.join(directory, 'urls.txt');
    const urls = Array.from({ length: 7 }, (_, index) => `https://example.com/${index % 3}`);
    const records = [];
    const output = new Writable({
        write(chunk, encoding, done) {
            records.push(JSON.parse(chunk.toString()));
            done();
        }
    });
    let active = 0;
    let peak = 0;

    try {
        await writeFile(input, urls.join('\n'));
        const failed = await runBatch(input, 3, async (url) => {
            active++;
            peak = Math.max(peak, active);
            await setTimeout(25);
            active--;
            return `# ${url}`;
        }, output);

        expect(failed).toBe(0);
        expect(peak).toBe(3);
        expect(records.sort((a, b) => a.line - b.line)).toEqual(urls.map((url, index) => ({
            line: index + 1, url, ok: true, markdown: `# ${url}`
        })));
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
