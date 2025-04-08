const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("❌ Error: No se ha definido la variable de entorno MONGO_URI");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Ruta base para pruebas rápidas
app.get("/", (req, res) => {
  res.send("🎉 API de rifas funcionando correctamente");
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB", err));

// Rutas de tickets
const ticketRoutes = require("./routes/tickets");
app.use("/api/tickets", ticketRoutes);

// Middleware de errores (opcional)
app.use((err, req, res, next) => {
  console.error("Error interno del servidor:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
