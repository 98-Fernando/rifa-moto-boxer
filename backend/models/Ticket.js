const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  numeros: [String],
  estadoPago: {
    type: String,
    default: "pendiente"  // Otros valores posibles: "aprobado", "rechazado"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Ticket", TicketSchema);
