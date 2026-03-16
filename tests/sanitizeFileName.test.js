const assert = require('assert');

/**
 * Extracted implementation from index.html:354
 */
function sanitizeFileName(name) {
    return name.split('.')[0].replace(/[\/\\?%*:|"<>.;,|\t]/g, '_').trim();
}

const testCases = [
    { input: "simpleName", expected: "simpleName", description: "Standard name" },
    { input: "file.txt", expected: "file", description: "Name with extension (should be truncated)" },
    { input: "file.name.txt", expected: "file", description: "Name with multiple dots (truncated at first dot)" },
    { input: "bad/name", expected: "bad_name", description: "Forbidden character: forward slash" },
    { input: "bad\\name", expected: "bad_name", description: "Forbidden character: backward slash" },
    { input: "bad?name", expected: "bad_name", description: "Forbidden character: question mark" },
    { input: "bad%name", expected: "bad_name", description: "Forbidden character: percentage" },
    { input: "bad*name", expected: "bad_name", description: "Forbidden character: asterisk" },
    { input: "bad:name", expected: "bad_name", description: "Forbidden character: colon" },
    { input: "bad|name", expected: "bad_name", description: "Forbidden character: pipe" },
    { input: 'bad"name', expected: "bad_name", description: "Forbidden character: double quote" },
    { input: "bad<name", expected: "bad_name", description: "Forbidden character: less than" },
    { input: "bad>name", expected: "bad_name", description: "Forbidden character: greater than" },
    { input: "bad;name", expected: "bad_name", description: "Forbidden character: semicolon" },
    { input: "bad,name", expected: "bad_name", description: "Forbidden character: comma" },
    { input: "bad\tname", expected: "bad_name", description: "Forbidden character: tab" },
    { input: "  trimMe  ", expected: "trimMe", description: "Whitespace trimming" },
    { input: "  complex.file/name?  ", expected: "complex", description: "Complex case: spaces, dots, and forbidden chars" },
    { input: "", expected: "", description: "Empty string" },
    { input: ".", expected: "", description: "Single dot" },
    { input: "..", expected: "", description: "Double dot (Path traversal attempt)" },
    { input: "/absolute/path", expected: "_absolute_path", description: "Absolute path attempt" },
    { input: "COM1", expected: "COM1", description: "Windows reserved name (not currently handled by sanitizeFileName)" }
];

console.log("🧪 Running tests for sanitizeFileName...");

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    try {
        const actual = sanitizeFileName(test.input);
        assert.strictEqual(actual, test.expected, test.description);
        console.log(`✅ Test ${index + 1} passed: ${test.description}`);
        passed++;
    } catch (err) {
        console.error(`❌ Test ${index + 1} failed: ${test.description}`);
        console.error(`   Input:    "${test.input}"`);
        console.error(`   Expected: "${test.expected}"`);
        console.error(`   Actual:   "${err.actual}"`);
        failed++;
    }
});

console.log("\n📊 Test Results:");
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log("✨ All tests passed successfully!");
}
