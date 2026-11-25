const { getProcessedMarkdown } = require('../src/lib/markdownProcessor');

const baseUrl = 'https://example.com/docs/';

test('preserves indentation, blank lines, punctuation and language in fenced code', async () => {
    const code = '    console.log("Hello.World");\n\n\n\t// Keep this tab\n';
    const html = `<pre><code class="language-js">${code}</code></pre>`;

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe('```js\n' + code + '```');
});

test('fences plain preformatted text and keeps internal backticks and leading blank lines', async () => {
    const html = '<pre>\n\nExample\n  ```\nEnd</pre>';

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe('````\n\nExample\n  ```\nEnd\n````');
});

test('preserves inline code spacing even with syntax highlighting and inside tables', async () => {
    const html = '<p>Use <code> a   <strong>b</strong> </code>.</p>'
        + '<table><tr><th>Code</th></tr><tr><td><code>x   |  y</code></td></tr></table>';

    const markdown = await getProcessedMarkdown(html, baseUrl);
    expect(markdown).toContain('Use `  a   b  `.');
    expect(markdown).toContain('| `x   \\|  y` |');
});

test('keeps ordered list numbering and indents nested lists and code', async () => {
    const html = '<ol start="10"><li><p>Parent</p><ul><li>Nested</li></ul><pre>    code</pre></li>'
        + '<li>Next</li></ol>';

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe(
        '10. Parent\n\n    * Nested\n\n    ```\n        code\n    ```\n11. Next'
    );
});

test('preserves case and punctuation in link and image destinations', async () => {
    const html = '<p><a href="Next.API(1)?version=20Beta#Section">Guide [v1]</a></p>'
        + '<p><img src="Diagram.Image(2).png" alt="Diagram [v2]" title="A &quot;quote&quot;"></p>';

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe(
        '[Guide \\[v1\\]](https://example.com/docs/Next.API\\(1\\)?version=20Beta#Section)\n\n'
        + '![Diagram \\[v2\\]](https://example.com/docs/Diagram.Image\\(2\\).png "A \\"quote\\"")'
    );
});

test('removes hyperlinks without losing linked images or formatted labels', async () => {
    const html = '<p><a href="guide"><strong>Guide</strong></a> <a href="full-size">'
        + '<img src="thumbnail.png" alt=""></a></p>';

    await expect(getProcessedMarkdown(html, baseUrl, { keepWebpageLinks: false })).resolves.toBe(
        '**Guide** ![](https://example.com/docs/thumbnail.png)'
    );
    const withoutImages = await getProcessedMarkdown(html, baseUrl, { keepImages: false });
    expect(withoutImages).toContain('[**Guide**](https://example.com/docs/guide)');
    expect(withoutImages).not.toContain('thumbnail.png');
});
