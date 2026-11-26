const { createReadStream } = require('node:fs');
const { createInterface } = require('node:readline');
const { promisify } = require('node:util');

const DEFAULT_CONCURRENCY = 3;
const MAX_CONCURRENCY = 8;

async function runBatch(inputPath, concurrency, convert, output = process.stdout) {
    const input = inputPath === '-' ? process.stdin : createReadStream(inputPath);
    const reader = createInterface({ input, crlfDelay: Infinity });
    const lines = reader[Symbol.asyncIterator]();
    const write = promisify(output.write.bind(output));
    let line = 0;
    let count = 0;
    let failed = 0;

    async function worker() {
        try {
            for (let entry = await lines.next(); !entry.done; entry = await lines.next()) {
                const lineNumber = ++line;
                const url = entry.value.trim();
                if (!url || url.startsWith('#')) continue;

                count++;
                let result;
                try {
                    const markdown = await convert(url);
                    result = { line: lineNumber, url, ok: true, markdown };
                } catch (error) {
                    failed++;
                    result = { line: lineNumber, url, ok: false, error: error.message };
                }
                await write(`${JSON.stringify(result)}\n`);
            }
        } catch (error) {
            reader.close();
            throw error;
        }
    }

    try {
        const workers = await Promise.allSettled(Array.from({ length: concurrency }, worker));
        const error = workers.find(result => result.status === 'rejected');
        if (error) throw error.reason;
        if (!count) throw new Error('No URLs found in batch input');
        return failed;
    } finally {
        reader.close();
        if (inputPath !== '-') input.destroy();
    }
}

module.exports = { runBatch, DEFAULT_CONCURRENCY, MAX_CONCURRENCY };
