const http = require('http');

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`[${method}] ${path} - Status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          console.error(`Error body: ${body}`);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  try {
    console.log('--- Starting Smoke Tests ---');
    await testEndpoint('/api/health');
    await testEndpoint('/api/generate-questions', 'POST', { mode: 'beginner' });
    await testEndpoint('/api/generate-questions', 'POST', { mode: 'oscp' });
    console.log('--- Smoke Tests Passed ---');
    process.exit(0);
  } catch (error) {
    console.error('--- Smoke Tests Failed ---');
    console.error(error);
    process.exit(1);
  }
}

runTests();
