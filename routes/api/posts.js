const express = require('express');
const router = express.Router();
const { check, oneOf, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Category = require('../../models/Category');
const User = require('../../models/User');
const Post = require('../../models/Post');
const mongoose = require('mongoose');

// @route   GET api/posts
// @desc    Create post
// @accee   Private
router.post(
  '/',
  [
    auth,
    [
      check('subject', 'Subject is required')
        .not()
        .isEmpty(),
      check('text', 'Text is required')
        .not()
        .isEmpty(),
      check('privacy', 'The privacy setting is required')
        .not()
        .isEmpty(),
      oneOf(
        [
          check('privacy').equals('pub'),
          check('privacy').equals('cgp'),
          check('privacy').equals('cgh')
        ],
        'The privacy setting should be one of the following: pub | cgp | cgh'
      ),
      check('categoryId', 'Category ID is required')
        .not()
        .isEmpty(),
      check('encryption', 'Encryption is required')
        .not()
        .isEmpty(),
      check('encryption', 'Encryption must be boolean').isBoolean()
    ]
  ],
  async (req, res) => {
    const {
      subject,
      text,
      encryption,
      privacy,
      categoryId,
      checkword
    } = req.body;

    //check if encryption is enabled and if so check the checkword
    if (encryption) {
      await check('checkword')
        .not()
        .isEmpty()
        .withMessage('If encryption is enabled a checkword is required')
        .run(req);
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //check if the category ID is correct
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ msg: 'Invalid category id' });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      //check if the category ID exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ msg: 'Incorrect category ID' });
      }

      let p = new Post();

      p.settings.privacy = privacy;
      p.settings.author = req.user.id;
      p.settings.authorName = user.name;
      p.settings.avatar = user.avatar;
      p.settings.category = category.id;
      p.settings.encryption.isEnabmed = encryption;

      if (p.settings.encryption.isEnabled) {
        p.settings.encryption.checkword = checkword;
      }

      if (p.settings.privacy != 'pub') {
        p.settings.access.allowed = [];
        p.settings.access.allowed.push(req.user.id);
        p.settings.access.admin = [];
        p.settings.access.admin.push(req.user.id);
        if (p.settings.privacy == 'cgh') {
          p.settings.access.invited = [];
          if (p.settings.privacy == 'cgp') {
            p.settings.access.requested = [];
          }
        }
      }

      p.body.text = text;
      p.body.updates = [];
      p.header.subject = subject;
      p.header.votes.num = 0;
      p.header.votes.upVotes = [];
      p.header.votes.downVotes = [];

      const post = await p.save();

      return res.send(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
