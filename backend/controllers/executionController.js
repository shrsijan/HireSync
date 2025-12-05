const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const execPromise = util.promisify(exec);

exports.execute = async (req, res) => {
    const { code, language, testCases } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    // Focus on Python for now
    if (language !== 'python') {
        return res.status(400).json({ error: 'Only Python is currently supported' });
    }

    const jobId = uuidv4();
    const tempDir = path.join(__dirname, '../temp');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `${jobId}.py`);

    try {
        // Write the user's code to a file
        fs.writeFileSync(filePath, code);

        // First, check for syntax errors by compiling
        try {
            await execPromise(`python3 -m py_compile ${filePath}`, { timeout: 5000 });
        } catch (compileError) {
            fs.unlinkSync(filePath);
            return res.json({
                output: compileError.stderr || compileError.message,
                error: true,
                type: 'compilation_error'
            });
        }

        // If test cases are provided, run them
        if (testCases && Array.isArray(testCases) && testCases.length > 0) {
            const testResults = await runTestCases(filePath, testCases);
            fs.unlinkSync(filePath);
            return res.json(testResults);
        }

        // Otherwise, just execute the code
        exec(`python3 ${filePath}`, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            fs.unlinkSync(filePath);
            if (error) {
                return res.json({
                    output: stderr || error.message,
                    error: true,
                    type: 'runtime_error'
                });
            }
            res.json({
                output: stdout || "(No output)",
                error: false
            });
        });
    } catch (err) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error('Execution error:', err);
        res.status(500).json({ error: 'Execution failed', details: err.message });
    }
};

async function runTestCases(filePath, testCases) {
    return new Promise((resolve) => {
        const testRunnerCode = `
import sys
import json
import io
from contextlib import redirect_stdout, redirect_stderr

# Read user's code
with open('${filePath}', 'r') as f:
    user_code = f.read()

# Execute user's code in a namespace
namespace = {}
try:
    exec(user_code, namespace)
except Exception as e:
    print(json.dumps({
        'error': True,
        'error_type': 'code_execution_error',
        'error_message': str(e),
        'results': []
    }))
    sys.exit(0)

# Test cases
test_cases = ${JSON.stringify(testCases)}

results = []
passed_count = 0

for i, test in enumerate(test_cases):
    test_num = i + 1
    try:
        # Capture stdout/stderr
        f = io.StringIO()
        error_f = io.StringIO()
        
        with redirect_stdout(f), redirect_stderr(error_f):
            # Execute the test input
            test_type = test.get('type', 'function_call')
            if test_type == 'function_call':
                # For function calls like "twoSum([2,7,11,15], 9)"
                result = eval(test['input'], namespace)
                output = f.getvalue().strip()
                error_output = error_f.getvalue().strip()
                
                # Compare result with expected
                expected = test['expected']
                
                # Convert result to string representation for comparison
                # Handle lists/arrays specially
                if isinstance(result, list):
                    actual = str(result).replace(' ', '')
                else:
                    actual = str(result)
                
                # Normalize expected (remove spaces for list comparisons)
                expected_str = str(expected).replace(' ', '')
                
                # Handle different comparison types
                comparison = test.get('comparison', 'default')
                if comparison == 'exact':
                    passed = actual == expected_str
                elif comparison == 'contains':
                    passed = expected_str in actual
                else:
                    # Try to compare as values (for numbers) or exact match (for lists/strings)
                    try:
                        # If both are numeric, compare as numbers
                        if isinstance(result, (int, float)) and ('.' in expected_str or '.' in actual):
                            passed = float(actual) == float(expected_str)
                        elif isinstance(result, list):
                            # For lists, compare string representations
                            passed = actual == expected_str
                        else:
                            # String comparison
                            passed = actual == expected_str
                    except:
                        passed = actual == expected_str
                
                results.append({
                    'test': test_num,
                    'input': test['input'],
                    'expected': str(expected),
                    'actual': actual,
                    'output': output,
                    'error': error_output,
                    'passed': passed
                })
                
                if passed:
                    passed_count += 1
            else:
                # For statement execution (like print statements)
                exec(test['input'], namespace)
                output = f.getvalue().strip()
                error_output = error_f.getvalue().strip()
                
                expected = test['expected']
                actual = output
                
                comparison = test.get('comparison', 'default')
                passed = actual == str(expected) or (comparison == 'contains' and str(expected) in actual)
                
                results.append({
                    'test': test_num,
                    'input': test['input'],
                    'expected': str(expected),
                    'actual': actual,
                    'output': output,
                    'error': error_output,
                    'passed': passed
                })
                
                if passed:
                    passed_count += 1
                    
    except Exception as e:
        results.append({
            'test': test_num,
            'input': test.input,
            'expected': str(test.expected),
            'actual': f'Error: {str(e)}',
            'output': '',
            'error': str(e),
            'passed': False
        })

print(json.dumps({
    'error': False,
    'results': results,
    'passed': passed_count,
    'total': len(test_cases),
    'output': 'Test execution completed'
}))
`;

        const testRunnerPath = filePath.replace('.py', '_test.py');
        fs.writeFileSync(testRunnerPath, testRunnerCode);

        exec(`python3 ${testRunnerPath}`, { timeout: 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            // Cleanup
            if (fs.existsSync(testRunnerPath)) {
                fs.unlinkSync(testRunnerPath);
            }

            if (error) {
                return resolve({
                    error: true,
                    output: stderr || error.message,
                    type: 'test_execution_error',
                    results: [],
                    passed: 0,
                    total: testCases.length
                });
            }

            try {
                // Parse JSON output from Python - look for JSON in stdout
                // The JSON might be on its own line or embedded
                let jsonStr = stdout.trim();
                
                // Try to find JSON object in the output
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
                
                // If the JSON is double-encoded (string containing JSON), parse it
                let testData;
                try {
                    testData = JSON.parse(jsonStr);
                    // If output is a JSON string, parse it again
                    if (typeof testData.output === 'string' && testData.output.startsWith('{')) {
                        try {
                            testData = JSON.parse(testData.output);
                        } catch (e) {
                            // Keep original testData
                        }
                    }
                } catch (e) {
                    // Try parsing the output field if it exists
                    if (jsonStr.includes('"output"')) {
                        const outputMatch = jsonStr.match(/"output":\s*"([^"]+)"/);
                        if (outputMatch && outputMatch[1]) {
                            try {
                                testData = JSON.parse(outputMatch[1]);
                            } catch (e2) {
                                // Fall through
                            }
                        }
                    }
                }
                
                if (testData && testData.results) {
                    resolve({
                        error: testData.error || false,
                        output: testData.output || 'Test execution completed',
                        results: testData.results || [],
                        passed: testData.passed || 0,
                        total: testData.total || testCases.length,
                        type: 'test_results'
                    });
                } else {
                    resolve({
                        error: false,
                        output: stdout || 'Test execution completed',
                        results: [],
                        passed: 0,
                        total: testCases.length,
                        type: 'test_results'
                    });
                }
            } catch (parseError) {
                console.error('Parse error:', parseError, 'stdout:', stdout);
                resolve({
                    error: false,
                    output: stdout || stderr || 'Failed to parse test results',
                    results: [],
                    passed: 0,
                    total: testCases.length,
                    type: 'test_results'
                });
            }
        });
    });
}
