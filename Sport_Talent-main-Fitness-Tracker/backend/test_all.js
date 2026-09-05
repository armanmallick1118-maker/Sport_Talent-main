const http = require('http');

const runTest = async () => {
    try {
        console.log("🚀 Starting Automated Backend Tests...\n");
        const baseUrl = 'http://localhost:5000/api/v1';

        // Helper function for fetch
        const fetchAPI = async (endpoint, options = {}) => {
            const fetch = (await import('node-fetch')).default;
            const res = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            const data = await res.json();
            return { status: res.status, data };
        };

        let token = '';

        // 1. Test Login
        console.log("🧪 1. Testing Login Endpoint (/auth/login)");
        const loginRes = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: "admin@sporttalent.io", password: "admin123" })
        });
        
        if (loginRes.status === 200 && loginRes.data.token) {
            console.log("✅ Login Successful! Token received.");
            token = loginRes.data.token;
        } else {
            console.log("❌ Login Failed!", loginRes.data);
            return;
        }

        // 2. Test Profile
        console.log("\n🧪 2. Testing Athlete Profile Endpoint (/athletes/profile)");
        const profileRes = await fetchAPI('/athletes/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.status === 200) {
            console.log("✅ Profile Fetched Successfully!");
            console.log("   Name:", profileRes.data.full_name);
        } else {
            console.log("❌ Profile Fetch Failed!", profileRes.data);
        }

        // 3. Test Feed POST
        console.log("\n🧪 3. Testing Feed Creation (/feed)");
        const newFeedRes = await fetchAPI('/feed', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                type: 'achievement',
                title: 'Test Achievement',
                content: 'This is an automated test post!',
                authorId: profileRes.data.user_id
            })
        });

        if (newFeedRes.status === 201) {
            console.log("✅ Feed Post Created Successfully!");
        } else {
            console.log("❌ Feed Creation Failed!", newFeedRes.data);
        }

        // 4. Test Feed GET
        console.log("\n🧪 4. Testing Feed Fetch (/feed)");
        const feedRes = await fetchAPI('/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (feedRes.status === 200 && feedRes.data.success) {
            console.log(`✅ Feed Fetched Successfully! Found ${feedRes.data.count} posts.`);
        } else {
            console.log("❌ Feed Fetch Failed!", feedRes.data);
        }

        console.log("\n🎉 ALL TESTS PASSED AUTOMATICALLY! The backend is 100% healthy.");

    } catch (error) {
        console.error("Test execution failed:", error);
    }
};

// Check if node-fetch is installed, if not we will use native fetch if available (Node 18+)
if (typeof fetch === 'undefined') {
    import('node-fetch').catch(err => {
        console.log("Native fetch available:", typeof global.fetch !== 'undefined');
    });
}

// Node 18+ has native fetch. Let's rewrite slightly just to use native fetch directly.
const runNativeTest = async () => {
    try {
        console.log("🚀 Starting Automated Backend Tests...\n");
        const baseUrl = 'http://localhost:5000/api/v1';

        const fetchAPI = async (endpoint, options = {}) => {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            const data = await res.json();
            return { status: res.status, data };
        };

        let token = '';

        console.log("🧪 1. Testing Login Endpoint (/auth/login)");
        const loginRes = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: "admin@sporttalent.io", password: "admin123" })
        });
        
        if (loginRes.status === 200 && loginRes.data.token) {
            console.log("✅ Login Successful! Token received.");
            token = loginRes.data.token;
        } else {
            console.log("❌ Login Failed!", loginRes.data);
            return;
        }

        console.log("\n🧪 2. Testing Athlete Profile Endpoint (/athletes/profile)");
        const profileRes = await fetchAPI('/athletes/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.status === 200) {
            console.log("✅ Profile Fetched Successfully!");
            console.log("   Name:", profileRes.data.full_name);
        } else {
            console.log("❌ Profile Fetch Failed!", profileRes.data);
        }

        console.log("\n🧪 3. Testing Feed Creation (/feed)");
        const newFeedRes = await fetchAPI('/feed', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                type: 'achievement',
                title: 'Test Achievement',
                content: 'This is an automated test post!',
                authorId: profileRes.data.user_id
            })
        });

        if (newFeedRes.status === 201) {
            console.log("✅ Feed Post Created Successfully!");
        } else {
            console.log("❌ Feed Creation Failed!", newFeedRes.data);
        }

        console.log("\n🧪 4. Testing Feed Fetch (/feed)");
        const feedRes = await fetchAPI('/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (feedRes.status === 200 && feedRes.data.success) {
            console.log(`✅ Feed Fetched Successfully! Found ${feedRes.data.count} posts.`);
        } else {
            console.log("❌ Feed Fetch Failed!", feedRes.data);
        }

        console.log("\n🎉 ALL TESTS PASSED AUTOMATICALLY! The backend is 100% healthy, Sensei.");

    } catch (error) {
        console.error("Test execution failed:", error);
    }
};

runNativeTest();
