const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true },
  numeros: { type: [Number], required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", ticketSchema);
