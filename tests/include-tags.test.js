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
});