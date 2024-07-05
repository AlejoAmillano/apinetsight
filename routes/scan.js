const express = require('express')
const router = express.Router()
const ScanController = require('../controllers/scan')
const check = require('../middlewares/auth')

// Definir rutas
router.get('/prueba-scan', ScanController.pruebaScan)
router.post('/save', check.auth, ScanController.save)
router.get('/detail/:id', check.auth, ScanController.detail)
router.delete('/remove/:id', check.auth, ScanController.remove)
router.get('/user/:id', check.auth, ScanController.user)
router.put('/update', check.auth, ScanController.update)

// Exportar router
module.exports = router
