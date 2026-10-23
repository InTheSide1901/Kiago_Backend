require('dotenv').config();

const express = require('express');
const cors = require('cors');



// Importación de rutas
const authRoutes = require('./src/routes/authRoutes');
const localRoutes = require('./src/routes/localRoutes');
const comentarioRoutes = require('./src/routes/comentarioRoutes');
const favoritoRoutes = require('./src/routes/favoritoRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const otherRoutes = require('./src/routes/otherRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Registro de endpoints
app.use('/api/auth', authRoutes);
app.use('/api/locales', localRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api', favoritoRoutes);
app.use('/api', solicitudRoutes);
app.use('/api', otherRoutes);

// Puerto de ejecución
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});