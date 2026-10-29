import mongoose from 'mongoose';
import Person from './Person.js';

const traineeSchema = new mongoose.Schema({
  traineeId: {
    type: String,
    trim: true,
  },
  organization: {
    type: String,
    required: true,
    trim: true,
  },
});

const Trainee = Person.discriminators?.Trainee || Person.discriminator('Trainee', traineeSchema);

export default Trainee;

