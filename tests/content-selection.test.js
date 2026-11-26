const { getProcessedMarkdown } = require('../src/lib/markdownProcessor');

const url = 'https://example.com/';

test('keeps CSS matches in page order without duplicating nested matches', async () => {
    const html = '<main><article class="post"><p>First</p><section>Nested</section><aside class="ad">Ad</aside></article>'
        + '<p id="second" data-keep>Second</p><p>Excluded</p></main>';
    const markdown = await getProcessedMarkdown(html, url, {
        select: ['#second[data-keep]', 'main > .post', '.post > section'],
        removeSelectors: ['main .ad']
    });

    expect(markdown).toBe('First\n\nNested\n\nSecond');
});

test('keeps tag selections in page order without repeating an included descendant', async () => {
    const html = '<article>First<section>Nested</section></article><section>Second</section>';

    await expect(getProcessedMarkdown(html, url, { includeTags: ['section', 'article', 'section'] }))
        .resolves.toBe('First\n\nNested\n\nSecond');
});

test.each([
    [{ select: ['article['] }, 'Invalid CSS selector'],
    [{ removeSelectors: ['article['] }, 'Invalid CSS selector'],
    [{ select: ['.missing'] }, 'No content found matching CSS selectors']
])('reports CSS selection errors for %o', async (options, message) => {
    await expect(getProcessedMarkdown('<article>Page</article>', url, options)).rejects.toThrow(message);
});

test('article mode keeps the primary article and its heading while removing navigation', async () => {
    const html = '<nav>Site navigation</nav><main><article>Teaser</article><article><header><h1>Guide</h1></header>'
        + '<p>The main article body.</p><aside>Related articles</aside></article></main>';

    await expect(getProcessedMarkdown(html, url, { article: true }))
        .resolves.toBe('# Guide\n\nThe main article body.');
});

test('article mode falls back to the main landmark or the cleaned body', async () => {
    const options = { article: true };
    await expect(getProcessedMarkdown('<div>Sidebar</div><div role="main">Main content</div>', url, options))
        .resolves.toBe('Main content');
    await expect(getProcessedMarkdown('<nav>Menu</nav><p>Body content</p><footer>Footer</footer>', url, options))
        .resolves.toBe('Body content');
});
