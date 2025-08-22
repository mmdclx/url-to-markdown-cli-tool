/**
 * Markdown processor module for converting HTML to clean, LLM-friendly markdown.
 * 
 * JavaScript/Node.js equivalent of the Python markdown_processor.py module.
 * Originally inspired by m92vyas/llm-reader.
 */

const cheerio = require('cheerio');
const TurndownService = require('turndown');
const { URL } = require('url');

/**
 * Add proper spacing between HTML elements to prevent text concatenation issues.
 * This function ensures that adjacent elements have appropriate whitespace between them.
 * 
 * @param {CheerioStatic} $ - Cheerio instance with loaded HTML
 */
function addSpacingBetweenElements($) {
    // Define block-level elements that should have line breaks between them
    const blockElements = [
        'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'section', 'article', 'header', 'main', 'footer',
        'li', 'dd', 'dt', 'blockquote', 'pre',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'
    ];
    
    // Define inline elements that should have spaces between them
    const inlineElements = [
        'span', 'a', 'strong', 'b', 'em', 'i', 'small',
        'code', 'label', 'button'
    ];
    
    // Add line breaks after block elements (if not already present)
    blockElements.forEach(tag => {
        $(tag).each((index, element) => {
            const $element = $(element);
            const nextSibling = $element.next();
            
            // If there's a next sibling and no whitespace between them
            if (nextSibling.length && !hasWhitespaceAfter($element)) {
                // Insert a line break
                $element.after('\n');
            }
        });
    });
    
    // Add spaces between inline elements that are adjacent
    inlineElements.forEach(tag => {
        $(tag).each((index, element) => {
            const $element = $(element);
            const nextSibling = $element.next();
            
            // If next sibling exists and is also an inline element or text
            if (nextSibling.length && !hasWhitespaceAfter($element)) {
                const nextTagName = nextSibling.prop('tagName');
                if (nextTagName && (inlineElements.includes(nextTagName.toLowerCase()) || nextSibling.is(':contains'))) {
                    // Insert a space
                    $element.after(' ');
                }
            }
        });
    });
    
    // Special handling for list items - ensure they end with line breaks
    $('li').each((index, element) => {
        const $li = $(element);
        if (!$li.html().endsWith('\n')) {
            $li.append('\n');
        }
    });
}

/**
 * Check if an element has whitespace (spaces, tabs, newlines) after it.
 * 
 * @param {Cheerio} $element - Cheerio element to check
 * @returns {boolean} True if there's whitespace after the element
 */
function hasWhitespaceAfter($element) {
    const nextNode = $element[0].nextSibling;
    if (nextNode && nextNode.type === 'text') {
        return /^\s/.test(nextNode.data);
    }
    return false;
}

/**
 * Post-process markdown text to fix common spacing and readability issues.
 * This function cleans up the converted markdown to ensure proper formatting.
 * 
 * @param {string} markdownText - Raw markdown text from TurndownService
 * @returns {string} Cleaned and properly formatted markdown text
 */
function postProcessMarkdown(markdownText) {
    // Split into lines for processing
    const lines = markdownText.split('\n');
    const cleanedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip excessive blank lines but preserve document structure
        if (trimmedLine || (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim())) {
            // Fix common spacing issues within the line
            let processedLine = line;
            
            // Fix missing spaces after punctuation followed by capital letters
            processedLine = processedLine.replace(/([.!?])([A-Z])/g, '$1 $2');
            
            // Fix percentage/number concatenation (e.g., "20%Increased" -> "20% Increased")
            processedLine = processedLine.replace(/(\d+%?)([A-Z][a-z])/g, '$1 $2');
            
            // Fix common corporate suffix concatenations only
            processedLine = processedLine.replace(/([a-z])(Logo|Inc|Corp|Ltd|LLC)(\s|$)/g, '$1 $2$3');
            
            cleanedLines.push(processedLine);
        }
    }
    
    // Join lines and perform final cleanup
    let result = cleanedLines.join('\n').trim();
    
    // Remove excessive consecutive newlines (more than 2)
    result = result.replace(/\n{3,}/g, '\n\n');
    
    // Fix spacing around headers
    result = result.replace(/\n(#{1,6}\s)/g, '\n\n$1');
    result = result.replace(/(#{1,6}[^\n]+)\n([^\n#])/g, '$1\n\n$2');
    
    // Fix spacing around list items
    result = result.replace(/\n(\*|\+|-|\d+\.)\s/g, '\n\n$1 ');
    
    // Clean up excessive spaces
    result = result.replace(/ {3,}/g, '  '); // Reduce excessive spaces to max 2
    result = result.replace(/\t+/g, '  '); // Convert tabs to 2 spaces
    
    // Final trim
    result = result.trim();
    
    return result;
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
        // Create new document with only included content
        const filteredContent = [];
        
        includeTags.forEach(tag => {
            $(tag).each((index, element) => {
                filteredContent.push($(element).clone());
            });
        });
        
        if (filteredContent.length === 0) {
            // No matching tags found, log warning and return empty document
            console.warn(`Warning: No content found matching the specified include-tags: [${includeTags.join(', ')}]`);
            return cheerio.load('<body></body>');
        }
        
        // Create new document with filtered content
        const newDoc = cheerio.load('<body></body>');
        filteredContent.forEach(content => {
            newDoc('body').append(content);
        });
        
        return newDoc;
        
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
        preserveTableStructure = true
    } = options;

    try {
        // Load HTML with Cheerio
        let $ = cheerio.load(pageSource);
        
        // Apply include-tags filtering first (if specified)
        if (includeTags && includeTags.length > 0) {
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
        
        // Add proper spacing between elements to prevent text concatenation
        addSpacingBetweenElements($);
        
        // Process images
        const removeImageTypeList = [];
        if (removeSvgImage) {
            removeImageTypeList.push('.svg');
        }
        if (removeGifImage) {
            removeImageTypeList.push('.gif');
        }
        removeImageTypeList.push(...removeImageTypes);
        const uniqueRemoveImageTypes = [...new Set(removeImageTypeList)];
        
        $('img').each((index, element) => {
            try {
                const $img = $(element);
                
                if (!keepImages) {
                    $img.remove();
                } else {
                    const imageLink = $img.attr('src');
                    if (typeof imageLink === 'string') {
                        // Check if image type should be removed
                        const shouldRemove = uniqueRemoveImageTypes.some(imgType => 
                            imageLink.includes(imgType)
                        );
                        
                        if (shouldRemove) {
                            $img.remove();
                        } else {
                            // Convert relative URLs to absolute
                            let fullUrl;
                            try {
                                fullUrl = new URL(imageLink, baseUrl).href;
                            } catch (urlError) {
                                // If URL construction fails, use original
                                fullUrl = imageLink;
                            }
                            
                            const altText = $img.attr('alt') || 'Image';
                            // Create proper markdown image syntax
                            $img.replaceWith(`![${altText}](${fullUrl})`);
                        }
                    }
                }
            } catch (error) {
                console.warn('Error while processing image:', error.message);
            }
        });
        
        // Process links
        if (!keepWebpageLinks) {
            // Remove all links and replace with their text content
            $('a').each((index, element) => {
                try {
                    const $link = $(element);
                    const linkText = $link.text().trim();
                    $link.replaceWith(linkText);
                } catch (error) {
                    console.warn('Error while processing link:', error.message);
                }
            });
        } else {
            // Convert relative URLs to absolute
            $('a[href]').each((index, element) => {
                try {
                    const $link = $(element);
                    const href = $link.attr('href');
                    
                    let linkUrl;
                    try {
                        linkUrl = new URL(href, baseUrl).href;
                    } catch (urlError) {
                        // If URL construction fails, use original
                        linkUrl = href;
                    }
                    
                    $link.attr('href', linkUrl);
                } catch (error) {
                    console.warn('Error while processing link:', error.message);
                }
            });
        }

        // Configure TurndownService with enhanced spacing settings
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            strongDelimiter: '**',
            linkStyle: 'inlined',
            linkReferenceStyle: 'full',
            blankReplacement: function (content, node) {
                // Add spaces for empty elements that should have spacing
                return node.isBlock ? '\n\n' : ' ';
            }
        });

        // Configure TurndownService rules for better spacing and formatting
        
        // Add custom rule for better spacing between inline elements
        turndownService.addRule('improvedSpacing', {
            filter: ['span', 'div'],
            replacement: function (content, node, options) {
                // If content is empty or just whitespace, add appropriate spacing
                if (!content.trim()) {
                    return node.isBlock ? '\n\n' : ' ';
                }
                
                // For block elements, ensure they end with proper spacing
                if (node.isBlock) {
                    return content.trim() + '\n\n';
                }
                
                // For inline elements, ensure they have space separation
                return content.trim() + ' ';
            }
        });

        // Custom rule for list items to ensure proper formatting
        turndownService.addRule('betterLists', {
            filter: ['li'],
            replacement: function (content, node, options) {
                content = content
                    .replace(/^\n+/, '') // remove leading newlines
                    .replace(/\n+$/, '\n') // replace trailing newlines with a single one
                    .replace(/\n/gm, '\n    '); // indent
                
                var prefix = options.bulletListMarker + '   ';
                return prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
            }
        });

        // Add enhanced table conversion rules if requested
        if (preserveTableStructure) {
            turndownService.addRule('tableCell', {
                filter: ['th', 'td'],
                replacement: function (content, node, options) {
                    // Convert HTML content to markdown first, then clean
                    let cleanContent = turndownService.turndown(node.innerHTML || '');
                    
                    // Clean up line breaks and excessive whitespace
                    cleanContent = cleanContent
                        .replace(/\n+/g, ' ')          // Replace newlines with spaces
                        .replace(/\s+/g, ' ')          // Normalize multiple spaces to single space
                        .replace(/\|\s*/g, '\\| ')     // Escape pipe characters
                        .trim();
                    
                    // If content is empty, use a space to maintain table structure
                    if (!cleanContent) {
                        cleanContent = ' ';
                    }
                    
                    return cleanContent;
                }
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
                    
                    // Convert each cell using our enhanced cell processing
                    const cellContents = cells.map(cell => {
                        // Process cell content through turndown and clean it
                        let cellContent = turndownService.turndown(cell.innerHTML || '');
                        
                        // Clean up line breaks and excessive whitespace for table cells
                        cellContent = cellContent
                            .replace(/\n+/g, ' ')          // Replace newlines with spaces
                            .replace(/\s+/g, ' ')          // Normalize multiple spaces
                            .replace(/\|\s*/g, '\\| ')     // Escape pipe characters
                            .trim();
                        
                        return cellContent || ' ';
                    });
                    
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
                        
                        // Convert each cell with proper line break handling
                        const cellContents = cells.map(cell => {
                            let cellContent = turndownService.turndown(cell.innerHTML || '');
                            
                            // Clean up line breaks and excessive whitespace for table cells
                            cellContent = cellContent
                                .replace(/\n+/g, ' ')          // Replace newlines with spaces
                                .replace(/\s+/g, ' ')          // Normalize multiple spaces
                                .replace(/\|\s*/g, '\\| ')     // Escape pipe characters
                                .trim();
                            
                            return cellContent || ' ';
                        });
                        
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
        
        // Convert to markdown
        let markdownText = turndownService.turndown(htmlToConvert);
        
        // Enhanced post-processing to fix spacing and readability issues
        markdownText = postProcessMarkdown(markdownText);
        
        return markdownText;

    } catch (error) {
        throw new Error(`Error while processing HTML to markdown: ${error.message}`);
    }
}

module.exports = {
    getProcessedMarkdown
};
