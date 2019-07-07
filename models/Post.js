const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    settings: {
      privacy: {
        type: String,
        enum: ['pub', 'cgh', 'cgp']
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
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
            ref: 'User'
          }
        ],
        allowed: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        ],
        requested: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User'
          }
        ],
        invited: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User'
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
        ref: 'Reply'
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

module.exports = Post = mongoose.model('Post', PostSchema);
