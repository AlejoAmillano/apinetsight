const validator = require('validator')

const validate = (params) => {
  let name =
    !validator.isEmpty(params.name) &&
    validator.isLength(params.name, { min: 3, max: undefined }) &&
    validator.isAlpha(params.name, 'es-ES')

  let email =
    !validator.isEmpty(params.email) && validator.isEmail(params.email)

  let password = !validator.isEmpty(params.password)

  if (!name || !email || !password) {
    throw new Error('No se ha superado la validación')
  } else {
    console.log('validacion superada')
  }
}

module.exports = validate
