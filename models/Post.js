const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    settings: {
      privacy: String,
      author: { type: Schema.Types.ObjectId, ref: 'users' },
      category: { type: Schema.Types.ObjectId, ref: 'categories' },
      encryption: { isEnabled: Boolean, checkword: String },
      isAdmin: Boolean,
      isRequested: Boolean,
      isAllowed: Boolean,
      access: {
        admin: [{ type: Schema.Types.ObjectId, ref: 'users' }],
        allowed: [{ type: Schema.Types.ObjectId, ref: 'users' }],
        requested: [{ type: Schema.Types.ObjectId, ref: 'users' }],
        invited: [{ type: Schema.Types.ObjectId, ref: 'users' }]
      }
    },
    header: {
      subject: String,
      votes: {
        num: Number,
        upVotes: [String],
        downVotes: [String]
      }
    },
    body: {
      text: String,
      updates: [String]
    },
    replies: [{ type: Schema.Types.ObjectId, ref: 'replies' }],
    createdAt: { type: Date, default: Date.now }
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
