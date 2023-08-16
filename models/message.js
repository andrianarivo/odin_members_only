const { Schema, model } = require('mongoose');
const { DateTime } = require('luxon');

const MessageSchema = new Schema({
  title: { type: String, required: true },
  created_at: { type: Date, required: true },
  updated_at: Date,
  text: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', require: true },
});

MessageSchema.virtual('created_at_formatted').get(function handler() {
  // no-online
  return DateTime.fromJSDate(this.created_at).toLocaleString(DateTime);
});

MessageSchema.virtual('updated_at_formatted').get(function handler() {
  if (this.updated_at) {
    return DateTime.fromJSDate(this.updated_at).toLocaleString(DateTime);
  }
  return '-';
});

module.exports = model('Message', MessageSchema);
