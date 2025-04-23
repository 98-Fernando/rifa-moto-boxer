import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  telefono: String,
  fecha: {
    type: Date,
    default: Date.now
  },
  numeros: [String],
  estadoPago: {
    type: String,
    enum: ["pendiente", "pagado"],
    default: "pendiente"
  }
}, {
  timestamps: true
});

// Exportación como default (ES6)
const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
