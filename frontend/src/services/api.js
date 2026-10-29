import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch all registered trainers
 */
export const fetchTrainers = async () => {
  const response = await apiClient.get('/trainers');
  return response.data;
};

/**
 * Fetch dashboard briefing, stats, timeline, and sessions for a trainer & date/dayOffset
 */
export const fetchDashboardSchedule = async (trainerId, dayOffset = 0, date = null) => {
  const params = { trainerId, dayOffset };
  if (date) params.date = date;
  const response = await apiClient.get('/schedules/dashboard', { params });
  return response.data;
};

/**
 * Fetch 7-day hourly intensity matrix data for the weekly heat map
 */
export const fetchHeatmapSchedule = async (trainerId) => {
  const response = await apiClient.get('/schedules/heatmap', {
    params: { trainerId },
  });
  return response.data;
};

/**
 * Fetch detailed attendee list for a specific session
 */
export const fetchSessionAttendees = async (sessionId) => {
  const response = await apiClient.get(`/sessions/${sessionId}/attendees`);
  return response.data;
};

export default {
  fetchTrainers,
  fetchDashboardSchedule,
  fetchHeatmapSchedule,
  fetchSessionAttendees,
};

