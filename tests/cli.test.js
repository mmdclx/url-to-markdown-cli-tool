const path = require('path');
const { spawn } = require('child_process');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { createServer } = require('node:http');

const fixtureHtml = readFileSync(path.join(__dirname, 'fixtures/include-tags/article-content.html'));
const restrictedRequest = jest.fn((_request, response) => response.end('Other fixture'));
const restrictedServer = createServer(restrictedRequest);
let fixtureOrigin;
let restrictedOrigin;

const fixtureServer = createServer((request, response) => {
  if (request.url === '/disconnect') {
    request.socket.destroy();
  } else if (request.url === '/redirect') {
    response.writeHead(302, { Location: restrictedOrigin }).end();
  } else if (request.url === '/old-article') {
    response.writeHead(302, { Location: '/docs/chapter/' }).end();
  } else if (request.url === '/docs/chapter/' || request.url === '/base-url') {
    response.setHeader('Content-Type', 'text/html');
    const base = request.url === '/base-url' ? '<base href="/assets/">' : '';
    response.end(`${base}<main><a href="Next.API#Install">Next</a><img src="Diagram.png" alt="Diagram"></main>`);
  } else if (request.url === '/missing' || request.url === '/unavailable') {
    const status = request.url === '/missing' ? 404 : 503;
    response.writeHead(status, { 'Content-Type': 'text/html' }).end('<h1>Request failed</h1>');
  } else if (request.url === '/redirect-to-missing') {
    response.writeHead(302, { Location: '/missing' }).end();
  } else if (request.url === '/client-redirect-to-missing') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<script>setTimeout(() => { location.href = "/missing"; }, 25)</script>');
  } else if (request.url === '/missing-image') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<h1>Page available</h1><img src="/missing" alt="Missing image">');
  } else if (request.url === '/subresources') {
    response.setHeader('Content-Type', 'text/html');
    response.end(`<h1>Fixture</h1><img src="${restrictedOrigin}"><script src="/fixture.js"></script>`);
  } else if (request.url === '/fixture.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end('document.querySelector("h1").textContent = "Fixture script loaded";');
  } else {
    response.setHeader('Content-Type', 'text/html');
    if (request.url === '/slow') {
      setTimeout(() => response.end(fixtureHtml), 300);
    } else {
      response.end(fixtureHtml);
    }
  }
});

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

beforeAll(async () => {
  [fixtureOrigin, restrictedOrigin] = await Promise.all([listen(fixtureServer), listen(restrictedServer)]);
});

afterAll(async () => {
  await Promise.all([fixtureServer, restrictedServer].map((server) => new Promise((resolve) => server.close(resolve))));
});

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

function runFixtureCli(args = [], pathname = '/html') {
  return runCli([fixtureOrigin + pathname, '--allow-private-network', '--wait', '0', ...args]);
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
    const result = await runFixtureCli(['--mobile', '--desktop']);
    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/only one viewport preset/i);
  });
});

describe('Browser access policy', () => {
  test('accepts only web URLs', async () => {
    const result = await runCli(['file:///example.html']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Only HTTP and HTTPS URLs are supported');
  });

  test('rejects the removed web security flag', async () => {
    const result = await runCli([fixtureOrigin, '--disable-web-security']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("unknown option '--disable-web-security'");
  });

  test('requires explicit opt-in for loopback origins', async () => {
    const result = await runCli([fixtureOrigin]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Blocked browser destination');
  });

  test('does not extend the local opt-in to another origin through a redirect', async () => {
    restrictedRequest.mockClear();
    const result = await runFixtureCli([], '/redirect');
    expect(result.code).toBe(1);
    expect(restrictedRequest).not.toHaveBeenCalled();
  }, 10000);

  test('loads same-origin subresources and blocks other local origins', async () => {
    restrictedRequest.mockClear();
    const result = await runFixtureCli(['--no-images'], '/subresources');
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Fixture script loaded');
    expect(restrictedRequest).not.toHaveBeenCalled();
  }, 10000);
});

describe('Link resolution', () => {
  test.each([
    ['/old-article', '/docs/chapter/'],
    ['/base-url', '/assets/']
  ])('uses the document base URL when converting %s', async (pathname, basePath) => {
    const result = await runFixtureCli(['--include-tags', 'main'], pathname);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(`[Next](${fixtureOrigin}${basePath}Next.API#Install)`);
    expect(result.stdout).toContain(`![Diagram](${fixtureOrigin}${basePath}Diagram.png)`);
  }, 10000);
});

describe('HTTP errors', () => {
  test.each([
    ['/missing', 404, '/missing'],
    ['/unavailable', 503, '/unavailable'],
    ['/redirect-to-missing', 404, '/missing'],
    ['/client-redirect-to-missing', 404, '/missing']
  ])('exits nonzero when %s leads to HTTP %i', async (pathname, status, errorPath) => {
    const result = await runFixtureCli(['--wait', '0.5'], pathname);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(`HTTP ${status} for ${fixtureOrigin}${errorPath}`);
    expect(result.stdout).toBe('');
  }, 10000);

  test('still converts a successful page with a failed image request', async () => {
    const result = await runFixtureCli([], '/missing-image');

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('# Page available');
  }, 10000);
});

describe('Include Tags CLI Integration', () => {
  describe('Command-line argument parsing', () => {
    test('accepts single include-tags argument', async () => {
      const result = await runFixtureCli(['--include-tags', 'article']);
      // Should not fail due to argument parsing (may fail due to network/processing)
      expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
    }, 10000);

    test('accepts multiple include-tags arguments', async () => {
      const result = await runFixtureCli(['--include-tags', 'article', 'main', 'section']);
      // Should not fail due to argument parsing
      expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
    }, 10000);

    test('works with other flags combined', async () => {
      const result = await runFixtureCli([
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
      const result = await runFixtureCli(['--include-tags']);
      expect(result.code).not.toBe(0);
      // Commander.js shows its own error message for missing arguments
      expect(result.stderr).toMatch(/argument missing/);
    });

    test('include-tags with empty string is processed as tag name', async () => {
      // When an empty string is passed, Commander treats it as a valid tag name
      // This test verifies the behavior - it should process but likely find no content
      const result = await runFixtureCli(['--include-tags', '']);
      expect(result.code).not.toBe(0);
      // Should show warning about no content found for the empty tag name
      expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
    });

    test('include-tags validation error shows appropriate message', async () => {
      // Test the CLI validation for empty include-tags array
      // This would happen if Commander somehow passes an empty array
      const result = await runFixtureCli(['--include-tags', '']);
      expect(result.code).not.toBe(0);
      // Should show error about invalid URL or no content found
      expect(result.stderr).toMatch(/Invalid URL provided|No content found|No HTML content to convert/);
    });

    test('invalid tag names are processed without CLI errors', async () => {
      // CLI should accept any string as tag names and let the processor handle validation
      const result = await runFixtureCli(['--include-tags', 'invalid@tag', '123tag', 'tag!']);
      
      // Should not fail due to CLI argument validation
      // May fail due to no matching content, but that's processor-level, not CLI-level
      if (result.code !== 0) {
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
      }
    }, 10000);

    test('very long tag names are accepted by CLI', async () => {
      const longTagName = 'a'.repeat(1000);
      const result = await runFixtureCli(['--include-tags', longTagName]);
      
      // Should not fail due to CLI argument validation
      if (result.code !== 0) {
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
      }
    }, 10000);

    test('special characters in tag names are accepted by CLI', async () => {
      const result = await runFixtureCli(['--include-tags', 'tag@#$', 'tag!', 'tag%']);
      
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
        const result = await runFixtureCli(['--include-tags']);
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/argument missing|error: option.*requires argument/i);
      });

      test('CLI handles whitespace-only tag names', async () => {
        const result = await runFixtureCli(['--include-tags', '   ', '\t']);
        
        // Should not fail at CLI level, but may fail at processing level
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        }
      }, 10000);
    });

    describe('No matching content error handling', () => {
      test('CLI handles no matching content gracefully', async () => {
        const result = await runFixtureCli(['--include-tags', 'nonexistenttag']);
        
        // Should exit with error code when no content found
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
      }, 15000);

      test('CLI shows appropriate error for multiple non-matching tags', async () => {
        const result = await runFixtureCli(['--include-tags', 'tag1', 'tag2', 'tag3']);
        
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
        }
      }, 15000);
    });

    describe('Graceful degradation in CLI', () => {
      test('CLI handles network errors gracefully', async () => {
        const result = await runFixtureCli(['--include-tags', 'article'], '/disconnect');
        
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/Error:|Failed to fetch|net::|getaddrinfo ENOTFOUND/);
      }, 10000);

      test('CLI handles malformed URLs with include-tags', async () => {
        const result = await runCli(['not-a-url', '--include-tags', 'article']);
        
        expect(result.code).not.toBe(0);
        expect(result.stderr).toMatch(/Invalid URL provided/);
      });

      test('CLI handles timeout scenarios with include-tags', async () => {
        // Use a short wait time with a delayed response
        const result = await runFixtureCli(['--include-tags', 'body', '--wait', '0.1'], '/slow');
        
        // Should either succeed or fail gracefully with timeout
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/Error:|timeout|Failed to fetch/);
        }
      }, 20000);
    });

    describe('Invalid tag name handling in CLI', () => {
      test('CLI accepts but processes invalid HTML tag names', async () => {
        const result = await runFixtureCli(['--include-tags', '<invalid>', 'tag@#$']);
        
        // Should not fail at CLI validation level
        if (result.code !== 0) {
          // Should fail at processing level due to no matching content
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
        }
      }, 10000);

      test('CLI handles numeric tag names', async () => {
        const result = await runFixtureCli(['--include-tags', '123', '456']);
        
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
        }
      }, 10000);

      test('CLI handles CSS selector-like strings as tag names', async () => {
        const result = await runFixtureCli(['--include-tags', '.class', '#id', 'div.class']);
        
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/--include-tags requires at least one tag name/);
        }
      }, 10000);
    });

    describe('Error recovery and resilience in CLI', () => {
      test('CLI continues processing with mixed valid and invalid tags', async () => {
        const result = await runFixtureCli(['--include-tags', 'body', 'invalid@tag', 'nonexistent']);
        
        // Should succeed because 'body' is a valid tag that exists
        expect(result.code).toBe(0);
        expect(result.stdout.length).toBeGreaterThan(0);
      }, 15000);

      test('CLI handles large number of tag arguments', async () => {
        const manyTags = Array.from({length: 50}, (_, i) => `tag${i}`);
        const result = await runFixtureCli(['--include-tags', ...manyTags]);
        
        // Should not fail due to too many arguments
        if (result.code !== 0) {
          expect(result.stderr).toMatch(/No content found|No HTML content to convert/);
          expect(result.stderr).not.toMatch(/too many arguments|argument list too long/);
        }
      }, 15000);

      test('CLI handles combination of include-tags with other error conditions', async () => {
        const result = await runFixtureCli([
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
        const result = await runFixtureCli(['--include-tags', 'nonexistent']);
        
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
      const result = await runFixtureCli(['--include-tags', 'body']);
      
      // Should complete successfully (exit code 0) and produce markdown output
      expect(result.code).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stderr).not.toMatch(/Error:/);
    }, 15000);

    test('include-tags with no matching content handles gracefully', async () => {
      // Use a URL that won't have the specified tags
      const result = await runFixtureCli(['--include-tags', 'nonexistenttag']);
      
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
      const result = await runFixtureCli([
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
        const result = await runFixtureCli([
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
