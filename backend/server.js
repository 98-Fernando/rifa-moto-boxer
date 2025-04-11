const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require('express-session');
const bodyParser = require('body-parser');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SDK nuevo de Mercado Pago
const { MercadoPagoConfig, Preference } = require("mercadopago");
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// Validar existencia de URI de conexión
if (!process.env.MONGO_URI) {
  console.error("❌ Error: No se ha definido la variable de entorno MONGO_URI");
  process.exit(1);
}

// 🔒 Seguridad: Helmet con CSP personalizada
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net", // scripts externos
        "https://unpkg.com"         // lucide icons
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"  // tailwind desde CDN
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com" // fuentes externas
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://cdn-icons-png.flaticon.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.emailjs.com",         // emailJS
        "https://otlp.nr-data.net",        // Mercado Pago telemetry
        "https://www.mercadopago.com.co"   // Redirecciones de pago
      ],
    },
  })
);


// 🔒 Protección contra ataques por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'admin1',
  resave: false,
  saveUninitialized: true
}));

// 🔒 Protección de admin.html
app.get('/admin.html', (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login.html');
  }
});

// 📁 Servir archivos estáticos desde carpeta /public
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

// 💳 Crear preferencia de pago con Mercado Pago
app.post("/api/crear-preferencia", async (req, res) => {
  try {
    const { cantidad } = req.body;
    console.log("📩 Solicitud recibida:", req.body);

    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            title: "Boletos de rifa",
            quantity: cantidad,
            unit_price: 4500
          }
        ],
        back_urls: {
          success: "https://rifa-2025.onrender.com/success.html",
          failure: "https://rifa-2025.onrender.com/failure.html",
          pending: "https://rifa-2025.onrender.com/pending.html"
        },
        auto_return: "approved"
      }
    });

    res.status(200).json({
      success: true,
      init_point: preference.init_point
    });

  } catch (error) {
    console.error("❌ Error al crear preferencia de Mercado Pago:", error);
    res.status(500).json({ success: false, message: "Error al crear preferencia" });
  }
});

// ⚠️ Middleware de errores
app.use((err, req, res, next) => {
  console.error("Error interno del servidor:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const Ticket = require("./models/Ticket");
const fetch = require("node-fetch");

app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      });

      const payment = await response.json();

      if (payment.status === "approved") {
        const correoComprador = payment.payer.email;

        const ticket = await Ticket.findOneAndUpdate(
          { correo: correoComprador },
          { pagado: true }
        );

        if (ticket) {
          console.log(`✅ Pago confirmado para: ${correoComprador}`);

          // 📧 Enviar correo con EmailJS
          await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              service_id: "service_fcgsd9j",
              template_id: "template_6qvu9xt",
              user_id: "XPQs4d1K2sHKtcIDl",
              template_params: {
                to_email: ticket.correo,
                nombre: ticket.nombre,
                numeros: ticket.numeros.join(", ")
              }
            })
          });

          console.log("📨 Correo enviado correctamente.");
        } else {
          console.warn(`⚠️ No se encontró ticket para: ${correoComprador}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en Webhook de MP:", error);
    res.sendStatus(500);
  }
});

// ✅ Ruta de login para administrador
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '1234') {
    req.session.loggedIn = true;
    res.redirect('/admin.html');
  } else {
    res.send('❌ Usuario o contraseña incorrecta. <a href="/login.html">Volver</a>');
  }
});

// 🚀 Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
