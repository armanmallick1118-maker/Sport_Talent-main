import API from "../services/api";

// ==========================================
// LOCAL ASSESSMENT HISTORY
// ==========================================

/**
 * Save an assessment result to localStorage.
 *
 * This is temporary frontend storage.
 * Later, this can be replaced/combined with
 * Arman's backend + Firebase storage.
 */
export const saveAssessmentResult = (testName, result) => {
  try {
    const existingHistory =
      JSON.parse(localStorage.getItem("assessmentHistory")) || [];

    const newAssessment = {
      id: Date.now(),

      // Dashboard expects these names
      testName: testName,

      // Date shown in Performance History
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      // Assessment data
      time: result?.time || null,
      topSpeed: result?.topSpeed || null,
      jumpHeight: result?.jumpHeight || null,
      score: result?.score || 0,
      badge: result?.badge || "Assessment",
    };

    const updatedHistory = [
      newAssessment,
      ...existingHistory,
    ];

    localStorage.setItem(
      "assessmentHistory",
      JSON.stringify(updatedHistory)
    );

    console.log(
      "Assessment saved successfully:",
      newAssessment
    );

    return newAssessment;
  } catch (error) {
    console.error(
      "Error saving assessment result:",
      error
    );

    return null;
  }
};


// ==========================================
// GET ASSESSMENT HISTORY
// ==========================================

export const getAssessmentHistory = () => {
  try {
    const history =
      JSON.parse(
        localStorage.getItem("assessmentHistory")
      ) || [];

    // Remove old/incompatible records
    const validHistory = history.filter(
      (item) =>
        item &&
        typeof item.testName === "string"
    );

    // Save cleaned history
    localStorage.setItem(
      "assessmentHistory",
      JSON.stringify(validHistory)
    );

    return validHistory;
  } catch (error) {
    console.error(
      "Error loading assessment history:",
      error
    );

    return [];
  }
};


// ==========================================
// ASSESSMENT BACKEND API INTEGRATIONS
// ==========================================

/**
 * 1. Start Assessment
 *
 * POST /api/assessment/start
 */
export const startAssessment = async (
  sport,
  testType
) => {
  try {
    const response = await API.post(
      "/api/assessment/start",
      {
        sport,
        testType,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error starting assessment:",
      error
    );

    throw error;
  }
};


/**
 * 2. Upload Assessment Media
 *
 * POST /api/assessment/upload
 */
export const uploadAssessmentMedia = async (
  assessmentId,
  mediaUrl
) => {
  try {
    const response = await API.post(
      "/api/assessment/upload",
      {
        assessmentId,
        mediaUrl,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error uploading assessment media:",
      error
    );

    throw error;
  }
};


/**
 * 3. Trigger AI Analysis
 *
 * POST /api/assessment/analyze
 */
export const triggerAssessmentAnalysis = async (
  assessmentId
) => {
  try {
    const response = await API.post(
      "/api/assessment/analyze",
      {
        assessmentId,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error triggering AI analysis:",
      error
    );

    throw error;
  }
};


/**
 * 4. Get Assessment Details
 *
 * GET /api/assessment/:id
 */
export const getAssessmentDetails = async (id) => {
  try {
    const response = await API.get(
      `/api/assessment/${id}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching assessment details:",
      error
    );

    throw error;
  }
};