const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const sample = 'embedded-sample-2026.html';
const mainHtml = fs.readFileSync(path.join(root, sample));
const bradHtml = process.argv[2] ? fs.readFileSync(path.resolve(process.argv[2], sample)) : null;

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
fs.writeFileSync(path.join(output, sample), mainHtml);
fs.writeFileSync(path.join(output, 'index.html'), mainHtml);

if (bradHtml !== null) {
	const bradOutput = path.join(output, 'brad-mode');
	fs.mkdirSync(bradOutput);
	fs.writeFileSync(path.join(bradOutput, sample), bradHtml);
	fs.writeFileSync(path.join(bradOutput, 'index.html'), `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="refresh" content="0;url=./${sample}?fun=brad">
	<title>Brad Mode</title>
</head>
<body><a href="./${sample}?fun=brad">Open Brad mode</a></body>
</html>
`);
}