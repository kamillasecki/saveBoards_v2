const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    settings: {
      privacy: {
        type: String
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'users'
      },
      authorName: {
        type: String
      },
      avatar: {
        type: String
      },
      category: {
        type: Schema.Types.ObjectId,
        ref: 'categories'
      },
      encryption: {
        isEnabled: Boolean,
        checkword: String
      },
      isAdmin: {
        type: Boolean
      },
      isRequested: {
        type: Boolean
      },
      isAllowed: { type: Boolean },
      access: {
        admin: [
          {
            type: Schema.Types.ObjectId,
            ref: 'users'
          }
        ],
        allowed: [
          {
            type: Schema.Types.ObjectId,
            ref: 'users'
          }
        ],
        requested: [
          {
            type: Schema.Types.ObjectId,
            ref: 'users'
          }
        ],
        invited: [
          {
            type: Schema.Types.ObjectId,
            ref: 'users'
          }
        ]
      }
    },
    header: {
      subject: {
        type: String,
        required: true
      },
      votes: {
        num: {
          type: Number
        },
        upVotes: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: 'users'
            }
          }
        ],
        downVotes: [
          {
            user: {
              type: Schema.Types.ObjectId,
              ref: 'users'
            }
          }
        ]
      }
    },
    body: {
      text: {
        type: String,
        required: true
      },
      updates: [
        {
          type: String
        }
      ]
    },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'replies'
      }
    ],
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

module.exports = Post = mongoose.model('post', PostSchema);
