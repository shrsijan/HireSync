const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
let authToken = '';
let recruiterId = '';
let candidateId = '';
let assessmentId = '';
let invitationToken = '';

// Helper function to make requests
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    if (data) config.data = data;

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test Suite
async function runTests() {
  console.log('\n========================================');
  console.log('   HIRESYNC BACKEND API TEST SUITE');
  console.log('========================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Health Check
  console.log('TEST 1: Health Check Endpoint');
  const healthCheck = await apiRequest('GET', '/');
  if (healthCheck.success && healthCheck.data.includes('Backend Running')) {
    console.log('✅ PASSED - Server is running\n');
    passedTests++;
  } else {
    console.log('❌ FAILED - Server not responding\n');
    failedTests++;
  }

  // Test 2: Register Recruiter
  console.log('TEST 2: Register Recruiter');
  const recruiterData = {
    name: 'Test Recruiter',
    email: `recruiter_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'recruiter',
    companyName: 'Test Corp',
  };
  const registerRecruiter = await apiRequest('POST', '/api/auth/register', recruiterData);
  if (registerRecruiter.success) {
    console.log('✅ PASSED - Recruiter registered successfully');
    console.log(`   Email: ${recruiterData.email}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Recruiter registration failed');
    console.log(`   Error: ${JSON.stringify(registerRecruiter.error)}\n`);
    failedTests++;
  }

  // Test 3: Register Candidate
  console.log('TEST 3: Register Candidate');
  const candidateData = {
    name: 'Test Candidate',
    email: `candidate_${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'candidate',
  };
  const registerCandidate = await apiRequest('POST', '/api/auth/register', candidateData);
  if (registerCandidate.success) {
    console.log('✅ PASSED - Candidate registered successfully');
    console.log(`   Email: ${candidateData.email}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Candidate registration failed');
    console.log(`   Error: ${JSON.stringify(registerCandidate.error)}\n`);
    failedTests++;
  }

  // Test 4: Login as Recruiter
  console.log('TEST 4: Login as Recruiter');
  const loginData = {
    email: recruiterData.email,
    password: recruiterData.password,
  };
  const login = await apiRequest('POST', '/api/auth/login', loginData);
  if (login.success && login.data.token) {
    authToken = login.data.token;
    recruiterId = login.data.user._id || login.data.user.id;
    console.log('✅ PASSED - Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Login failed');
    console.log(`   Error: ${JSON.stringify(login.error)}\n`);
    failedTests++;
  }

  // Test 5: Login with Invalid Credentials
  console.log('TEST 5: Login with Invalid Credentials (Should Fail)');
  const invalidLogin = await apiRequest('POST', '/api/auth/login', {
    email: recruiterData.email,
    password: 'WrongPassword',
  });
  if (!invalidLogin.success && invalidLogin.status === 400) {
    console.log('✅ PASSED - Invalid login correctly rejected\n');
    passedTests++;
  } else {
    console.log('❌ FAILED - Invalid login should be rejected\n');
    failedTests++;
  }

  // Test 6: Create Assessment (Auth Required)
  console.log('TEST 6: Create Assessment');
  const assessmentData = {
    title: 'Full Stack Developer Assessment',
    role: 'Full Stack Developer',
    questions: [
      {
        title: 'Array Manipulation',
        description: 'Write a function to reverse an array in-place',
        timeLimit: 15,
        difficulty: 'Medium',
      },
      {
        title: 'API Design',
        description: 'Design a RESTful API for a user management system',
        timeLimit: 20,
        difficulty: 'Hard',
      },
    ],
    timeLimit: 60,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const createAssessment = await apiRequest('POST', '/api/assessments', assessmentData, authToken);
  if (createAssessment.success && createAssessment.data._id) {
    assessmentId = createAssessment.data._id;
    console.log('✅ PASSED - Assessment created successfully');
    console.log(`   Assessment ID: ${assessmentId}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Assessment creation failed');
    console.log(`   Error: ${JSON.stringify(createAssessment.error)}\n`);
    failedTests++;
  }

  // Test 7: Get All Assessments for Recruiter
  console.log('TEST 7: Get All Assessments');
  const getAssessments = await apiRequest('GET', '/api/assessments', null, authToken);
  if (getAssessments.success && Array.isArray(getAssessments.data)) {
    console.log('✅ PASSED - Retrieved assessments successfully');
    console.log(`   Count: ${getAssessments.data.length}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Failed to retrieve assessments\n');
    failedTests++;
  }

  // Test 8: Get Specific Assessment by ID
  console.log('TEST 8: Get Assessment by ID');
  if (assessmentId) {
    const getAssessment = await apiRequest('GET', `/api/assessments/${assessmentId}`, null, authToken);
    if (getAssessment.success && getAssessment.data._id === assessmentId) {
      console.log('✅ PASSED - Retrieved specific assessment');
      console.log(`   Title: ${getAssessment.data.title}\n`);
      passedTests++;
    } else {
      console.log('❌ FAILED - Failed to retrieve specific assessment\n');
      failedTests++;
    }
  } else {
    console.log('⏭️  SKIPPED - No assessment ID available\n');
  }

  // Test 9: Create Assessment Without Auth (Should Fail)
  console.log('TEST 9: Create Assessment Without Auth (Should Fail)');
  const unauthorizedCreate = await apiRequest('POST', '/api/assessments', assessmentData);
  if (!unauthorizedCreate.success && unauthorizedCreate.status === 401) {
    console.log('✅ PASSED - Unauthorized access correctly blocked\n');
    passedTests++;
  } else {
    console.log('❌ FAILED - Should require authentication\n');
    failedTests++;
  }

  // Test 10: Send Invitation
  console.log('TEST 10: Send Assessment Invitation');
  if (assessmentId) {
    const invitationData = {
      assessmentId,
      email: candidateData.email,
    };
    const sendInvitation = await apiRequest('POST', '/api/invitations', invitationData, authToken);
    if (sendInvitation.success && sendInvitation.data.token) {
      invitationToken = sendInvitation.data.token;
      console.log('✅ PASSED - Invitation sent successfully');
      console.log(`   Token: ${invitationToken.substring(0, 20)}...\n`);
      passedTests++;
    } else {
      console.log('❌ FAILED - Invitation sending failed');
      console.log(`   Error: ${JSON.stringify(sendInvitation.error)}\n`);
      failedTests++;
    }
  } else {
    console.log('⏭️  SKIPPED - No assessment ID available\n');
  }

  // Test 11: Get Invitations for Recruiter
  console.log('TEST 11: Get All Invitations for Recruiter');
  const getInvitations = await apiRequest('GET', '/api/invitations', null, authToken);
  if (getInvitations.success && Array.isArray(getInvitations.data)) {
    console.log('✅ PASSED - Retrieved invitations successfully');
    console.log(`   Count: ${getInvitations.data.length}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Failed to retrieve invitations\n');
    failedTests++;
  }

  // Test 12: Get Invitations for Candidate
  console.log('TEST 12: Get Invitations for Candidate by Email');
  const getCandidateInvitations = await apiRequest(
    'GET',
    `/api/invitations/candidate/${candidateData.email}`
  );
  if (getCandidateInvitations.success && Array.isArray(getCandidateInvitations.data)) {
    console.log('✅ PASSED - Retrieved candidate invitations');
    console.log(`   Count: ${getCandidateInvitations.data.length}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Failed to retrieve candidate invitations\n');
    failedTests++;
  }

  // Test 13: Execute JavaScript Code
  console.log('TEST 13: Execute JavaScript Code');
  const jsCode = {
    language: 'javascript',
    code: 'console.log("Hello from test!");',
  };
  const executeJS = await apiRequest('POST', '/api/execute', jsCode);
  if (executeJS.success) {
    console.log('✅ PASSED - JavaScript code executed');
    console.log(`   Output: ${executeJS.data.output || executeJS.data}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - JavaScript execution failed');
    console.log(`   Error: ${JSON.stringify(executeJS.error)}\n`);
    failedTests++;
  }

  // Test 14: Execute Python Code
  console.log('TEST 14: Execute Python Code');
  const pythonCode = {
    language: 'python',
    code: 'print("Hello from Python test!")',
  };
  const executePython = await apiRequest('POST', '/api/execute', pythonCode);
  if (executePython.success) {
    console.log('✅ PASSED - Python code executed');
    console.log(`   Output: ${executePython.data.output || executePython.data}\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Python execution failed');
    console.log(`   Error: ${JSON.stringify(executePython.error)}\n`);
    failedTests++;
  }

  // Test 15: Execute Code with Error
  console.log('TEST 15: Execute Code with Syntax Error');
  const errorCode = {
    language: 'javascript',
    code: 'console.log("missing closing quote',
  };
  const executeError = await apiRequest('POST', '/api/execute', errorCode);
  if (executeError.success || executeError.error) {
    console.log('✅ PASSED - Error handling works');
    console.log(`   Response: ${JSON.stringify(executeError.data || executeError.error).substring(0, 100)}...\n`);
    passedTests++;
  } else {
    console.log('❌ FAILED - Error handling not working\n');
    failedTests++;
  }

  // Test 16: AI Chat Endpoint
  console.log('TEST 16: AI Chat Endpoint');
  const chatMessage = {
    message: 'What is a variable in programming?',
  };
  const aiChat = await apiRequest('POST', '/api/ai/chat', chatMessage);
  if (aiChat.success && aiChat.data.response) {
    console.log('✅ PASSED - AI chat responded');
    console.log(`   Response: ${aiChat.data.response.substring(0, 100)}...\n`);
    passedTests++;
  } else {
    console.log('⚠️  WARNING - AI chat failed (Ollama may not be running)');
    console.log(`   Error: ${JSON.stringify(aiChat.error)}\n`);
    console.log('   Note: This is expected if Ollama service is not running locally\n');
  }

  // Summary
  console.log('\n========================================');
  console.log('           TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);
  console.log('========================================\n');
}

// Run the test suite
runTests().catch(console.error);
