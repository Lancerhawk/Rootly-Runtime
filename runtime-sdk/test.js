import { init } from '@rootly/runtime';

// Initialize Rootly
init({
    apiKey: process.env.ROOTLY_API_KEY || 'test-key-12345',
    environment: 'production',
});

console.log('✅ Rootly runtime initialized');
console.log('📝 Commit SHA:', process.env.VERCEL_GIT_COMMIT_SHA || 'not set');

// Simulate normal operation
console.log('\n🚀 App running normally...\n');

// Test 1: Throw uncaught exception after 2 seconds
setTimeout(() => {
    console.log('⚠️  Triggering uncaught exception...\n');
    throw new Error('Test uncaught exception from runtime SDK!');
}, 2000);

// Test 2: Unhandled promise rejection
setTimeout(() => {
    console.log('⚠️  Triggering unhandled rejection...\n');
    Promise.reject(new Error('Test unhandled rejection!'));
}, 1000);
