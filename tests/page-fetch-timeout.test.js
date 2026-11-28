jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('puppeteer', () => ({ launch: jest.fn() }));

const { lookup } = require('node:dns/promises');
const { launch } = require('puppeteer');
const { fetchPage } = require('../src/lib/pageFetcher');

test('applies the total deadline before the browser starts', async () => {
    let resolveLookup;
    lookup.mockImplementationOnce(() => new Promise(resolve => { resolveLookup = resolve; }));

    await expect(fetchPage('https://docs.example.test', { captureTimeout: 0.02 }))
        .rejects.toThrow('Capture timed out after 0.02s');

    resolveLookup([{ address: '93.184.216.34', family: 4 }]);
    await new Promise(setImmediate);
    expect(launch).not.toHaveBeenCalled();
});
