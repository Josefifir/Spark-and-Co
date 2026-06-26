import mongoose from "mongoose";

// Atomic counter — one document per counter name
const CounterSchema = new mongoose.Schema({
  _id:  { type: String, required: true }, // counter name, e.g. "invoice"
  seq:  { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
