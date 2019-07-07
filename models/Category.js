const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define the schema for our user model
const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  categoriesId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }
  ],
  postsId: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }
});

// create the model for users and expose it to our app
module.exports = Category = mongoose.model('Category', CategorySchema);
