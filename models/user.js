const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, minLength: [10, 'Emails must be 10 characters long at least'] },
  password_hash: { type: String, required: true },
  membership_status: { type: String, enum: ['member', 'outsider', 'admin'], required: true },
});

UserSchema.virtual('isAdmin').get(function handler() {
  return this.membership_status === 'admin';
});

module.exports = model('User', UserSchema);
