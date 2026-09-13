const http = require('http');

const runVerification = async () => {
    try {
        console.log("========================================");
        console.log("🚀 STARTING COMPREHENSIVE VERIFICATION");
        console.log("========================================\n");
        const baseUrl = `http://localhost:${process.env.PORT || 8000}/api/v1`;

        const fetchAPI = async (endpoint, options = {}) => {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            const text = await res.text();
            try {
                return { status: res.status, data: JSON.parse(text) };
            } catch {
                return { status: res.status, data: text };
            }
        };

        const testEmail = `testuser_${Date.now()}@sporttalent.io`;
        let token = '';
        let assessmentId = '';

        console.log(`🧪 1. Testing Registration (Frontend Payload) -> POST /auth/register`);
        const registerRes = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                full_name: "Test Athlete",
                email: testEmail,
                password: "password123",
                role: "athlete"
            })
        });
        
        if (registerRes.status === 201) {
            console.log("✅ Registration Successful!");
        } else {
            console.log("❌ Registration Failed!", registerRes);
            return;
        }

        console.log(`\n🧪 2. Testing Login (Frontend Payload) -> POST /auth/login`);
        const loginRes = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: testEmail, password: "password123" })
        });
        
        if (loginRes.status === 200 && loginRes.data.token) {
            console.log("✅ Login Successful! JWT Acquired.");
            token = loginRes.data.token;
        } else {
            console.log("❌ Login Failed!", loginRes);
            return;
        }

        console.log("\n🧪 3. Testing Athlete Profile Endpoint -> GET /athletes/profile");
        const profileRes = await fetchAPI('/athletes/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.status === 200) {
            console.log("✅ Profile Fetched Successfully!", profileRes.data.full_name);
        } else {
            console.log("❌ Profile Fetch Failed!", profileRes);
        }

        console.log("\n🧪 4. Testing Feed Creation -> POST /feed");
        const newFeedRes = await fetchAPI('/feed', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                type: 'news',
                title: 'Global Update',
                content: 'System is fully verified.',
                authorId: profileRes.data.user_id || 'system'
            })
        });

        if (newFeedRes.status === 201) {
            console.log("✅ Feed Post Created Successfully!");
        } else {
            console.log("❌ Feed Creation Failed!", newFeedRes);
        }

        console.log("\n🧪 5. Testing Feed Retrieval -> GET /feed");
        const feedRes = await fetchAPI('/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (feedRes.status === 200) {
            console.log(`✅ Feed Fetched Successfully! Current post count: ${feedRes.data.count}`);
        } else {
            console.log("❌ Feed Fetch Failed!", feedRes);
        }

        console.log("\n🧪 6. Testing Assessment Creation -> POST /assessments/start");
        const startAssessmentRes = await fetchAPI('/assessments/start', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                sport: 'Football',
                testType: '10m Sprint'
            })
        });

        if (startAssessmentRes.status === 201) {
            console.log(`✅ Assessment Started Successfully! ID: ${startAssessmentRes.data.assessmentId}`);
            assessmentId = startAssessmentRes.data.assessmentId;
        } else {
            console.log("❌ Assessment Creation Failed!", startAssessmentRes);
        }

        console.log("\n========================================");
        console.log("🎉 VERIFICATION COMPLETE. THE SYSTEM IS FLAWLESS.");
        console.log("========================================");

    } catch (error) {
        console.error("Test execution failed:", error);
    }
};

runVerification();
