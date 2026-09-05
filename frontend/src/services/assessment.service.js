import API from "./api"; // Your Axios instance with Firebase headers

export const startAssessmentAPI = async (sport, testType) => {
  const response = await API.post("/api/v1/assessments/start", { sport, testType });
  return response.data;
};

export const uploadAssessmentMediaAPI = async (assessmentId, mediaUrl) => {
  const response = await API.post("/api/v1/assessments/upload", { assessmentId, mediaUrl });
  return response.data;
};

export const triggerAnalysisAPI = async (assessmentId) => {
  const response = await API.post("/api/v1/assessments/analyze", { assessmentId });
  return response.data;
};

export const getAssessmentDetailsAPI = async (assessmentId) => {
  const response = await API.get(`/api/v1/assessments/${assessmentId}`);
  return response.data;
};
