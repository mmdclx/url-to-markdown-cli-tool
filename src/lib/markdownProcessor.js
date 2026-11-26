/**
 * Markdown processor module for converting HTML to clean, LLM-friendly markdown.
 * 
 * JavaScript/Node.js equivalent of the Python markdown_processor.py module.
 * Originally inspired by m92vyas/llm-reader.
 */

const cheerio = require('cheerio');
const TurndownService = require('turndown');
const { URL } = require('url');

function resolveUrl(value, baseUrl) {
    try {
        return new URL(value, baseUrl).href;
    } catch {
        return value;
    }
}

function backtickFence(code, minimum) {
    let length = minimum;
    for (const run of code.matchAll(/`+/g)) {
        length = Math.max(length, run[0].length + 1);
    }
    return '`'.repeat(length);
}

function extractSelection($, nodes) {
    const selected = new Set(nodes);
    const document = cheerio.load('<body></body>');
    const body = document('body');
    for (const node of selected) {
        const element = $(node);
        if (!element.parents().toArray().some(parent => selected.has(parent))) {
            const content = node.name === 'body' ? element.contents() : element;
            body.append(content.clone());
        }
    }
    return document;
}

function findCss($, selectors) {
    try {
        // find() parses selectors, while $() can also interpret a string as HTML.
        return $.root().find(selectors.join(', '));
    } catch (error) {
        throw new Error(`Invalid CSS selector in ${JSON.stringify(selectors)}: ${error.message}`);
    }
}

function extractArticle($) {
    for (const selector of ['article, [role="article"]', 'main, [role="main"]']) {
        let best;
        let longest = 0;
        $(selector).each((index, node) => {
            const length = $(node).text().trim().length;
            if (length > longest) {
                best = node;
                longest = length;
            }
        });
        if (best) return extractSelection($, [best]);
    }
    return $;
}

/**
 * Filter HTML content to include only specified tags and their content.
 * This function extracts content from specified HTML tags, preserving hierarchy and nesting.
 * 
 * @param {CheerioStatic} $ - Cheerio instance with loaded HTML
 * @param {Array<string>} includeTags - Array of HTML tag names to include
 * @returns {CheerioStatic} Filtered Cheerio object with only included content
 * @throws {Error} If include-tags processing fails
 */
function filterToIncludeTags($, includeTags) {
    if (!includeTags || includeTags.length === 0) {
        return $; // No filtering, return original
    }
    
    try {
        const selected = new Set(includeTags.flatMap(tag => $(tag).toArray()));
        const matches = $('*').toArray().filter(node => selected.has(node));
        if (matches.length === 0) {
            // No matching tags found, log warning and return empty document
            console.warn(`Warning: No content found matching the specified include-tags: [${includeTags.join(', ')}]`);
            return cheerio.load('<body></body>');
        }
        
        return extractSelection($, matches);
        
    } catch (error) {
        // If include-tags processing fails, log warning and fall back to original document
        console.warn(`Warning: Include-tags processing failed (${error.message}), falling back to full document processing`);
        return $;
    }
}

/**
 * Process HTML source and convert to clean, LLM-friendly markdown.
 * 
 * @param {string} pageSource - HTML source text
 * @param {string} baseUrl - Base URL of the HTML source
 * @param {Object} options - Processing options
 * @param {boolean} [options.keepImages=true] - Keep image links
 * @param {boolean} [options.removeSvgImage=true] - Remove .svg images
 * @param {boolean} [options.removeGifImage=true] - Remove .gif images
 * @param {Array<string>} [options.removeImageTypes=[]] - Additional image extensions to remove
 * @param {boolean} [options.keepWebpageLinks=true] - Keep webpage links
 * @param {boolean} [options.removeScriptTag=true] - Remove script tags
 * @param {boolean} [options.removeStyleTag=true] - Remove style tags
 * @param {Array<string>} [options.removeTags=[]] - Additional HTML tags to remove
 * @param {Array<string>} [options.includeTags] - HTML tags to include (filters content to only these tags)
 * @param {boolean} [options.article=false] - Extract the main article or page content
 * @param {Array<string>} [options.select] - CSS selectors to include
 * @param {Array<string>} [options.removeSelectors] - CSS selectors to remove before extraction
 * @param {boolean} [options.preserveTableStructure=false] - Enable enhanced table formatting
 * @returns {Promise<string>} Clean markdown text ready for LLM processing
 * @throws {Error} If there's an error while processing the HTML
 */
async function getProcessedMarkdown(pageSource, baseUrl, options = {}) {
    const {
        keepImages = true,
        removeSvgImage = true,
        removeGifImage = true,
        removeImageTypes = [],
        keepWebpageLinks = true,
        removeScriptTag = true,
        removeStyleTag = true,
        removeTags = [],
        includeTags = [],
        article = false,
        select = [],
        removeSelectors = [],
        preserveTableStructure = true
    } = options;

    try {
        // Load HTML with Cheerio
        let $ = cheerio.load(pageSource);
        
        if (removeSelectors.length) {
            findCss($, removeSelectors).remove();
        }
        if (select.length) {
            const matches = findCss($, select).toArray();
            if (!matches.length) {
                throw new Error(`No content found matching CSS selectors ${JSON.stringify(select)}`);
            }
            $ = extractSelection($, matches);
        } else if (article) {
            $ = extractArticle($);
        } else if (includeTags && includeTags.length > 0) {
            $ = filterToIncludeTags($, includeTags);
        }
        
        // Build list of tags to remove
        const tagsToRemove = [];
        if (removeScriptTag) {
            tagsToRemove.push('script');
        }
        if (removeStyleTag) {
            tagsToRemove.push('style');
        }
        if (article) {
            tagsToRemove.push('nav', 'aside', 'footer', 'noscript', 'canvas');
        }
        tagsToRemove.push(...removeTags);
        
        // Apply tag priority resolution: include-tags takes precedence over remove-tags
        // If a tag appears in both lists, it should be included (not removed)
        const uniqueTagsToRemove = [...new Set(tagsToRemove)];
        const finalTagsToRemove = includeTags && includeTags.length > 0 
            ? uniqueTagsToRemove.filter(tag => !includeTags.includes(tag))
            : uniqueTagsToRemove;
        
        // Remove unwanted tags (respecting include-tags priority)
        finalTagsToRemove.forEach(tag => {
            try {
                $(tag).remove();
            } catch (error) {
                console.warn(`Error while removing tag ${tag}:`, error.message);
            }
        });
        
        // Normalize image sources before handing the elements to Turndown.
        const imageTypesToRemove = [...removeImageTypes];
        if (removeSvgImage) imageTypesToRemove.push('.svg');
        if (removeGifImage) imageTypesToRemove.push('.gif');

        $('img').each((index, element) => {
            const image = $(element);
            const src = image.attr('src');
            if (!keepImages || imageTypesToRemove.some(type => src?.includes(type))) {
                image.remove();
            } else if (src) {
                image.attr('src', resolveUrl(src, baseUrl));
            }
        });

        $('a').each((index, element) => {
            const link = $(element);
            const href = link.attr('href');
            if (!keepWebpageLinks) {
                link.replaceWith(link.contents());
            } else if (href !== undefined) {
                link.attr('href', resolveUrl(href, baseUrl));
            }
        });

        $('pre').each((index, element) => {
            const first = element.children[0];
            if (first?.type === 'text' && first.data.startsWith('\n')) {
                // Cheerio already dropped the HTML opening newline. Keep the next parse from dropping another.
                $(element).prepend('<!---->');
            }
        });

        const renderCodeBlock = (_content, node) => {
            const code = node.textContent;
            const language = node.firstElementChild?.getAttribute('class')
                ?.match(/(?:^|\s)language-([^\s`]+)/)?.[1] ?? '';
            const fence = backtickFence(code, 3);
            const end = code.endsWith('\n') ? '' : '\n';
            return `\n\n${fence}${language}\n${code}${end}${fence}\n\n`;
        };

        const renderInlineCode = (_content, node) => {
            const code = node.textContent.replace(/\r\n?|\n/g, ' ');
            if (!code) return '';
            const fence = backtickFence(code, 1);
            // Markdown strips one space from both ends of padded, non-blank code spans.
            const padding = /(^`|`$|^ .*[^ ].* $)/.test(code) ? ' ' : '';
            return `${fence}${padding}${code}${padding}${fence}`;
        };

        const listNumbers = new WeakMap();
        const renderListItem = (content, node, options) => {
            let marker = options.bulletListMarker;
            const list = node.parentNode;
            if (list.nodeName === 'OL') {
                const start = Number.parseInt(list.getAttribute('start'), 10);
                const number = listNumbers.get(list) ?? (Number.isNaN(start) ? 1 : start);
                listNumbers.set(list, number + 1);
                marker = `${number}.`;
            }

            const prefix = `${marker} `;
            const indentation = ' '.repeat(prefix.length);
            const body = content.replace(/^\n+|\n+$/g, '').replace(/\n(?=.)/g, `\n${indentation}`);
            return prefix + body + (node.nextElementSibling ? '\n' : '');
        };

        const turndownService = new TurndownService({
            headingStyle: 'atx',
            preformattedCode: true,
            emDelimiter: '*',
            blankReplacement: (content, node, options) => {
                if (node.nodeName === 'PRE') return renderCodeBlock(content, node);
                if (node.nodeName === 'CODE') return renderInlineCode(content, node);
                if (node.nodeName === 'LI') return renderListItem(content, node, options);
                return node.isBlock ? '\n\n' : '';
            }
        });

        turndownService.addRule('preformattedBlock', { filter: 'pre', replacement: renderCodeBlock });
        turndownService.addRule('inlineCode', { filter: 'code', replacement: renderInlineCode });
        turndownService.addRule('listItem', { filter: 'li', replacement: renderListItem });

        turndownService.addRule('image', {
            filter: 'img',
            replacement: (_content, node) => {
                const src = node.getAttribute('src');
                if (!src) return '';

                const alt = turndownService.escape((node.getAttribute('alt') ?? 'Image').replace(/\s*[\r\n]+\s*/g, ' '));
                const destination = src.replace(/([()])/g, '\\$1');
                const title = node.getAttribute('title')?.replace(/\s*[\r\n]+\s*/g, ' ').replace(/[\\"]/g, '\\$&');
                const titlePart = title ? ` "${title}"` : '';
                return `![${alt}](${destination}${titlePart})`;
            }
        });

        // Add enhanced table conversion rules if requested
        if (preserveTableStructure) {
            const convertCell = (cell) => turndownService.turndown(cell.innerHTML)
                .replace(/\n+/g, ' ')
                .replace(/\|/g, '\\|')
                .trim() || ' ';

            turndownService.addRule('tableCell', {
                filter: ['th', 'td'],
                replacement: (_content, node) => convertCell(node)
            });

            turndownService.addRule('tableRow', {
                filter: 'tr',
                replacement: function (content, node, options) {
                    // Extract all cells from this row
                    const cells = Array.from(node.children).filter(child => 
                        child.tagName && ['TD', 'TH'].includes(child.tagName.toUpperCase())
                    );
                    
                    if (cells.length === 0) {
                        return '';
                    }
                    
                    const cellContents = cells.map(convertCell);

                    return '| ' + cellContents.join(' | ') + ' |\n';
                }
            });

            turndownService.addRule('table', {
                filter: 'table',
                replacement: function (content, node, options) {
                    // Extract caption if present
                    const caption = node.querySelector('caption');
                    let captionText = '';
                    if (caption) {
                        captionText = caption.textContent.trim();
                    }
                    
                    // Extract all rows
                    const rows = Array.from(node.querySelectorAll('tr'));
                    
                    if (rows.length === 0) {
                        return captionText ? '\n**' + captionText + '**\n\n' : '\n';
                    }
                    
                    let tableMarkdown = captionText ? '\n**' + captionText + '**\n\n' : '\n';
                    let hasHeaders = false;
                    
                    // Check if first row contains th elements
                    const firstRowCells = Array.from(rows[0].children);
                    if (firstRowCells.some(cell => cell.tagName && cell.tagName.toUpperCase() === 'TH')) {
                        hasHeaders = true;
                    }
                    
                    // Process each row
                    rows.forEach((row, index) => {
                        const cells = Array.from(row.children).filter(child => 
                            child.tagName && ['TD', 'TH'].includes(child.tagName.toUpperCase())
                        );
                        
                        if (cells.length === 0) {
                            return;
                        }
                        
                        const cellContents = cells.map(convertCell);

                        tableMarkdown += '| ' + cellContents.join(' | ') + ' |\n';
                        
                        // Add header separator after first row if it contains headers
                        if (index === 0 && hasHeaders) {
                            const separators = cellContents.map(() => '---');
                            tableMarkdown += '| ' + separators.join(' | ') + ' |\n';
                        }
                    });
                    
                    return tableMarkdown + '\n';
                }
            });

            turndownService.addRule('tableCaption', {
                filter: 'caption',
                replacement: function (content, node, options) {
                    content = content.trim();
                    return content ? '\n**' + content + '**\n\n' : '';
                }
            });
        }

        // Get body content or fall back to full document
        const bodyContent = $('body');
        const htmlToConvert = bodyContent.length > 0 ? bodyContent.html() : $.html();
        
        if (!htmlToConvert) {
            throw new Error('No HTML content to convert');
        }
        
        return turndownService.turndown(htmlToConvert);

    } catch (error) {
        throw new Error(`Error while processing HTML to markdown: ${error.message}`);
    }
}

module.exports = {
    getProcessedMarkdown
};
