const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

exports.execute = async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }

    const jobId = uuidv4();
    const tempDir = path.join(__dirname, '../temp');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    try {
        if (language === 'javascript') {
            // For JS, we can use node directly
            const filePath = path.join(tempDir, `${jobId}.js`);
            fs.writeFileSync(filePath, code);

            exec(`node ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
                fs.unlinkSync(filePath); // Cleanup
                if (error) {
                    return res.json({ output: stderr || error.message, error: true });
                }
                res.json({ output: stdout });
            });
        } else if (language === 'python') {
            const filePath = path.join(tempDir, `${jobId}.py`);
            fs.writeFileSync(filePath, code);

            exec(`python3 ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
                fs.unlinkSync(filePath); // Cleanup
                if (error) {
                    return res.json({ output: stderr || error.message, error: true });
                }
                res.json({ output: stdout });
            });
        } else {
            res.status(400).json({ error: 'Language not supported' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Execution failed' });
    }
};
