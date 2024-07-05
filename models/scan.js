const { Schema, model } = require('mongoose')

const ScanSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  url: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    required: true,
  },
  blacklist: {
    type: Boolean,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
})

module.exports = model('Scan', ScanSchema, 'scans')
