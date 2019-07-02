const mongoose = require('mongoose');
//const notification = require('../models/notification.js');

// define the schema for our user model
const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
  }
);

// methods ======================

//get number of notifications
// UserSchema.methods.getCount = function(cb) {
//   notification.count({ owner: this._id, hasRead: false }, function(err, c) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('C: ' + c);
//       cb(c);
//     }
//   });
// };

// create the model for users and expose it to our app
module.exports = USER = mongoose.model('User', UserSchema);
