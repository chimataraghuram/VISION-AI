/**
 * VisionAI API Service
 * Centralized axios instance for all backend API calls.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s — Gemini Vision can take up to 30s
  headers: {
    'Accept': 'application/json',
  },
});

// ── Request interceptor: log outgoing requests in dev ─────────────────────────
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize errors ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);


// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Analyze a room image for compliance.
 * @param {File} imageFile - The uploaded image file
 * @param {string} standard - Selected compliance standard
 * @returns {Promise<AnalyzeResponse>}
 */
export const analyzeImage = async (imageFile, standard) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('standard', standard);

  const response = await api.post('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


/**
 * Generate 5 interview questions for a compliance standard.
 * @param {string} standard - Compliance standard
 * @returns {Promise<{questions: string[], standard: string}>}
 */
export const getInterviewQuestions = async (standard) => {
  const response = await api.post('/api/questions', { standard });
  return response.data;
};


/**
 * Evaluate a single interview answer.
 * @param {string} question - The question that was asked
 * @param {string} answer - Transcribed answer from speech
 * @param {string} standard - Compliance standard being tested
 * @returns {Promise<{score: number, feedback: string}>}
 */
export const evaluateAnswer = async (question, answer, standard) => {
  const response = await api.post('/api/evaluate', { question, answer, standard });
  return response.data;
};


/**
 * Save a completed interview session.
 * @param {Object} interviewData - Full interview session data
 * @returns {Promise<InterviewResultResponse>}
 */
export const saveInterviewResult = async (interviewData) => {
  const response = await api.post('/api/interview/save', interviewData);
  return response.data;
};


/**
 * Get paginated compliance report history.
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {string|null} standard - Optional standard filter
 * @returns {Promise<{reports: ReportSummary[], total: number}>}
 */
export const getHistory = async (page = 1, pageSize = 10, standard = null) => {
  const params = { page, page_size: pageSize };
  if (standard) params.standard = standard;

  const response = await api.get('/api/history', { params });
  return response.data;
};


/**
 * Get a single report's full detail.
 * @param {number} reportId - Report ID
 * @returns {Promise<ReportDetail>}
 */
export const getReportDetail = async (reportId) => {
  const response = await api.get(`/api/history/${reportId}`);
  return response.data;
};


/**
 * Get dashboard statistics.
 * @returns {Promise<DashboardResponse>}
 */
export const getDashboard = async () => {
  const response = await api.get('/api/dashboard');
  return response.data;
};

export default api;
