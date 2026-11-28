const { getProcessedMarkdown } = require('../src/lib/markdownProcessor');

const baseUrl = 'https://example.com/docs/';

test('keeps supported link schemes and resolves relative destinations', async () => {
    const html = '<p><a href="guide">Guide</a> <a href="#notes">Notes</a> '
        + '<a href="mailto:help@example.com">Email</a> <a href="tel:+12025550100">Phone</a></p>';

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe(
        '[Guide](https://example.com/docs/guide) [Notes](https://example.com/docs/#notes) '
        + '[Email](mailto:help@example.com) [Phone](tel:+12025550100)'
    );
});

test('keeps labels and nested safe images when links have unsupported or invalid destinations', async () => {
    const html = '<p><a href=" JaVa&#9;ScRiPt:example"><strong>Script</strong></a> '
        + '<a href="file:///example.html"><img src="thumbnail.png" alt="Thumbnail"></a> '
        + '<a href="data:text/plain,example">Data</a> <a href="https://[">Invalid</a></p>';

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe(
        '**Script** ![Thumbnail](https://example.com/docs/thumbnail.png) Data Invalid'
    );
});

test('drops unsupported image schemes and keeps web images', async () => {
    const html = '<p>Images</p><img src="data:image/png;base64,AA==" alt="Inline">'
        + '<img src="blob:https://example.com/example" alt="Blob">'
        + '<img src="file:///example.png" alt="Local"><img src="mailto:help@example.com" alt="Email">'
        + '<img src="//example.com/diagram.png" alt="Diagram">';

    await expect(getProcessedMarkdown(html, baseUrl)).resolves.toBe(
        'Images\n\n![Diagram](https://example.com/diagram.png)'
    );
});

test('keeps literal markup as text in both paragraphs and table captions', async () => {
    const markup = '&lt;img alt="diagram"&gt;';
    const html = `<p>${markup}</p><table><caption>${markup}</caption></table>`;

    const markdown = await getProcessedMarkdown(html, baseUrl);
    expect(markdown).toContain('\\<img alt="diagram">');
    expect(markdown).toContain('**\\<img alt="diagram">**');
});
