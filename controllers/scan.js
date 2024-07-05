// Importar modulos
const fs = require('fs')
const path = require('path')

// Importar modelos
const Scan = require('../models/scan')

// Acciones de prueba
const pruebaScan = (req, res) => {
  return res.status(200).send({
    message: 'Mensaje enviado desde: controllers/scan.js',
  })
}

// Guardar scan
const save = (req, res) => {
  // Recoger datos del body
  const params = req.body

  // Crear y rellenar el objeto del modelo
  let newScan = new Scan(params)
  newScan.user = req.body.userId
  console.log('req.body:', req.body)
  // Guardar objeto en bbdd
  newScan.save((error, scanStored) => {
    if (error || !scanStored)
      return res
        .status(400)
        .send({ status: 'error', message: 'No se ha guardado el scan.' })

    // Devolver respuesta
    return res.status(200).send({
      status: 'success',
      message: 'Scan guardado',
      scanStored,
    })
  })
}

// Sacar un scan
const detail = (req, res) => {
  // Sacar id de scan de la url
  const scanId = req.params.id

  // Find con la condicion del id
  Scan.findById(scanId, (error, scanStored) => {
    if (error || !scanStored) {
      return res.status(404).send({
        status: 'error',
        message: 'No existe el scan',
      })
    }

    // Devolver respuesta
    return res.status(200).send({
      status: 'success',
      message: 'Mostrar scan',
      scan: scanStored,
    })
  })
}

// Eliminar scans
const remove = (req, res) => {
  // Sacar el id del scan a eliminar
  const scanId = req.params.id

  // Find y luego un remove
  Scan.find({ user: req.user.id, _id: scanId }).remove((error) => {
    if (error) {
      return res.status(500).send({
        status: 'error',
        message: 'No se ha eliminado el scan',
      })
    }

    // Devolver respuesta
    return res.status(200).send({
      status: 'success',
      message: 'Eliminar scan',
      scan: scanId,
    })
  })
}

// listar scans de un usuario
const user = (req, res) => {
  // Extract user ID from request parameters
  const userId = req.params.id

  // Find scans for user, populate user data, and sort by creation date
  Scan.find({ user: userId })
    .sort('-created_at')
    .populate('user', '-password -__v -role -email')
    .exec((error, scans) => {
      if (error || !scans || scans.length <= 0) {
        // Return 404 error if no scans found
        return res.status(404).send({
          status: 'error',
          message: 'No scans to display',
        })
      }

      // Return successful response with all scan data
      return res.status(200).send({
        status: 'success',
        message: 'Scans for user',
        scans,
      })
    })
}

const update = (req, res) => {
  // Recoger datos del body
  const params = req.body

  // SI no me llegan dar respuesta negativa
  if (!params.id || !params.blacklist)
    return res.status(400).send({
      status: 'error',
      message:
        'Debes enviar el id del scan a actualizar y el estado de blacklist',
    })

  // Buscar el scan a actualizar
  Scan.findById(params.id, (error, scanToUpdate) => {
    if (error || !scanToUpdate)
      return res
        .status(404)
        .send({ status: 'error', message: 'No se ha encontrado el scan.' })

    // Actualizar campos del scan
    scanToUpdate.user = req.user.id
    scanToUpdate.blacklist = params.blacklist // Update blacklist field

    // Guardar cambios en bbdd
    scanToUpdate.save((error, scanUpdated) => {
      if (error || !scanUpdated)
        return res
          .status(400)
          .send({ status: 'error', message: 'No se ha actualizado el scan.' })

      // Devolver respuesta
      return res.status(200).send({
        status: 'success',
        message: 'Scan actualizado',
        scanUpdated,
      })
    })
  })
}

// Exportar acciones
module.exports = {
  pruebaScan,
  save,
  detail,
  remove,
  update,
  user,
}
