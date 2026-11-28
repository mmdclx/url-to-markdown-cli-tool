const MAX_HTML_BYTES = 5 * 1024 * 1024;

function readDocument(maxBytes) {
    // Reject obviously oversized documents before allocating their serialized markup.
    let minimumLength = 0;
    const roots = [document];
    while (roots.length) {
        const walker = document.createTreeWalker(roots.pop());
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (node instanceof Element) {
                minimumLength += node.localName.length + 2;
                for (const attribute of node.attributes) {
                    minimumLength += attribute.localName.length + attribute.value.length;
                    if (minimumLength > maxBytes) return null;
                }
                if (node instanceof HTMLTemplateElement) roots.push(node.content);
            } else if (node instanceof CharacterData) {
                minimumLength += node.length;
            }
            if (minimumLength > maxBytes) return null;
        }
    }

    const serializer = new XMLSerializer();
    let html = '';
    for (const node of document.childNodes) {
        html += node === document.documentElement ? node.outerHTML : serializer.serializeToString(node);
        if (html.length > maxBytes) return null;
    }
    if (new TextEncoder().encode(html).byteLength > maxBytes) return null;
    return { html, baseUrl: document.baseURI };
}

async function captureDocument(page) {
    // A separate JavaScript world keeps the page from replacing the capture primitives.
    // The session is released when the browser owned by this capture closes.
    const session = await page.createCDPSession();
    const { frameTree } = await session.send('Page.getFrameTree');
    const { executionContextId } = await session.send('Page.createIsolatedWorld', { frameId: frameTree.frame.id });
    const { result, exceptionDetails } = await session.send('Runtime.callFunctionOn', {
        executionContextId,
        functionDeclaration: readDocument.toString(),
        arguments: [{ value: MAX_HTML_BYTES }],
        returnByValue: true
    });
    if (exceptionDetails) {
        throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    if (result.value === null) {
        throw new Error(`Captured HTML exceeds the ${MAX_HTML_BYTES / (1024 * 1024)} MiB limit`);
    }
    return result.value;
}

module.exports = { captureDocument };
