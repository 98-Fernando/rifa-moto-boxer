import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas con éxito'))
.catch((error) => console.error('❌ Error al conectar a MongoDB:', error));

app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
