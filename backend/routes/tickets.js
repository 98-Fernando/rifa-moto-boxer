const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");

const TOTAL_NUMEROS = 1000;

// Función para formatear número a 3 dígitos (ej. 7 → "007")
const formatearNumero = (n) => n.toString().padStart(3, "0");

//
// 🎟️ POST /api/tickets → Registrar nuevos boletos
//
router.post("/", async (req, res) => {
  try {
    console.log("📩 Solicitud recibida:", req.body);
    const { nombre, correo, cantidad } = req.body;

    // Validar datos
    if (!nombre || !correo || !cantidad) {
      return res.status(400).json({
        exito: false,
        mensaje: "❌ Datos incompletos. Revisa los campos enviados.",
      });
    }

    // Validar cantidad
    if (cantidad < 1 || cantidad > 20) {
      return res.status(400).json({
        exito: false,
        mensaje: "⚠️ Puedes solicitar entre 1 y 20 boletos.",
      });
    }

    // Obtener números ya asignados
    const boletos = await Ticket.find({}, "numeros -_id");
    const usados = new Set(boletos.flatMap(t => t.numeros));

    // Generar lista de números disponibles
    const disponibles = [];
    for (let i = 0; i < TOTAL_NUMEROS; i++) {
      const numero = formatearNumero(i);
      if (!usados.has(numero)) disponibles.push(numero);
    }

    // Validar disponibilidad
    if (cantidad > disponibles.length) {
      return res.status(400).json({
        exito: false,
        mensaje: "⚠️ No hay suficientes números disponibles.",
      });
    }

    // Seleccionar números aleatorios
    const seleccionados = [];
    while (seleccionados.length < cantidad) {
      const idx = Math.floor(Math.random() * disponibles.length);
      const numero = disponibles.splice(idx, 1)[0];
      seleccionados.push(numero);
    }

// Guardar en BD con estado de pago pendiente
await Ticket.create({ 
  nombre, 
  correo, 
  numeros: seleccionados, 
  estadoPago: "pendiente" 
});

    // Calcular progreso
    const totalUsados = usados.size + seleccionados.length;
    const porcentaje = Math.round((totalUsados / TOTAL_NUMEROS) * 100);

    // Responder al cliente
    res.status(200).json({
      exito: true,
      mensaje: "🎟️ Boletos asignados correctamente",
      numeros: seleccionados,
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

//
// 📊 GET /api/tickets/consulta → Consultar progreso y boletos vendidos
//
router.get("/consulta", async (req, res) => {
  try {
    const boletos = await Ticket.find({}, "numeros -_id");
    const totalNumerosVendidos = boletos.reduce((acc, ticket) => acc + ticket.numeros.length, 0);
    const porcentaje = Math.round((totalNumerosVendidos / TOTAL_NUMEROS) * 100);

    res.status(200).json({
      exito: true,
      total: totalNumerosVendidos,
      porcentaje
    });

  } catch (error) {
    console.error("❌ Error al consultar tickets:", error);
    res.status(500).json({
      exito: false,
      mensaje: "🚫 Error al obtener los tickets"
    });
  }
});
//
// 🧾 GET /api/tickets → Obtener todos los tickets registrados
//
router.get("/", async (req, res) => {
  try {
    const tickets = await   Ticket.find().sort({ createdAt: -1 }); // Ordenar por fecha descendente
    res.status(200).json({
      exito: true,
      tickets
    });
  } catch (error) {
    console.error("❌ Error al obtener los tickets:", error);
    res.status(500).json({
      exito: false,
      mensaje: "🚫 Error al obtener los tickets"
    });
  }
});

module.exports = router;
