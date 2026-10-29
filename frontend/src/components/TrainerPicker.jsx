import React from 'react';

export default function TrainerPicker({ trainers = [], selectedTrainerId, onSelectTrainer }) {
  const currentTrainer = trainers.find(
    (t) => t.trainerId === selectedTrainerId || t._id === selectedTrainerId
  );

  return (
    <header className="top">
      <div>
        <div className="brand">
          <h1>TrainDesk</h1>
          <span className="tag">Prototype · sample data</span>
        </div>
        {currentTrainer && (
          <div className="who">
            <div className="wg">
              <span className="wk">Trainer</span>
              <span className="wv">{currentTrainer.name}</span>
            </div>
            <div className="wg">
              <span className="wk">Topics</span>
              <span className="wv">{currentTrainer.specialization}</span>
            </div>
          </div>
        )}
      </div>

      <div className="picker">
        <label htmlFor="trainer-select">Trainer</label>
        <select
          id="trainer-select"
          value={selectedTrainerId}
          onChange={(e) => onSelectTrainer(e.target.value)}
        >
          {trainers.map((t) => (
            <option key={t.trainerId || t._id} value={t.trainerId || t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

