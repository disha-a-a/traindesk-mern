import mongoose from 'mongoose';
import Person from './Person.js';

const trainerSchema = new mongoose.Schema({
  trainerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
});

const Trainer = Person.discriminators?.Trainer || Person.discriminator('Trainer', trainerSchema);

export default Trainer;

