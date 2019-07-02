const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const User = require('../../models/User');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

let parentCategories;

// @route   POST api/catrgories/
// @desc    Add new category
// @access  Admin
router.post(
  '/',
  [
    auth,
    [
      check('category', 'Name of the category is required')
        .not()
        .isEmpty(),
      check('parentId', 'Parent ID is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, parentId } = req.body;

    try {
      // Check if user is Admin type
      if (req.user.role != 'admin') {
        return res
          .status(401)
          .json({ msg: 'You have no permision to perform this action' });
      }

      //Check parent category
      let parent = await Category.findOne({ _id: parentId }).populate(
        'categoriesId',
        ['name']
      );

      if (!parent) {
        return res.status(400).json({ msg: 'Incorrect parent category' });
      }

      // Check if requested category already exists
      if (parent.categoriesId.some(e => e.name === category)) {
        return res.status(400).json({ msg: 'This category already exists' });
      }

      let n = new Category({
        name: category,
        categoriesId: [],
        postsId: [],
        parent: mongoose.Types.ObjectId(parentId)
      });

      await n.save();
      parent.categoriesId.push(mongoose.Types.ObjectId(n.id));
      await parent.save();

      res.json({ msg: 'Category has been created successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/catrgories/parents/:category_id
// @desc    Retriving array of parent categories
// @access  Public

// Recurrent function getting parents ot the category all the way to master one
// This functions receives a category and retreives its parent's category
// Then it checks if the retrived category is main (main category has no parent)
// If the category is not a main one it will call itself using newny aquired category

function getParentQuery(cat, res) {
  let promise = Category.findOne({ _id: cat.parent }).exec();

  promise.then(function(parentCat) {
    parentCategories.push(parentCat);
    if (parentCat.parent != null) {
      getparentQuery(parentCat, res);
    } else {
      res.send(parentCategories);
    }
  });
}

// Router
router.get(
  '/parents/:category_id',
  [
    check('category_id', 'CategoryId is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var categoryId = req.params.category_id;
    parentCategories = [];

    // Checking categoryID format
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: 'Invalid format of category id' });
    }

    // Getting category
    const category = await Category.findOne({ _id: categoryId }).populate(
      'categoriesId'
    );

    if (!category) {
      return res.status(400).json({ msg: 'Invalid category id' });
    }

    // Check if requested category is main one
    if (category.parent == null) {
      parentCategories.push(category);
      return res.send(parentCategories);
    }

    // Call recurrent function to get all the parents for the category
    parentCategories.push(category);
    getParentQuery(category, res);
  }
);

module.exports = router;
