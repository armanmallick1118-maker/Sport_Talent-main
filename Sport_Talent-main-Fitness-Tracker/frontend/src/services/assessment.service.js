import API from "./api"; // Your Axios instance with Firebase headers

export const startAssessmentAPI = async (sport, testType) => {
  const response = await API.post("/api/assessment/start", { sport, testType });
  return response.data;
};

export const uploadAssessmentMediaAPI = async (assessmentId, mediaUrl) => {
  const response = await API.post("/api/assessment/upload", { assessmentId, mediaUrl });
  return response.data;
};

export const triggerAnalysisAPI = async (assessmentId) => {
  const response = await API.post("/api/assessment/analyze", { assessmentId });
  return response.data;
};

export const getAssessmentDetailsAPI = async (assessmentId) => {
  const response = await API.get(`/api/assessment/${assessmentId}`);
  return response.data;
};