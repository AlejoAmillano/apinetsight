// Importar dependencias
const connection = require('./database/connection')
const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Mensaje bienvenida
console.log('API Netsight')

// Conexion a bbdd
connection()

// Crear servidor node
const app = express()
const puerto = 3900

// Configurar cors
app.use(cors())

// Convertir los datos del body a objetos js
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Cargar conf rutas
const UserRoutes = require('./routes/user')
const PublicationRoutes = require('./routes/scan')

app.use('/api/user', UserRoutes)
app.use('/api/scan', PublicationRoutes)

// Ruta de prueba
app.get('/ruta-prueba', (req, res) => {
  return res.status(200).json({
    id: 1,
    nombre: 'Netsight',
    web: 'netsight.com',
  })
})

// Poner servidor a escuchar peticiones http
app.listen(puerto, () => {
  console.log('Servidor de node corriendo en el puerto: ', puerto)
})
