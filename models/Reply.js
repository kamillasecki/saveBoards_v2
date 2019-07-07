const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplySchema = new Schema(
  {
    isDeleted: {
      type: Boolean,
      default: false
    },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    text: String,
    rreplies: [{ type: Schema.Types.ObjectId, ref: 'Reply' }],
    votes: {
      num: {
        type: Number,
        default: 0
      },
      upVotes: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        }
      ],
      downVotes: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        }
      ]
    },
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

module.exports = Reply = mongoose.model('Reply', ReplySchema);
