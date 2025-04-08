const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");

// POST /api/tickets - Registrar nuevos boletos
router.post("/", async (req, res) => {
  try {
    console.log("📩 Recibido en backend:", req.body);

    const { nombre, correo, cantidad } = req.body;

    if (!nombre || !correo || !cantidad || cantidad < 1 || cantidad > 10) {
      return res.status(400).json({ exito: false, mensaje: "Cantidad inválida (1 a 10 boletos máximo)" });
    }

    const totalNumeros = 10000;

    const boletos = await Ticket.find({}, "numeros -_id");
    const usados = boletos.flatMap(t => t.numeros);

    const disponibles = [];
    for (let i = 0; i < totalNumeros; i++) {
      if (!usados.includes(i)) disponibles.push(i);
    }

    if (cantidad > disponibles.length) {
      return res.status(400).json({ exito: false, mensaje: "No hay suficientes números disponibles" });
    }

    const numerosElegidos = [];
    for (let i = 0; i < cantidad; i++) {
      const index = Math.floor(Math.random() * disponibles.length);
      numerosElegidos.push(disponibles.splice(index, 1)[0]);
    }

    await Ticket.create({ nombre, correo, numeros: numerosElegidos });

    res.status(200).json({
      exito: true,
      mensaje: "Boletos asignados correctamente",
      numeros: numerosElegidos
    });

  } catch (error) {
    console.error("❌ Error en el backend:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno del servidor" });
  }
});

// GET /api/tickets/consulta - Ver todos los tickets registrados
router.get("/consulta", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ fecha: -1 }); // ordenados del más reciente al más antiguo
    res.json({ exito: true, tickets });
  } catch (error) {
    console.error("❌ Error al consultar tickets:", error);
    res.status(500).json({ exito: false, mensaje: "Error al obtener los tickets" });
  }
});

module.exports = router;
