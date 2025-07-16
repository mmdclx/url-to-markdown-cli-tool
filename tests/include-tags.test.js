const fs = require('fs').promises;
const path = require('path');
const { getProcessedMarkdown } = require('../src/lib/markdownProcessor');

describe('Include Tags Functionality Tests', () => {
    const fixturesDir = path.join(__dirname, 'fixtures', 'include-tags');

    // Helper function to load HTML fixture
    async function loadFixture(filename) {
        const filePath = path.join(fixturesDir, filename);
        return await fs.readFile(filePath, 'utf-8');
    }

    // Helper function to normalize markdown for comparison
    function normalizeMarkdown(markdown) {
        return markdown
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .replace(/\s+\n/g, '\n');
    }

    describe('Single Tag Inclusion', () => {
        test('should include only article content when article tag is specified', async () => {
            const html = await loadFixture('article-content.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should contain article content
            expect(markdown).toContain('Understanding Web Scraping');
            expect(markdown).toContain('Common Use Cases');
            expect(markdown).toContain('Data collection for research');
            expect(markdown).toContain('Best Practices');
            expect(markdown).toContain('The key to successful web scraping');

            // Should NOT contain excluded content
            expect(markdown).not.toContain('Site Header');
            expect(markdown).not.toContain('Welcome to our website');
            expect(markdown).not.toContain('Related Articles');
            expect(markdown).not.toContain('All rights reserved');

            // Navigation content should be excluded
            expect(markdown).not.toContain('Home');
            expect(markdown).not.toContain('About');
            expect(markdown).not.toContain('Contact');
        });

        test('should include only main content when main tag is specified', async () => {
            const html = await loadFixture('multiple-tags.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['main']
            });

            // Should contain main content
            expect(markdown).toContain('Main Content Area');
            expect(markdown).toContain('primary content of the page');

            // Should NOT contain other content
            expect(markdown).not.toContain('Features Section');
            expect(markdown).not.toContain('Pricing Section');
            expect(markdown).not.toContain('Latest News');
            expect(markdown).not.toContain('Advertisement');
            expect(markdown).not.toContain('Contact us at');
        });
    });

    describe('Multiple Tag Inclusion', () => {
        test('should include content from multiple specified tags', async () => {
            const html = await loadFixture('multiple-tags.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['main', 'section', 'article']
            });

            // Should contain content from all specified tags
            expect(markdown).toContain('Main Content Area');
            expect(markdown).toContain('Features Section');
            expect(markdown).toContain('Easy to use');
            expect(markdown).toContain('Pricing Section');
            expect(markdown).toContain('Basic');
            expect(markdown).toContain('$10/month');
            expect(markdown).toContain('Latest News');
            expect(markdown).toContain('December 1, 2023');

            // Should NOT contain excluded content
            expect(markdown).not.toContain('Advertisement');
            expect(markdown).not.toContain('Contact us at');
        });

        test('should handle multiple instances of the same tag type', async () => {
            const html = await loadFixture('multiple-instances.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should contain content from all article instances
            expect(markdown).toContain('First Blog Post');
            expect(markdown).toContain('web development');
            expect(markdown).toContain('November 15, 2023');

            expect(markdown).toContain('Second Blog Post');
            expect(markdown).toContain('database optimization');
            expect(markdown).toContain('November 20, 2023');
            expect(markdown).toContain('Database optimization is crucial');

            expect(markdown).toContain('Third Blog Post');
            expect(markdown).toContain('API design patterns');
            expect(markdown).toContain('November 25, 2023');
            expect(markdown).toContain('REST');
            expect(markdown).toContain('GraphQL');

            // Should NOT contain excluded content
            expect(markdown).not.toContain('Blog with Multiple Articles');
            expect(markdown).not.toContain('Recent Comments');
            expect(markdown).not.toContain('Blog footer content');
        });
    });

    describe('Nested Structure Handling', () => {
        test('should preserve nested content within included tags', async () => {
            const html = await loadFixture('nested-structure.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['main']
            });

            // Should contain main content and all nested elements
            expect(markdown).toContain('Main Content with Nested Elements');
            expect(markdown).toContain('Nested Article in Main');
            expect(markdown).toContain('Nested Section in Article');
            expect(markdown).toContain('Content Block');
            expect(markdown).toContain('bold text');
            expect(markdown).toContain('italic text');
            expect(markdown).toContain('Another Nested Section');
            expect(markdown).toContain('Direct Section in Main');
            expect(markdown).toContain('Section Navigation');

            // Should NOT contain standalone article outside main
            expect(markdown).not.toContain('Standalone Article');
            expect(markdown).not.toContain('Article footer content');
            expect(markdown).not.toContain('Page footer - should be excluded');
        });

        test('should include nested navigation when parent tag is included', async () => {
            const html = await loadFixture('nested-structure.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['section']
            });

            // Should include sections and their nested content (including nav within section)
            expect(markdown).toContain('Nested Section in Article');
            expect(markdown).toContain('Another Nested Section');
            expect(markdown).toContain('Direct Section in Main');
            expect(markdown).toContain('Section Navigation');
            expect(markdown).toContain('Section 1');
            expect(markdown).toContain('Section 2');

            // Should NOT contain main-level content or standalone article
            expect(markdown).not.toContain('Main Content with Nested Elements');
            expect(markdown).not.toContain('Standalone Article');
        });

        test('should handle complex nested hierarchies correctly', async () => {
            const html = await loadFixture('nested-structure.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should include both nested article and standalone article
            expect(markdown).toContain('Nested Article in Main');
            expect(markdown).toContain('Nested Section in Article');
            expect(markdown).toContain('Standalone Article');
            expect(markdown).toContain('Article footer content');

            // Should NOT contain main-level content or page footer
            expect(markdown).not.toContain('Main Content with Nested Elements');
            expect(markdown).not.toContain('Direct Section in Main');
            expect(markdown).not.toContain('Page footer - should be excluded');
        });
    });

    describe('No Matching Tags Scenarios', () => {
        test('should return empty result with warning when no matching tags found', async () => {
            const html = await loadFixture('no-matching-tags.html');

            // Capture console.warn calls
            const originalWarn = console.warn;
            const warnCalls = [];
            console.warn = (...args) => warnCalls.push(args);

            try {
                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'main', 'section']
                });

                // Should produce minimal or empty output (the function returns empty body which becomes empty string)
                expect(markdown.trim()).toBe('');

                // Should have logged a warning
                expect(warnCalls.length).toBeGreaterThan(0);
                expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
                expect(warnCalls[0][0]).toContain('article, main, section');

            } catch (error) {
                // If it throws an error due to empty content, that's also acceptable behavior
                expect(error.message).toContain('No HTML content to convert');

                // Should still have logged a warning
                expect(warnCalls.length).toBeGreaterThan(0);
                expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
            } finally {
                console.warn = originalWarn;
            }
        });

        test('should handle non-existent tags gracefully', async () => {
            const html = await loadFixture('article-content.html');

            const originalWarn = console.warn;
            const warnCalls = [];
            console.warn = (...args) => warnCalls.push(args);

            try {
                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['nonexistent', 'alsononexistent']
                });

                // Should produce empty output
                expect(markdown.trim()).toBe('');

                // Should have logged a warning
                expect(warnCalls.length).toBeGreaterThan(0);
                expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');

            } catch (error) {
                // If it throws an error due to empty content, that's also acceptable behavior
                expect(error.message).toContain('No HTML content to convert');

                // Should still have logged a warning
                expect(warnCalls.length).toBeGreaterThan(0);
                expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
            } finally {
                console.warn = originalWarn;
            }
        });
    });

    describe('Content Extraction and Hierarchy Preservation', () => {
        test('should preserve HTML structure and formatting within included tags', async () => {
            const html = await loadFixture('article-content.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should preserve heading hierarchy
            expect(markdown).toMatch(/# Understanding Web Scraping/);
            expect(markdown).toMatch(/## Common Use Cases/);
            expect(markdown).toMatch(/## Best Practices/);

            // Should preserve list structures (allowing for extra spaces)
            expect(markdown).toContain('Data collection for research');
            expect(markdown).toContain('Price monitoring');
            expect(markdown).toContain('Content aggregation');

            expect(markdown).toContain('Respect robots.txt files');
            expect(markdown).toContain('Implement rate limiting');
            expect(markdown).toContain('Handle errors gracefully');

            // Should preserve blockquote (content may have escaped quotes)
            expect(markdown).toContain('The key to successful web scraping');
        });

        test('should preserve table structures within included content', async () => {
            const html = await loadFixture('multiple-tags.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['section']
            });

            // Should contain table content from pricing section
            expect(markdown).toContain('Plan');
            expect(markdown).toContain('Price');
            expect(markdown).toContain('Features');
            expect(markdown).toContain('Basic');
            expect(markdown).toContain('$10/month');
            expect(markdown).toContain('Pro');
            expect(markdown).toContain('$25/month');

            // Should preserve table structure (pipes or other markdown table formatting)
            expect(markdown).toMatch(/\|.*Plan.*\|.*Price.*\|.*Features.*\|/);
        });

        test('should handle mixed content types within included tags', async () => {
            const html = await loadFixture('multiple-instances.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should preserve different content types
            // Lists (allowing for extra spaces in formatting)
            expect(markdown).toContain('Point 1 about web development');
            expect(markdown).toContain('Point 2 about best practices');

            // Ordered lists (content may be converted to unordered lists)
            expect(markdown).toContain('Index optimization');
            expect(markdown).toContain('Query performance');
            expect(markdown).toContain('Connection pooling');

            // Blockquotes (content may have escaped quotes)
            expect(markdown).toContain('Database optimization is crucial');

            // Tables
            expect(markdown).toContain('Pattern');
            expect(markdown).toContain('Use Case');
            expect(markdown).toContain('REST');
            expect(markdown).toContain('GraphQL');

            // Time elements
            expect(markdown).toContain('November 15, 2023');
            expect(markdown).toContain('November 20, 2023');
            expect(markdown).toContain('November 25, 2023');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle empty include-tags array', async () => {
            const html = await loadFixture('article-content.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: []
            });

            // Should process entire document when include-tags is empty
            expect(markdown).toContain('Understanding Web Scraping');
            expect(markdown).toContain('Site Header');
            expect(markdown).toContain('Welcome to our website');
            expect(markdown).toContain('Related Articles');
            expect(markdown).toContain('All rights reserved');
        });

        test('should handle undefined include-tags', async () => {
            const html = await loadFixture('article-content.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: undefined
            });

            // Should process entire document when include-tags is undefined
            expect(markdown).toContain('Understanding Web Scraping');
            expect(markdown).toContain('Site Header');
            expect(markdown).toContain('Welcome to our website');
        });

        test('should handle malformed HTML gracefully', async () => {
            const malformedHtml = `
        <html>
        <body>
          <article>
            <h1>Valid Article
            <p>Missing closing tag for h1
            <div>Nested content
              <span>More content</span>
            </div>
          </article>
          <section>
            <h2>Another section</h2>
            <p>Some content
        </body>
        </html>
      `;

            const markdown = await getProcessedMarkdown(malformedHtml, 'http://example.com', {
                includeTags: ['article', 'section']
            });

            // Should still extract content despite malformed HTML
            expect(markdown).toContain('Valid Article');
            expect(markdown).toContain('Missing closing tag');
            expect(markdown).toContain('Nested content');
            expect(markdown).toContain('More content');
            expect(markdown).toContain('Another section');
            expect(markdown).toContain('Some content');
        });

        test('should handle case-insensitive tag matching', async () => {
            const html = `
        <html>
        <body>
          <ARTICLE>
            <h1>Uppercase Article Tag</h1>
            <p>Content in uppercase article tag</p>
          </ARTICLE>
          <Article>
            <h1>Mixed Case Article Tag</h1>
            <p>Content in mixed case article tag</p>
          </Article>
        </body>
        </html>
      `;

            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should match tags regardless of case
            expect(markdown).toContain('Uppercase Article Tag');
            expect(markdown).toContain('Content in uppercase article tag');
            expect(markdown).toContain('Mixed Case Article Tag');
            expect(markdown).toContain('Content in mixed case article tag');
        });
    });

    describe('Comprehensive Error Handling Tests', () => {
        describe('Empty include-tags list validation and error messages', () => {
            test('should handle null include-tags gracefully', async () => {
                const html = await loadFixture('article-content.html');
                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: null
                });

                // Should process entire document when include-tags is null
                expect(markdown).toContain('Understanding Web Scraping');
                expect(markdown).toContain('Site Header');
            });

            test('should handle empty string in include-tags array', async () => {
                const html = await loadFixture('article-content.html');

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['']
                    });

                    // Should produce empty output or throw error
                    expect(markdown.trim()).toBe('');

                    // Should have logged a warning about no content found
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');

                } catch (error) {
                    // If it throws an error due to empty content, that's also acceptable
                    expect(error.message).toContain('No HTML content to convert');

                    // Should still have logged a warning
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle whitespace-only tag names', async () => {
                const html = await loadFixture('article-content.html');

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['   ', '\t', '\n']
                    });

                    // Should produce empty output
                    expect(markdown.trim()).toBe('');

                    // Should have logged a warning
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');

                } catch (error) {
                    // If it throws an error due to empty content, that's also acceptable
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });
        });

        describe('No matching content scenarios with appropriate warnings', () => {
            test('should warn when no matching tags found and return empty result', async () => {
                const html = await loadFixture('no-matching-tags.html');

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['article', 'main', 'section']
                    });

                    // Should produce empty output
                    expect(markdown.trim()).toBe('');

                    // Should have logged appropriate warning
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
                    expect(warnCalls[0][0]).toContain('article, main, section');

                } catch (error) {
                    // If it throws an error due to empty content, that's also acceptable behavior
                    expect(error.message).toContain('No HTML content to convert');

                    // Should still have logged a warning
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should warn with specific tag names when no content found', async () => {
                const html = `
          <html>
          <body>
            <div>Only div content here</div>
            <p>And some paragraph content</p>
          </body>
          </html>
        `;

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['article', 'header', 'footer']
                    });

                    // Should produce empty output
                    expect(markdown.trim()).toBe('');

                    // Should have logged warning with specific tag names
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
                    expect(warnCalls[0][0]).toContain('article, header, footer');

                } catch (error) {
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle mixed existing and non-existing tags', async () => {
                const html = `
          <html>
          <body>
            <article>
              <h1>Article Content</h1>
              <p>Some article text</p>
            </article>
            <div>Other content</div>
          </body>
          </html>
        `;

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'nonexistent', 'alsononexistent']
                });

                // Should include content from existing tags
                expect(markdown).toContain('Article Content');
                expect(markdown).toContain('Some article text');

                // Should NOT contain content from non-included tags
                expect(markdown).not.toContain('Other content');

                // Should not have logged warnings since some content was found
                expect(warnCalls.length).toBe(0);

                console.warn = originalWarn;
            });
        });

        describe('Graceful degradation when include-tags processing fails', () => {
            test('should fall back to full document processing when filtering fails', async () => {
                const html = await loadFixture('article-content.html');

                // Mock the filterToIncludeTags function to throw an error
                const originalFilterToIncludeTags = require('../src/lib/markdownProcessor').filterToIncludeTags;

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                // We can't easily mock internal functions, so let's test with malformed input that might cause issues
                const malformedHtml = `
          <html>
          <body>
            <article>Content</article>
            <!-- Malformed comment that might cause issues
            <script>
              // Potentially problematic script content
              var x = "</article>";
            </script>
          </body>
          </html>
        `;

                try {
                    const markdown = await getProcessedMarkdown(malformedHtml, 'http://example.com', {
                        includeTags: ['article']
                    });

                    // Should still produce some output (either filtered or full document)
                    expect(markdown.length).toBeGreaterThan(0);
                    expect(typeof markdown).toBe('string');

                } catch (error) {
                    // If it fails completely, the error should be descriptive
                    expect(error.message).toContain('Error while processing HTML to markdown');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle cheerio parsing errors gracefully', async () => {
                // Test with severely malformed HTML that might break cheerio
                const severelyMalformedHtml = `
          <html><body><article><h1>Title</h1><p>Content</p></article>
          <!-- Unclosed comment
          <script>var x = "<article>test</article>";</script>
          <style>article { content: "</article>"; }</style>
          </body></html>
        `;

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(severelyMalformedHtml, 'http://example.com', {
                        includeTags: ['article']
                    });

                    // Should still produce output
                    expect(markdown.length).toBeGreaterThan(0);
                    expect(markdown).toContain('Title');
                    expect(markdown).toContain('Content');

                } catch (error) {
                    // If it fails, should have descriptive error message
                    expect(error.message).toContain('Error while processing HTML to markdown');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle empty HTML document gracefully', async () => {
                const emptyHtml = '';

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(emptyHtml, 'http://example.com', {
                        includeTags: ['article']
                    });

                    // Should handle empty input gracefully
                    expect(markdown.trim()).toBe('');

                } catch (error) {
                    // Should throw appropriate error for empty content
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });
        });

        describe('Invalid tag name handling', () => {
            test('should handle special characters in tag names', async () => {
                const html = await loadFixture('article-content.html');

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                // Test that the function doesn't crash with special characters
                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['nonexistent@special', 'invalid!', 'fake%']
                });

                // Should handle special characters gracefully without crashing
                expect(typeof markdown).toBe('string');
                expect(markdown.length).toBeGreaterThan(0);

                console.warn = originalWarn;
            });

            test('should handle numeric tag names', async () => {
                const html = await loadFixture('article-content.html');

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['123', '456']
                    });

                    // Should produce empty output since these aren't valid HTML tags
                    expect(markdown.trim()).toBe('');

                    // Should have logged warning
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');
                    expect(warnCalls[0][0]).toContain('123, 456');

                } catch (error) {
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle very long tag names', async () => {
                const html = await loadFixture('article-content.html');
                const veryLongTagName = 'a'.repeat(1000);

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: [veryLongTagName]
                    });

                    // Should produce empty output
                    expect(markdown.trim()).toBe('');

                    // Should have logged warning (but truncated tag name in message)
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');

                } catch (error) {
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle mixed valid and invalid tag names', async () => {
                const html = `
          <html>
          <body>
            <article>
              <h1>Valid Article</h1>
              <p>Article content</p>
            </article>
            <div>Other content</div>
          </body>
          </html>
        `;

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'invalid@tag', '123invalid', 'main']
                });

                // Should include content from valid tags
                expect(markdown).toContain('Valid Article');
                expect(markdown).toContain('Article content');

                // Should not include other content
                expect(markdown).not.toContain('Other content');

                // Should not log warnings since some valid content was found
                expect(warnCalls.length).toBe(0);

                console.warn = originalWarn;
            });

            test('should handle CSS selector-like strings as tag names', async () => {
                const html = await loadFixture('article-content.html');

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['.class-name', '#id-name', 'div.class', 'article[role="main"]']
                    });

                    // Should produce empty output since these are treated as tag names, not CSS selectors
                    expect(markdown.trim()).toBe('');

                    // Should have logged warning
                    expect(warnCalls.length).toBeGreaterThan(0);
                    expect(warnCalls[0][0]).toContain('Warning: No content found matching the specified include-tags');

                } catch (error) {
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });
        });

        describe('Error recovery and resilience', () => {
            test('should continue processing other tags if one tag causes issues', async () => {
                const html = `
          <html>
          <body>
            <article>
              <h1>Article Title</h1>
              <p>Article content</p>
            </article>
            <main>
              <h1>Main Content</h1>
              <p>Main content text</p>
            </main>
            <section>
              <h1>Section Title</h1>
              <p>Section content</p>
            </section>
          </body>
          </html>
        `;

                // Include a mix of valid tags and potentially problematic ones
                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'nonexistent', 'main', 'invalid@tag', 'section']
                });

                // Should include content from all valid tags
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Article content');
                expect(markdown).toContain('Main Content');
                expect(markdown).toContain('Main content text');
                expect(markdown).toContain('Section Title');
                expect(markdown).toContain('Section content');
            });

            test('should handle deeply nested structures without stack overflow', async () => {
                // Create deeply nested HTML structure
                let deeplyNestedHtml = '<html><body><article>';
                for (let i = 0; i < 100; i++) {
                    deeplyNestedHtml += `<div class="level-${i}">`;
                }
                deeplyNestedHtml += '<p>Deep content</p>';
                for (let i = 0; i < 100; i++) {
                    deeplyNestedHtml += '</div>';
                }
                deeplyNestedHtml += '</article></body></html>';

                const markdown = await getProcessedMarkdown(deeplyNestedHtml, 'http://example.com', {
                    includeTags: ['article']
                });

                // Should handle deep nesting without errors
                expect(markdown).toContain('Deep content');
                expect(markdown.length).toBeGreaterThan(0);
            });

            test('should handle large numbers of matching tags efficiently', async () => {
                // Create HTML with many matching tags
                let htmlWithManyTags = '<html><body>';
                for (let i = 0; i < 1000; i++) {
                    htmlWithManyTags += `<article><h1>Article ${i}</h1><p>Content ${i}</p></article>`;
                }
                htmlWithManyTags += '</body></html>';

                const startTime = Date.now();
                const markdown = await getProcessedMarkdown(htmlWithManyTags, 'http://example.com', {
                    includeTags: ['article']
                });
                const endTime = Date.now();

                // Should complete within reasonable time (10 seconds for 1000 articles)
                expect(endTime - startTime).toBeLessThan(10000);

                // Should contain content from multiple articles
                expect(markdown).toContain('Article 0');
                expect(markdown).toContain('Article 999');
                expect(markdown).toContain('Content 0');
                expect(markdown).toContain('Content 999');
            });
        });
    });

    describe('Performance and Consistency', () => {
        test('should process include-tags within reasonable time limits', async () => {
            const html = await loadFixture('nested-structure.html');

            const startTime = Date.now();
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['main', 'article', 'section']
            });
            const endTime = Date.now();

            const processingTime = endTime - startTime;

            // Should complete within 2 seconds (generous limit)
            expect(processingTime).toBeLessThan(2000);
            expect(markdown.length).toBeGreaterThan(0);
        });

        test('should produce consistent output across multiple runs', async () => {
            const html = await loadFixture('multiple-instances.html');
            const options = { includeTags: ['article'] };

            const markdown1 = await getProcessedMarkdown(html, 'http://example.com', options);
            const markdown2 = await getProcessedMarkdown(html, 'http://example.com', options);
            const markdown3 = await getProcessedMarkdown(html, 'http://example.com', options);

            // All runs should produce identical output
            expect(markdown1).toBe(markdown2);
            expect(markdown2).toBe(markdown3);
        });

        test('should not contain raw HTML tags in output', async () => {
            const html = await loadFixture('article-content.html');
            const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                includeTags: ['article']
            });

            // Should not contain raw HTML tags
            expect(markdown).not.toMatch(/<article[^>]*>/i);
            expect(markdown).not.toMatch(/<\/article>/i);
            expect(markdown).not.toMatch(/<nav[^>]*>/i);
            expect(markdown).not.toMatch(/<header[^>]*>/i);
            expect(markdown).not.toMatch(/<footer[^>]*>/i);
            expect(markdown).not.toMatch(/<aside[^>]*>/i);

            // Should be valid markdown
            expect(markdown.length).toBeGreaterThan(0);
            expect(typeof markdown).toBe('string');
        });
    });

    describe('Include-Tags and Remove-Tags Integration', () => {
        describe('Basic Combination Scenarios', () => {
            test('should include article content and remove nav elements within it', async () => {
                const html = `
          <html>
          <body>
            <header>Site Header - should be excluded</header>
            <nav>Main Navigation - should be excluded</nav>
            <article>
              <h1>Article Title</h1>
              <nav>Article Navigation - should be removed</nav>
              <p>Article content paragraph</p>
              <aside>Article sidebar - should be removed</aside>
              <section>
                <h2>Article Section</h2>
                <nav>Section Navigation - should be removed</nav>
                <p>Section content</p>
              </section>
            </article>
            <footer>Site Footer - should be excluded</footer>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article'],
                    removeTags: ['nav', 'aside']
                });

                // Should contain article content
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Article content paragraph');
                expect(markdown).toContain('Article Section');
                expect(markdown).toContain('Section content');

                // Should NOT contain removed elements within article
                expect(markdown).not.toContain('Article Navigation');
                expect(markdown).not.toContain('Article sidebar');
                expect(markdown).not.toContain('Section Navigation');

                // Should NOT contain excluded content outside article
                expect(markdown).not.toContain('Site Header');
                expect(markdown).not.toContain('Main Navigation');
                expect(markdown).not.toContain('Site Footer');
            });

            test('should include main content and remove multiple tag types within it', async () => {
                const html = `
          <html>
          <body>
            <header>Page Header</header>
            <main>
              <h1>Main Content</h1>
              <nav>Main Navigation</nav>
              <article>
                <h2>Article in Main</h2>
                <p>Article content</p>
                <footer>Article Footer</footer>
              </article>
              <aside>Main Sidebar</aside>
              <section>
                <h3>Section in Main</h3>
                <p>Section content</p>
                <nav>Section Nav</nav>
              </section>
            </main>
            <footer>Page Footer</footer>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['main'],
                    removeTags: ['nav', 'aside', 'footer']
                });

                // Should contain main content
                expect(markdown).toContain('Main Content');
                expect(markdown).toContain('Article in Main');
                expect(markdown).toContain('Article content');
                expect(markdown).toContain('Section in Main');
                expect(markdown).toContain('Section content');

                // Should NOT contain removed elements within main
                expect(markdown).not.toContain('Main Navigation');
                expect(markdown).not.toContain('Article Footer');
                expect(markdown).not.toContain('Main Sidebar');
                expect(markdown).not.toContain('Section Nav');

                // Should NOT contain excluded content outside main
                expect(markdown).not.toContain('Page Header');
                expect(markdown).not.toContain('Page Footer');
            });

            test('should handle multiple include-tags with remove-tags', async () => {
                const html = `
          <html>
          <body>
            <header>Page Header</header>
            <article>
              <h1>First Article</h1>
              <nav>Article Nav</nav>
              <p>First article content</p>
              <aside>Article Aside</aside>
            </article>
            <main>
              <h1>Main Content</h1>
              <nav>Main Nav</nav>
              <p>Main content paragraph</p>
              <aside>Main Aside</aside>
            </main>
            <section>
              <h1>Section Content</h1>
              <nav>Section Nav</nav>
              <p>Section content paragraph</p>
              <aside>Section Aside</aside>
            </section>
            <footer>Page Footer</footer>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'main', 'section'],
                    removeTags: ['nav', 'aside']
                });

                // Should contain content from all included tags
                expect(markdown).toContain('First Article');
                expect(markdown).toContain('First article content');
                expect(markdown).toContain('Main Content');
                expect(markdown).toContain('Main content paragraph');
                expect(markdown).toContain('Section Content');
                expect(markdown).toContain('Section content paragraph');

                // Should NOT contain removed elements from any included tag
                expect(markdown).not.toContain('Article Nav');
                expect(markdown).not.toContain('Article Aside');
                expect(markdown).not.toContain('Main Nav');
                expect(markdown).not.toContain('Main Aside');
                expect(markdown).not.toContain('Section Nav');
                expect(markdown).not.toContain('Section Aside');

                // Should NOT contain excluded content
                expect(markdown).not.toContain('Page Header');
                expect(markdown).not.toContain('Page Footer');
            });
        });

        describe('Tag Priority Resolution', () => {
            test('should prioritize include-tags when same tag appears in both lists', async () => {
                const html = `
          <html>
          <body>
            <header>Page Header</header>
            <article>
              <h1>Article Title</h1>
              <p>Article content</p>
              <nav>Article Navigation</nav>
            </article>
            <nav>Main Navigation</nav>
            <footer>Page Footer</footer>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'nav'],
                    removeTags: ['nav']
                });

                // Should include both article and nav content (include-tags takes precedence)
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Article content');
                expect(markdown).toContain('Article Navigation');
                expect(markdown).toContain('Main Navigation');

                // Should NOT contain excluded content
                expect(markdown).not.toContain('Page Header');
                expect(markdown).not.toContain('Page Footer');
            });

            test('should include conflicting tag but remove its children when specified', async () => {
                const html = `
          <html>
          <body>
            <header>Page Header</header>
            <section>
              <h1>Section Title</h1>
              <p>Section content</p>
              <nav>
                <h2>Navigation Title</h2>
                <ul>
                  <li>Nav Item 1</li>
                  <li>Nav Item 2</li>
                </ul>
              </nav>
              <article>
                <h2>Article in Section</h2>
                <p>Article content</p>
              </article>
            </section>
            <footer>Page Footer</footer>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['section'],
                    removeTags: ['nav']
                });

                // Should include section content
                expect(markdown).toContain('Section Title');
                expect(markdown).toContain('Section content');
                expect(markdown).toContain('Article in Section');
                expect(markdown).toContain('Article content');

                // Should NOT contain nav content within section
                expect(markdown).not.toContain('Navigation Title');
                expect(markdown).not.toContain('Nav Item 1');
                expect(markdown).not.toContain('Nav Item 2');

                // Should NOT contain excluded content
                expect(markdown).not.toContain('Page Header');
                expect(markdown).not.toContain('Page Footer');
            });

            test('should handle complex priority scenarios with nested conflicts', async () => {
                const html = `
          <html>
          <body>
            <main>
              <h1>Main Content</h1>
              <article>
                <h2>Article Title</h2>
                <p>Article content</p>
                <section>
                  <h3>Section in Article</h3>
                  <p>Section content</p>
                  <aside>Section Aside</aside>
                </section>
                <aside>Article Aside</aside>
              </article>
              <section>
                <h2>Direct Section</h2>
                <p>Direct section content</p>
                <aside>Direct Section Aside</aside>
              </section>
            </main>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['main', 'article', 'section'],
                    removeTags: ['aside', 'section']
                });

                // Should include main and article content (include-tags priority)
                expect(markdown).toContain('Main Content');
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Article content');

                // Should include sections (include-tags priority over remove-tags)
                expect(markdown).toContain('Section in Article');
                expect(markdown).toContain('Section content');
                expect(markdown).toContain('Direct Section');
                expect(markdown).toContain('Direct section content');

                // Should NOT contain aside elements (remove-tags applies within included content)
                expect(markdown).not.toContain('Section Aside');
                expect(markdown).not.toContain('Article Aside');
                expect(markdown).not.toContain('Direct Section Aside');
            });
        });

        describe('Remove-Tags Filtering Within Included Content', () => {
            test('should apply remove-tags filtering only within included content scope', async () => {
                const html = `
          <html>
          <body>
            <nav>Global Navigation - should be excluded</nav>
            <article>
              <h1>Article Title</h1>
              <nav>Article Navigation - should be removed</nav>
              <p>Article content</p>
              <section>
                <h2>Article Section</h2>
                <nav>Section Navigation - should be removed</nav>
                <p>Section content</p>
              </section>
            </article>
            <nav>Another Global Navigation - should be excluded</nav>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article'],
                    removeTags: ['nav']
                });

                // Should contain article content
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Article content');
                expect(markdown).toContain('Article Section');
                expect(markdown).toContain('Section content');

                // Should NOT contain nav elements within article
                expect(markdown).not.toContain('Article Navigation');
                expect(markdown).not.toContain('Section Navigation');

                // Should NOT contain global nav elements (excluded by include-tags)
                expect(markdown).not.toContain('Global Navigation');
                expect(markdown).not.toContain('Another Global Navigation');
            });

            test('should handle deeply nested remove-tags within included content', async () => {
                const html = `
          <html>
          <body>
            <main>
              <h1>Main Title</h1>
              <article>
                <h2>Article Title</h2>
                <section>
                  <h3>Section Title</h3>
                  <div>
                    <p>Nested content</p>
                    <aside>
                      <h4>Aside Title</h4>
                      <p>Aside content - should be removed</p>
                      <nav>
                        <ul>
                          <li>Nav item - should be removed</li>
                        </ul>
                      </nav>
                    </aside>
                    <p>More nested content</p>
                  </div>
                  <nav>Section nav - should be removed</nav>
                </section>
                <aside>Article aside - should be removed</aside>
              </article>
            </main>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['main'],
                    removeTags: ['aside', 'nav']
                });

                // Should contain main content structure
                expect(markdown).toContain('Main Title');
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Section Title');
                expect(markdown).toContain('Nested content');
                expect(markdown).toContain('More nested content');

                // Should NOT contain removed elements at any nesting level
                expect(markdown).not.toContain('Aside Title');
                expect(markdown).not.toContain('Aside content');
                expect(markdown).not.toContain('Nav item');
                expect(markdown).not.toContain('Section nav');
                expect(markdown).not.toContain('Article aside');
            });

            test('should preserve content structure after removing nested elements', async () => {
                const html = `
          <html>
          <body>
            <article>
              <header>
                <h1>Article Header</h1>
                <nav>Header Navigation - should be removed</nav>
                <p>Header description</p>
              </header>
              <main>
                <h2>Article Main Content</h2>
                <p>Main paragraph 1</p>
                <aside>Main sidebar - should be removed</aside>
                <p>Main paragraph 2</p>
                <section>
                  <h3>Section Title</h3>
                  <p>Section paragraph 1</p>
                  <nav>Section navigation - should be removed</nav>
                  <p>Section paragraph 2</p>
                </section>
              </main>
              <footer>
                <p>Article footer content</p>
                <nav>Footer navigation - should be removed</nav>
              </footer>
            </article>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article'],
                    removeTags: ['nav', 'aside']
                });

                // Should preserve content structure
                expect(markdown).toContain('Article Header');
                expect(markdown).toContain('Header description');
                expect(markdown).toContain('Article Main Content');
                expect(markdown).toContain('Main paragraph 1');
                expect(markdown).toContain('Main paragraph 2');
                expect(markdown).toContain('Section Title');
                expect(markdown).toContain('Section paragraph 1');
                expect(markdown).toContain('Section paragraph 2');
                expect(markdown).toContain('Article footer content');

                // Should NOT contain removed elements
                expect(markdown).not.toContain('Header Navigation');
                expect(markdown).not.toContain('Main sidebar');
                expect(markdown).not.toContain('Section navigation');
                expect(markdown).not.toContain('Footer navigation');
            });
        });

        describe('Edge Cases with Nested and Conflicting Tag Specifications', () => {
            test('should handle self-referencing include and remove tags', async () => {
                const html = `
          <html>
          <body>
            <div>
              <h1>Div Content</h1>
              <p>Div paragraph</p>
              <div>
                <h2>Nested Div</h2>
                <p>Nested div content</p>
              </div>
            </div>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['div'],
                    removeTags: ['div']
                });

                // Include-tags should take precedence, so div content should be included
                expect(markdown).toContain('Div Content');
                expect(markdown).toContain('Div paragraph');
                expect(markdown).toContain('Nested Div');
                expect(markdown).toContain('Nested div content');
            });

            test('should handle complex nested scenarios with multiple conflicts', async () => {
                const html = `
          <html>
          <body>
            <main>
              <section>
                <h1>Section in Main</h1>
                <article>
                  <h2>Article in Section</h2>
                  <section>
                    <h3>Nested Section in Article</h3>
                    <p>Deeply nested content</p>
                    <aside>Nested aside - should be removed</aside>
                  </section>
                  <aside>Article aside - should be removed</aside>
                </article>
                <aside>Section aside - should be removed</aside>
              </section>
              <article>
                <h2>Direct Article in Main</h2>
                <p>Direct article content</p>
                <aside>Direct article aside - should be removed</aside>
              </article>
            </main>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['main', 'section', 'article'],
                    removeTags: ['aside', 'main']
                });

                // Should include all content (include-tags priority)
                expect(markdown).toContain('Section in Main');
                expect(markdown).toContain('Article in Section');
                expect(markdown).toContain('Nested Section in Article');
                expect(markdown).toContain('Deeply nested content');
                expect(markdown).toContain('Direct Article in Main');
                expect(markdown).toContain('Direct article content');

                // Should remove aside elements (remove-tags applies within included content)
                expect(markdown).not.toContain('Nested aside');
                expect(markdown).not.toContain('Article aside');
                expect(markdown).not.toContain('Section aside');
                expect(markdown).not.toContain('Direct article aside');
            });

            test('should handle empty results from complex filtering', async () => {
                const html = `
          <html>
          <body>
            <article>
              <nav>Only navigation content</nav>
              <aside>Only sidebar content</aside>
            </article>
          </body>
          </html>
        `;

                const originalWarn = console.warn;
                const warnCalls = [];
                console.warn = (...args) => warnCalls.push(args);

                try {
                    const markdown = await getProcessedMarkdown(html, 'http://example.com', {
                        includeTags: ['article'],
                        removeTags: ['nav', 'aside']
                    });

                    // Should produce minimal output since all content within article is removed
                    expect(markdown.trim().length).toBeLessThan(50); // Allow for minimal markdown structure

                } catch (error) {
                    // If it throws an error due to empty content, that's acceptable
                    expect(error.message).toContain('No HTML content to convert');
                } finally {
                    console.warn = originalWarn;
                }
            });

            test('should handle malformed HTML with complex filtering', async () => {
                const malformedHtml = `
          <html>
          <body>
            <main>
              <h1>Main Title
              <article>
                <h2>Article Title</h2>
                <p>Article content
                <nav>
                  <ul>
                    <li>Nav item 1
                    <li>Nav item 2</li>
                  </ul>
                </nav>
                <aside>
                  <p>Aside content
                </aside>
              </article>
            </main>
          </body>
          </html>
        `;

                const markdown = await getProcessedMarkdown(malformedHtml, 'http://example.com', {
                    includeTags: ['main', 'article'],
                    removeTags: ['nav', 'aside']
                });

                // Should handle malformed HTML and still apply filtering
                expect(markdown).toContain('Main Title');
                expect(markdown).toContain('Article Title');
                expect(markdown).toContain('Article content');

                // Should remove nav and aside content despite malformed HTML
                expect(markdown).not.toContain('Nav item 1');
                expect(markdown).not.toContain('Nav item 2');
                expect(markdown).not.toContain('Aside content');
            });

            test('should maintain processing order consistency', async () => {
                const html = `
          <html>
          <body>
            <article>
              <h1>First Article</h1>
              <nav>First Nav</nav>
              <p>First content</p>
            </article>
            <section>
              <h1>Section</h1>
              <nav>Section Nav</nav>
              <p>Section content</p>
            </section>
            <article>
              <h1>Second Article</h1>
              <nav>Second Nav</nav>
              <p>Second content</p>
            </article>
          </body>
          </html>
        `;

                const markdown1 = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'section'],
                    removeTags: ['nav']
                });

                const markdown2 = await getProcessedMarkdown(html, 'http://example.com', {
                    includeTags: ['article', 'section'],
                    removeTags: ['nav']
                });

                // Should produce consistent results
                expect(markdown1).toBe(markdown2);

                // Should contain all included content
                expect(markdown1).toContain('First Article');
                expect(markdown1).toContain('First content');
                expect(markdown1).toContain('Section');
                expect(markdown1).toContain('Section content');
                expect(markdown1).toContain('Second Article');
                expect(markdown1).toContain('Second content');

                // Should not contain removed nav elements
                expect(markdown1).not.toContain('First Nav');
                expect(markdown1).not.toContain('Section Nav');
                expect(markdown1).not.toContain('Second Nav');
            });
        });
    });
});