import mongoose from 'mongoose';

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const trainingSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for bookings linked to this session
trainingSessionSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'sessionId',
});

// Instance Method: calculate seats left based on confirmed bookings
trainingSessionSchema.methods.seatsLeft = function (confirmedCount = null) {
  if (confirmedCount !== null) {
    return Math.max(0, this.capacity - confirmedCount);
  }
  if (this.bookings && Array.isArray(this.bookings)) {
    const confirmed = this.bookings.filter((b) => b.status === 'CONFIRMED').length;
    return Math.max(0, this.capacity - confirmed);
  }
  return this.capacity;
};

// Instance Method: check if session is full
trainingSessionSchema.methods.isFull = function (confirmedCount = null) {
  return this.seatsLeft(confirmedCount) <= 0;
};

// Instance Method: check if this session overlaps with another session
trainingSessionSchema.methods.overlapsWith = function (otherSession) {
  if (!otherSession) return false;

  // Check if same date (year, month, day)
  const d1 = new Date(this.date).toISOString().slice(0, 10);
  const d2 = new Date(otherSession.date).toISOString().slice(0, 10);
  if (d1 !== d2) return false;

  const start1 = parseTimeToMinutes(this.startTime);
  const end1 = parseTimeToMinutes(this.endTime);
  const start2 = parseTimeToMinutes(otherSession.startTime);
  const end2 = parseTimeToMinutes(otherSession.endTime);

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  return overlapStart < overlapEnd;
};

const TrainingSession =
  mongoose.models.TrainingSession || mongoose.model('TrainingSession', trainingSessionSchema);

export default TrainingSession;

