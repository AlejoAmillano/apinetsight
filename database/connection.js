const mongoose = require('mongoose')

const connection = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@alejoamillano.84ibpme.mongodb.net/${process.env.DB_NAME}`
    )

    console.log('Conectado correctamente a bd: netsight')
  } catch (error) {
    console.log(error)
    throw new Error('No se ha podido conectar a la base de datos !!')
  }
}

module.exports = connection
