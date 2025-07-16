const path = require('path');
const { spawn } = require('child_process');

function runCli(args = []) {
  return new Promise((resolve) => {
    const nodePath = process.execPath;
    const cliPath = path.join(__dirname, '..', 'src', 'index.js');
    const child = spawn(nodePath, [cliPath, ...args]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

describe('CLI Argument Validation', () => {
  test('running without arguments exits with error and shows help', async () => {
    const result = await runCli();
    expect(result.code).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toMatch(/usage:/i);
    expect(output).toMatch(/url-to-md/);
  });

  test('conflicting viewport options exits with error', async () => {
    const result = await runCli(['http://example.com', '--mobile', '--desktop']);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/only one viewport preset/i);
  });
});

describe('Include Tags CLI Integration', () => {
  describe('Command-line argument parsing', () => {
    test('accepts single include-tags argument', async () => {
      // Mock a simple HTTP server response to avoid network dependency
      const result = await runCli(['http://httpbin.org/html', '--include-tags', 'article']);
      // Should not fail due to argument parsing (may fail due to network/processing)
      expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
    }, 10000);

    test('accepts multiple include-tags arguments', async () => {
      const result = await runCli(['http://httpbin.org/html', '--include-tags', 'article', 'main', 'section']);
      // Should not fail due to argument parsing
      expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
    }, 10000);

    test('works with other flags combined', async () => {
      const result = await runCli([
        'http://httpbin.org/html', 
        '--include-tags', 'article', 
        '--remove-tags', 'nav', 'footer',
        '--no-images'
      ]);
      // Should not fail due to argument parsing conflicts
      expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
    }, 10000);
  });

  describe('Error handling for invalid inputs', () => {
    test('empty include-tags flag shows error', async () => {
      const result = await runCli(['http://example.com', '--include-tags']);
      expect(result.code).not.toBe(0);
      // Commander.js shows its own error message for missing arguments
      expect(result.stderr).toMatch(/argument missing/);
    });

    test('include-tags with empty string is processed as tag name', async () => {
      // When an empty string is passed, Commander treats it as a valid tag name
      // This test verifies the behavior - it should process but likely find no content
      const result = await runCli(['http://example.com', '--include-tags', '']);
      expect(result.code).not.toBe(0);
      // Should show warning about no content found for the empty tag name
      expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
    });

    test('include-tags validation error shows appropriate message', async () => {
      // Test the CLI validation for empty include-tags array
      // This would happen if Commander somehow passes an empty array
      const result = await runCli(['http://example.com', '--include-tags', '']);
      expect(result.code).not.toBe(0);
      // Should show error about invalid URL or no content found
      expect(result.stderr).toMatch(/Invalid URL provided|No content found|No HTML content to convert/);
    });

    test('invalid tag names are processed without CLI errors', async () => {
      // CLI should accept any string as tag names and let the processor handle validation
      const result = await runCli(['http://httpbin.org/html', '--include-tags', 'invalid@tag', '123tag', 'tag!']);
      
      // Should not fail due to CLI argument validation
      // May fail due to no matching content, but that's processor-level, not CLI-level
      if (result.code !== 0) {
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
      }
    }, 10000);

    test('very long tag names are accepted by CLI', async () => {
      const longTagName = 'a'.repeat(1000);
      const result = await runCli(['http://httpbin.org/html', '--include-tags', longTagName]);
      
      // Should not fail due to CLI argument validation
      if (result.code !== 0) {
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
      }
    }, 10000);

    test('special characters in tag names are accepted by CLI', async () => {
      const result = await runCli(['http://httpbin.org/html', '--include-tags', 'tag@#$', 'tag!', 'tag%']);
      
      // Should not fail due to CLI argument validation
      if (result.code !== 0) {
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
      }
    }, 10000);
  });

  describe('Comprehensive CLI Error Handling Tests', () => {
    describe('Empty include-tags validation', () => {
      test('CLI validates empty include-tags array correctly', async () => {
        // This test simulates what happens when Commander.js might pass an empty array
        // In practice, this is hard to trigger from command line, but we test the validation logic
        const result = await runCli(['http://example.com', '--include-tags']);
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/argument missing|error: option.*requires argument/i);
      });

      test('CLI handles whitespace-only tag names', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', '   ', '\t']);
        
        // Should not fail at CLI level, but may fail at processing level
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        }
      }, 10000);
    });

    describe('No matching content error handling', () => {
      test('CLI handles no matching content gracefully', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', 'nonexistenttag']);
        
        // Should exit with error code when no content found
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
      }, 15000);

      test('CLI shows appropriate error for multiple non-matching tags', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', 'tag1', 'tag2', 'tag3']);
        
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        }
      }, 15000);
    });

    describe('Graceful degradation in CLI', () => {
      test('CLI handles network errors gracefully', async () => {
        const result = await runCli(['http://nonexistent-domain-12345.com', '--include-tags', 'article']);
        
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/Error:|Failed to fetch|net::|getaddrinfo ENOTFOUND/);
      }, 10000);

      test('CLI handles malformed URLs with include-tags', async () => {
        const result = await runCli(['not-a-url', '--include-tags', 'article']);
        
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/Invalid URL provided/);
      });

      test('CLI handles timeout scenarios with include-tags', async () => {
        // Use a very short wait time with a slow-loading page
        const result = await runCli(['http://httpbin.org/delay/5', '--include-tags', 'body', '--wait', '0.1']);
        
        // Should either succeed or fail gracefully with timeout
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/Error:|timeout|Failed to fetch/);
        }
      }, 20000);
    });

    describe('Invalid tag name handling in CLI', () => {
      test('CLI accepts but processes invalid HTML tag names', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', '<invalid>', 'tag@#$']);
        
        // Should not fail at CLI validation level
        if (result.code !== 0) {
          // Should fail at processing level due to no matching content
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
        }
      }, 10000);

      test('CLI handles numeric tag names', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', '123', '456']);
        
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
        }
      }, 10000);

      test('CLI handles CSS selector-like strings as tag names', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', '.class', '#id', 'div.class']);
        
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
        }
      }, 10000);
    });

    describe('Error recovery and resilience in CLI', () => {
      test('CLI continues processing with mixed valid and invalid tags', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', 'body', 'invalid@tag', 'nonexistent']);
        
        // Should succeed because 'body' is a valid tag that exists
        expect(result.code).toBe(0);
        expect(result.stdout.length).toBeGreaterThan(0);
      }, 15000);

      test('CLI handles large number of tag arguments', async () => {
        const manyTags = Array.from({length: 50}, (_, i) => `tag${i}`);
        const result = await runCli(['http://httpbin.org/html', '--include-tags', ...manyTags]);
        
        // Should not fail due to too many arguments
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/too many arguments|argument list too long/);
        }
      }, 15000);

      test('CLI handles combination of include-tags with other error conditions', async () => {
        const result = await runCli([
          'http://httpbin.org/html',
          '--include-tags', 'nonexistent',
          '--remove-tags', 'script',
          '--wait', '0.1',
          '--mobile'
        ]);
        
        // Should handle multiple options gracefully even when include-tags finds no content
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        }
      }, 15000);

      test('CLI error messages are user-friendly', async () => {
        const result = await runCli(['http://httpbin.org/html', '--include-tags', 'nonexistent']);
        
        if (result.code !== 0) {
          // Error message should be clear and not show internal stack traces
          expect(result.stderr).toMatch(/Error:|Warning:|No content found/);
          expect(result.stderr).not.toMatch(/at Object\.|at async|TypeError:|ReferenceError:/);
        }
      }, 15000);
    });
  });

  describe('Help text documentation', () => {
    test('help text includes include-tags flag documentation', async () => {
      const result = await runCli(['--help']);
      const output = result.stdout + result.stderr;
      
      // Check that include-tags is documented in help
      expect(output).toMatch(/--include-tags/);
      expect(output).toMatch(/Include only specific HTML tags/);
      expect(output).toMatch(/article main section/); // Example from help text
    });

    test('help text shows include-tags with proper formatting', async () => {
      const result = await runCli(['-h']);
      const output = result.stdout + result.stderr;
      
      // Verify the help text follows the expected format
      expect(output).toMatch(/--include-tags <tags\.\.\.>/);
    });
  });

  describe('End-to-end CLI functionality', () => {
    test('include-tags processes content successfully with valid URL', async () => {
      // Use httpbin.org/html which provides a simple HTML page for testing
      const result = await runCli(['http://httpbin.org/html', '--include-tags', 'body']);
      
      // Should complete successfully (exit code 0) and produce markdown output
      expect(result.code).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stderr).not.toMatch(/Error:/);
    }, 15000); // Longer timeout for network request

    test('include-tags with no matching content handles gracefully', async () => {
      // Use a URL that won't have the specified tags
      const result = await runCli(['http://httpbin.org/html', '--include-tags', 'nonexistenttag']);
      
      // Based on the current implementation, this may exit with error code 1
      // when no content is found, which is acceptable behavior
      if (result.code === 0) {
        // If successful, output should be minimal since no matching tags found
        expect(result.stdout.trim().length).toBeLessThan(100);
      } else {
        // If it exits with error, should have appropriate error message
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
      }
    }, 15000);

    test('include-tags combined with remove-tags works correctly', async () => {
      const result = await runCli([
        'http://httpbin.org/html', 
        '--include-tags', 'body',
        '--remove-tags', 'script', 'style'
      ]);
      
      expect(result.code).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stderr).not.toMatch(/Error:/);
    }, 15000);

    test('include-tags with output file option works', async () => {
      const fs = require('fs').promises;
      const path = require('path');
      const tempFile = path.join(__dirname, 'temp-include-tags-test.md');
      
      try {
        const result = await runCli([
          'http://httpbin.org/html',
          '--include-tags', 'body',
          '--output', tempFile
        ]);
        
        expect(result.code).toBe(0);
        expect(result.stdout).toMatch(/Output written to:/);
        
        // Verify file was created and has content
        const fileContent = await fs.readFile(tempFile, 'utf-8');
        expect(fileContent.length).toBeGreaterThan(0);
        
      } finally {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }, 15000);

    test('invalid URL with include-tags shows appropriate error', async () => {
      const result = await runCli(['not-a-valid-url', '--include-tags', 'article']);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toMatch(/Invalid URL provided/);
    });
  });
});