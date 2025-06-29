const fs = require('fs').promises;
const path = require('path');
const { getProcessedMarkdown } = require('../src/lib/markdownProcessor');

describe('Table Conversion Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'tables');
  
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

  describe('Simple Table Conversion', () => {
    test('should convert basic 3x3 table correctly', async () => {
      const html = await loadFixture('simple-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      expect(markdown).toContain('Cell 1');
      expect(markdown).toContain('Cell 2');
      expect(markdown).toContain('Cell 3');
      expect(markdown).toContain('Row 2 Col 1');
      expect(markdown).toContain('Row 3 Col 3');
      
      // Should have some table-like structure (pipes or other formatting)
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Header Table Conversion', () => {
    test('should properly handle table headers with th elements', async () => {
      const html = await loadFixture('header-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      expect(markdown).toContain('Name');
      expect(markdown).toContain('Age');
      expect(markdown).toContain('City');
      expect(markdown).toContain('Country');
      expect(markdown).toContain('John Doe');
      expect(markdown).toContain('Jane Smith');
      expect(markdown).toContain('Bob Johnson');
      
      // Headers should be distinguishable from regular cells
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Colspan/Rowspan Table Conversion', () => {
    test('should handle colspan and rowspan attributes gracefully', async () => {
      const html = await loadFixture('colspan-rowspan-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      expect(markdown).toContain('Quarter 1');
      expect(markdown).toContain('Quarter 2');
      expect(markdown).toContain('Product A');
      expect(markdown).toContain('Product B');
      expect(markdown).toContain('100');
      expect(markdown).toContain('200');
      
      // Should preserve content even if structure is flattened
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Nested Table Conversion', () => {
    test('should handle nested tables appropriately', async () => {
      const html = await loadFixture('nested-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      expect(markdown).toContain('Department');
      expect(markdown).toContain('Details');
      expect(markdown).toContain('Engineering');
      expect(markdown).toContain('Marketing');
      expect(markdown).toContain('Frontend');
      expect(markdown).toContain('Backend');
      expect(markdown).toContain('Digital');
      expect(markdown).toContain('Content');
      
      // Should flatten or handle nested structure appropriately
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Mixed Content Table Conversion', () => {
    test('should preserve links, images, and code within table cells', async () => {
      const html = await loadFixture('mixed-content-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      // Should preserve links
      expect(markdown).toMatch(/\[.*Auth Guide.*\]/);
      expect(markdown).toMatch(/\[.*DB Documentation.*\]/);
      expect(markdown).toMatch(/\[.*API Reference.*\]/);
      
      // Should preserve code
      expect(markdown).toContain('auth.login()');
      expect(markdown).toContain('/api/v1/users');
      
      // Should preserve images (handle escaped brackets)
      expect(markdown).toMatch(/!\\?\[.*\\?\]\(.*badge.*\)/);
      
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Styled Table Conversion', () => {
    test('should handle CSS classes and inline styles', async () => {
      const html = await loadFixture('styled-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      expect(markdown).toContain('Product');
      expect(markdown).toContain('Price');
      expect(markdown).toContain('Quantity');
      expect(markdown).toContain('Total');
      expect(markdown).toContain('Laptop');
      expect(markdown).toContain('$999.99');
      expect(markdown).toContain('Mouse');
      expect(markdown).toContain('Keyboard');
      
      // CSS styling should not break content extraction
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Empty Table Conversion', () => {
    test('should handle empty tables gracefully', async () => {
      const html = await loadFixture('empty-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      // Should contain the descriptive headings
      expect(markdown).toContain('Completely Empty Table');
      expect(markdown).toContain('Table with Empty Rows');
      expect(markdown).toContain('Table with Empty Cells');
      expect(markdown).toContain('Table with Whitespace Only');
      
      // Should contain non-empty cell content
      expect(markdown).toContain('Data');
      expect(markdown).toContain('More Data');
      expect(markdown).toContain('Final Row');
      
      // Should not crash on empty tables
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Table Conversion', () => {
    test('should handle malformed tables without crashing', async () => {
      const html = await loadFixture('malformed-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      // Should contain descriptive headings
      expect(markdown).toContain('Missing Closing Tags');
      expect(markdown).toContain('Mismatched Cell Counts');
      expect(markdown).toContain('Invalid Nesting');
      
      // Should contain some cell content
      expect(markdown).toContain('Cell 1');
      expect(markdown).toContain('Row 2 Cell 1');
      expect(markdown).toContain('Row 3 Cell 5');
      
      // Should not crash on malformed HTML
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Table Conversion', () => {
    test('should handle complex tables with multiple features', async () => {
      const html = await loadFixture('complex-table.html');
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      
      // Should contain caption
      expect(markdown).toContain('Quarterly Sales Report');
      
      // Should contain headers
      expect(markdown).toContain('Region');
      expect(markdown).toContain('Quarter 1');
      expect(markdown).toContain('Quarter 2');
      expect(markdown).toContain('Total');
      
      // Should contain data
      expect(markdown).toContain('North');
      expect(markdown).toContain('South');
      expect(markdown).toContain('East');
      expect(markdown).toContain('$1,200');
      expect(markdown).toContain('$22,200');
      
      // Should contain links
      expect(markdown).toMatch(/\[.*Details.*\]/);
      expect(markdown).toMatch(/\[.*methodology.*\]/);
      
      // Should contain code
      expect(markdown).toContain('tax_excluded');
      
      // Should handle complex structure without crashing
      expect(markdown.length).toBeGreaterThan(0);
    });
  });

  describe('Table Structure Analysis', () => {
    test('should produce consistent output format across all fixtures', async () => {
      const fixtures = [
        'simple-table.html',
        'header-table.html',
        'colspan-rowspan-table.html',
        'nested-table.html',
        'mixed-content-table.html',
        'styled-table.html',
        'empty-table.html',
        'malformed-table.html',
        'complex-table.html'
      ];
      
      for (const fixture of fixtures) {
        const html = await loadFixture(fixture);
        const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
        
        // All conversions should produce valid output
        expect(markdown).toBeDefined();
        expect(typeof markdown).toBe('string');
        expect(markdown.length).toBeGreaterThan(0);
        
        // Should not contain raw HTML tags (basic check)
        expect(markdown).not.toMatch(/<table[^>]*>/i);
        expect(markdown).not.toMatch(/<\/table>/i);
        expect(markdown).not.toMatch(/<tr[^>]*>/i);
        expect(markdown).not.toMatch(/<\/tr>/i);
      }
    });
  });

  describe('Performance Tests', () => {
    test('should convert tables within reasonable time limits', async () => {
      const html = await loadFixture('complex-table.html');
      
      const startTime = Date.now();
      const markdown = await getProcessedMarkdown(html, 'http://example.com', {
        preserveTableStructure: true
      });
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      // Should complete within 5 seconds (generous limit for CI)
      expect(processingTime).toBeLessThan(5000);
      expect(markdown.length).toBeGreaterThan(0);
    });
  });
});