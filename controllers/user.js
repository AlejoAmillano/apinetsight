// Importar dependencias y modulos
const bcrypt = require('bcrypt')
const mongoosePagination = require('mongoose-pagination')
const fs = require('fs')
const path = require('path')

// Importar modelos
const User = require('../models/user')

// Importar servicios
const jwt = require('../services/jwt')
const validate = require('../helpers/validate')

// Acciones de prueba
const status = (req, res) => {
  return res.status(200).send({
    message: 'Mensaje enviado desde: controllers/user.js',
    usuario: req.user,
  })
}

// Regristro de usuarios
const register = (req, res) => {
  // Recoger datos de la peticion
  let params = req.body

  // Comprobar que me llegan bien (+ validacion)
  if (!params.name || !params.email || !params.password) {
    return res.status(400).json({
      status: 'error',
      message: 'Faltan datos por enviar',
    })
  }

  // Validación avanzada
  try {
    validate(params)
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Valición no superada',
    })
  }

  // Control usuarios duplicados
  User.find({
    $or: [{ email: params.email.toLowerCase() }],
  }).exec(async (error, users) => {
    if (error)
      return res
        .status(500)
        .json({ status: 'error', message: 'Error en la consulta de usuarios' })

    if (users && users.length >= 1) {
      return res.status(200).send({
        status: 'exists',
        message: 'El usuario ya existe',
      })
    }

    // Cifrar la contraseña
    let pwd = await bcrypt.hash(params.password, 10)
    params.password = pwd

    // Crear objeto de usuario
    let user_to_save = new User(params)

    // Guardar usuario en la bbdd
    user_to_save.save((error, userStored) => {
      if (error || !userStored)
        return res
          .status(500)
          .send({ status: 'error', message: 'Error al guardar el ususario' })

      // añadido
      userStored.toObject()
      delete userStored.password
      delete userStored.role

      // Devolver resultado
      return res.status(200).json({
        status: 'success',
        message: 'Usuario registrado correctamente',
        user: userStored,
      })
    })
  })
}

const login = (req, res) => {
  // Recoger parametros body
  let params = req.body

  if (!params.email || !params.password) {
    return res.status(400).send({
      status: 'error',
      message: 'Faltan datos por enviar',
    })
  }

  // Buscar en la bbdd si existe
  User.findOne({ email: params.email })
    //.select({ "password": 0 })
    .exec((error, user) => {
      if (error || !user)
        return res
          .status(404)
          .send({ status: 'error', message: 'No existe el usuario' })

      // Comprobar su contraseña
      const pwd = bcrypt.compareSync(params.password, user.password)

      if (!pwd) {
        return res.status(400).send({
          status: 'error',
          message: 'No te has identificado correctamente',
        })
      }

      // Conseguir Token
      const token = jwt.createToken(user)

      // Devolver Datos del usuario
      return res.status(200).send({
        status: 'success',
        message: 'Te has identificado correctamente',
        user: {
          id: user._id,
          name: user.name,
        },
        token,
      })
    })
}

const profile = (req, res) => {
  // Recibir el parametro del id de usuario por la url
  const id = req.params.id

  // Consulta para sacar los datos del usuario
  //const userProfile = await User.findById(id);

  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec(async (error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).send({
          status: 'error',
          message: 'El usuario no existe o hay un error',
        })
      }

      // Devolver el resultado
      return res.status(200).send({
        status: 'success',
        user: userProfile,
      })
    })
}

const list = (req, res) => {
  // Find all users, excluding password, email, role, and __v fields
  User.find()
    .select('-password -email -role -__v')
    .sort('_id')
    .exec((error, users) => {
      if (error || !users) {
        // Return 404 error if no users found
        return res.status(404).send({
          status: 'error',
          message: 'No users available',
          error,
        })
      }

      // Return successful response with all user data
      return res.status(200).send({
        status: 'uccess',
        users,
      })
    })
}

const update = (req, res) => {
  // Recoger info del usuario a actualizar
  let userIdentity = req.user
  let userToUpdate = req.body

  // Eliminar campos sobrantes
  delete userToUpdate.iat
  delete userToUpdate.exp
  delete userToUpdate.role
  delete userToUpdate.image

  // Comprobar si el usuario ya existe
  User.find({
    $or: [{ email: userToUpdate.email.toLowerCase() }],
  }).exec(async (error, users) => {
    if (error)
      return res
        .status(500)
        .json({ status: 'error', message: 'Error en la consulta de usuarios' })

    let userIsset = false
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) userIsset = true
    })

    if (userIsset) {
      return res.status(200).send({
        status: 'success',
        message: 'El usuario ya existe',
      })
    }

    // Cifrar la contraseña
    if (userToUpdate.password) {
      let pwd = await bcrypt.hash(userToUpdate.password, 10)
      userToUpdate.password = pwd

      //añadido
    } else {
      delete userToUpdate.password
    }

    // Buscar y actualizar
    try {
      let userUpdated = await User.findByIdAndUpdate(
        { _id: userIdentity.id },
        userToUpdate,
        { new: true }
      )

      if (!userUpdated) {
        return res
          .status(400)
          .json({ status: 'error', message: 'Error al actualizar' })
      }

      // Devolver respuesta
      return res.status(200).send({
        status: 'success',
        message: 'Metodo de actualizar usuario',
        user: userUpdated,
      })
    } catch (error) {
      return res.status(500).send({
        status: 'error',
        message: 'Error al actualizar',
      })
    }
  })
}

const upload = (req, res) => {
  // Recoger el fichero de imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: 'error',
      message: 'Petición no incluye la imagen',
    })
  }

  // Conseguir el nombre del archivo
  let image = req.file.originalname

  // Sacar la extension del archivo
  const imageSplit = image.split('.')
  const extension = imageSplit[1]

  // Comprobar extension
  if (
    extension != 'png' &&
    extension != 'jpg' &&
    extension != 'jpeg' &&
    extension != 'gif'
  ) {
    // Borrar archivo subido
    const filePath = req.file.path
    const fileDeleted = fs.unlinkSync(filePath)

    // Devolver respuesta negativa
    return res.status(400).send({
      status: 'error',
      message: 'Extensión del fichero invalida',
    })
  }

  // Si si es correcta, guardar imagen en bbdd
  User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    { new: true },
    (error, userUpdated) => {
      if (error || !userUpdated) {
        return res.status(500).send({
          status: 'error',
          message: 'Error en la subida del avatar',
        })
      }

      // Devolver respuesta
      return res.status(200).send({
        status: 'success',
        user: userUpdated,
        file: req.file,
      })
    }
  )
}

const avatar = (req, res) => {
  // Sacar el parametro de la url
  const file = req.params.file

  // Montar el path real de la imagen
  const filePath = './uploads/avatars/' + file

  // Comprobar que existe
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).send({
        status: 'error',
        message: 'No existe la imagen',
      })
    }

    // Devolver un file
    return res.sendFile(path.resolve(filePath))
  })
}

// Exportar acciones
module.exports = {
  status,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
}
