const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Validar existencia de URI de conexión
if (!process.env.MONGO_URI) {
  console.error("❌ Error: No se ha definido la variable de entorno MONGO_URI");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// 📁 Servir archivos estáticos desde carpeta /public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "..", "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 🔌 Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Conexión exitosa a MongoDB"))
.catch(err => console.error("❌ Error al conectar a MongoDB", err));

// 📦 Rutas para gestión de tickets
const ticketRoutes = require("./routes/tickets");
app.use("/api/tickets", ticketRoutes);

// ⚠️ Middleware de errores
app.use((err, req, res, next) => {
  console.error("Error interno del servidor:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

// 🚀 Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
