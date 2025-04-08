const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");

// POST /api/tickets → Registrar nuevos boletos
router.post("/", async (req, res) => {
  try {
    console.log("📩 Solicitud recibida:", req.body);
    const { nombre, correo, cantidad } = req.body;

    // Validaciones básicas
    if (!nombre || !correo || !cantidad || cantidad < 1 || cantidad > 10) {
      return res.status(400).json({
        exito: false,
        mensaje: "⚠️ Campos inválidos. Se permiten entre 1 y 10 boletos."
      });
    }

    const TOTAL_NUMEROS = 10000;

    // Obtener todos los números ya asignados
    const boletos = await Ticket.find({}, "numeros -_id");
    const usados = boletos.flatMap(t => t.numeros);

    // Validar disponibilidad
    const disponibles = [];
    for (let i = 0; i < TOTAL_NUMEROS; i++) {
      if (!usados.includes(i)) disponibles.push(i);
    }

    if (cantidad > disponibles.length) {
      return res.status(400).json({
        exito: false,
        mensaje: "❌ No hay suficientes números disponibles."
      });
    }

    // Seleccionar números aleatorios sin repetirse
    const numerosElegidos = [];
    for (let i = 0; i < cantidad; i++) {
      const index = Math.floor(Math.random() * disponibles.length);
      numerosElegidos.push(disponibles.splice(index, 1)[0]);
    }

    // Guardar en base de datos
    await Ticket.create({ nombre, correo, numeros: numerosElegidos });

    const totalUsados = usados.length + cantidad;
    const porcentaje = Math.round((totalUsados / TOTAL_NUMEROS) * 100);

    res.status(200).json({
      exito: true,
      mensaje: "🎟️ Boletos asignados correctamente",
      numeros: numerosElegidos,
      porcentaje
    });

  } catch (error) {
    console.error("❌ Error en el backend:", error);
    res.status(500).json({
      exito: false,
      mensaje: "🚫 Error interno del servidor"
    });
  }
});

// GET /api/tickets/consulta → Consultar todos los boletos
router.get("/consulta", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ fecha: -1 });
    res.status(200).json({
      exito: true,
      total: tickets.length,
      tickets
    });
  } catch (error) {
    console.error("❌ Error al consultar tickets:", error);
    res.status(500).json({
      exito: false,
      mensaje: "🚫 Error al obtener los tickets"
    });
  }
});

module.exports = router;
  