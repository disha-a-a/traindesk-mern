import React, { useState, useEffect } from 'react';
import {
  fetchTrainers,
  fetchDashboardSchedule,
  fetchHeatmapSchedule,
} from './services/api.js';
import TrainerPicker from './components/TrainerPicker.jsx';
import DayStrip from './components/DayStrip.jsx';
import DailyBriefing from './components/DailyBriefing.jsx';
import WeekHeatMap from './components/WeekHeatMap.jsx';
import SessionList from './components/SessionList.jsx';

export default function App() {
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('t1');
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  const [dashboardData, setDashboardData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load: fetch trainers
  useEffect(() => {
    let isMounted = true;

    async function loadTrainers() {
      try {
        const res = await fetchTrainers();
        if (isMounted && res.success && res.data.length > 0) {
          setTrainers(res.data);
          // Keep current or select first
          const first = res.data[0];
          setSelectedTrainerId(first.trainerId || first._id);
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
        if (isMounted) setError('Could not connect to TrainDesk backend API.');
      }
    }

    loadTrainers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Whenever trainer or dayOffset changes, fetch dashboard & heatmap data
  useEffect(() => {
    if (!selectedTrainerId) return;

    let isMounted = true;

    async function loadSchedule() {
      try {
        setLoading(true);
        setError(null);

        const [dashRes, heatRes] = await Promise.all([
          fetchDashboardSchedule(selectedTrainerId, selectedDayOffset),
          fetchHeatmapSchedule(selectedTrainerId),
        ]);

        if (isMounted) {
          if (dashRes.success) {
            setDashboardData(dashRes);
          }
          if (heatRes.success) {
            setHeatmapData(heatRes);
          }
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'Unable to load schedule data. Please verify backend is running.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [selectedTrainerId, selectedDayOffset]);

  const handleSelectTrainer = (id) => {
    setSelectedTrainerId(id);
  };

  const handleSelectDay = (offset) => {
    setSelectedDayOffset(offset);
  };

  return (
    <div className="app">
      <TrainerPicker
        trainers={trainers}
        selectedTrainerId={selectedTrainerId}
        onSelectTrainer={handleSelectTrainer}
      />

      {error && <div className="status-error">{error}</div>}

      {dashboardData?.weekStrip && (
        <DayStrip
          days={dashboardData.weekStrip}
          selectedDayOffset={selectedDayOffset}
          onSelectDay={handleSelectDay}
        />
      )}

      {loading && !dashboardData && (
        <div className="status-loading">Loading schedule data...</div>
      )}

      {dashboardData?.brief && (
        <DailyBriefing brief={dashboardData.brief} />
      )}

      {heatmapData && (
        <WeekHeatMap
          heatmapData={heatmapData}
          selectedDayOffset={selectedDayOffset}
          onSelectDay={handleSelectDay}
        />
      )}

      {dashboardData && (
        <SessionList
          sessions={dashboardData.sessions || []}
          selectedDate={dashboardData.selectedDate}
        />
      )}
    </div>
  );
}

