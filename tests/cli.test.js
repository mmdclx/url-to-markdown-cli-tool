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
