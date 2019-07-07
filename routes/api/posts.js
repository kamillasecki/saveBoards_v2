const express = require('express');
const router = express.Router();
const { check, oneOf, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Category = require('../../models/Category');
const Reply = require('../../models/Reply');
const Post = require('../../models/Post');
const mongoose = require('mongoose');

require('../../models/Reply');

// @route   POST api/posts
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
          //check if privacy is one of the following
          //pub: Public, everyone can see it
          //cgp: closed group public, subject is visible to everyone, but to accrss it user needs invotation
          //cgh: closed group hidden, not visible, only way to get access it to be invited by the owner.
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
      //check if the category ID exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ msg: 'Incorrect category ID' });
      }

      let p = new Post();

      p.settings.privacy = privacy;
      p.settings.author = req.user.id;
      p.settings.category = category.id;
      p.settings.encryption.isEnabmed = encryption;

      if (p.settings.encryption.isEnabled) {
        p.settings.encryption.checkword = checkword;
      }

      if (p.settings.privacy != 'pub') {
        p.settings.access.allowed.push(req.user.id);
        p.settings.access.admin.push(req.user.id);
      }

      p.body.text = text;
      p.header.subject = subject;

      const post = await p.save();

      return res.send(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/posts
// @desc    Get post by id
// @accee   Public / Private

router.get('/:id', [auth], async (req, res) => {
  const id = req.params.id;

  //check if post ID is correct
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid post id' });
  }

  try {
    const post = await Post.findById(id)
      .populate('settings.author', ['name', 'avatar'])
      .populate({
        path: 'replies',
        model: 'Reply',
        populate: [
          {
            path: 'author',
            model: 'User',
            select: ['name', 'avatar']
          },
          {
            path: 'rreplies',
            model: 'Reply',
            populate: {
              path: 'author',
              select: ['name', 'avatar']
            }
          }
        ]
      });

    if (!post) {
      return res.status(400).json({ msg: 'Invalid post id' });
    }

    post.settings.isAdmin = false;
    post.settings.isRequested = false;
    post.settings.isAllowed = false;

    //if the post is public it is available for everyone
    if (post.settings.privacy === 'pub') {
      post.settings.isAllowed = true;
    }

    //check if user is an admin
    if (post.settings.access.admin.some(e => e.toString() === req.user.id)) {
      post.settings.isAdmin = true;
    }

    //if the post is not public and user is an admin populate list of users requesting an access
    if (post.settings.privacy !== 'pub' && post.settings.isAdmin === true) {
      post.settings.isAdmin = true;
      await post
        .populate({
          path: 'settings.access.requested',
          select: ['name', 'avatar'],
          model: 'User'
        })
        .populate({
          path: 'settings.access.invited',
          select: ['name', 'avatar'],
          model: 'User'
        })
        .execPopulate();
    }

    //check if user is allowed to access the post
    if (post.settings.access.allowed.some(e => e.toString() === req.user.id)) {
      post.settings.isAllowed = true;
    }

    //check if user is awaiting to get access to the post
    if (
      post.settings.access.requested.some(e => e.toString() === req.user.id)
    ) {
      post.settings.isRequested = true;
    }

    //if the post is closed group public type and user is not allowed to access provide just the subject
    if (post.settings.privacy === 'cgp' && post.settings.isAllowed === false) {
      post.settings.access = null;
      post.body = null;
      post.replies = null;
      return res.send(post);
    }

    if (post.settings.isAllowed === false) {
      if (post.settings.privacy === 'cgp') {
        post.settings.access = null;
        post.body = null;
        post.replies = null;
        return res.send(post);
      } else {
        return res
          .status(401)
          .json({ msg: 'You have no permision to access this post' });
      }
    } else {
      res.send(post);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/posts/upvote/:id
// @desc    Upvote the post
// @accee   Private

router.put('/upvote/:id', auth, async (req, res) => {
  const id = req.params.id;

  //check if post ID is correct
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid post id' });
  }

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({ msg: 'Invalid post id' });
    }

    //check if the post has been already upvoted
    if (
      post.header.votes.upVotes.some(e => e.user.toString() === req.user.id)
    ) {
      return res.status(400).json({ msg: 'Post already upvoted' });
    }

    //check if the post has been previously downvoated
    if (
      post.header.votes.downVotes.some(e => e.user.toString() === req.user.id)
    ) {
      post.header.votes.num++;
      const removeIndex = post.header.votes.downVotes
        .map(e => e.user.toString())
        .indexOf(req.user.id);
      post.header.votes.downVotes.splice(removeIndex, 1);
    }
    post.header.votes.num++;
    post.header.votes.upVotes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.header.votes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/posts/downvote/:id
// @desc    Downvote the post
// @accee   Private

router.put('/downvote/:id', auth, async (req, res) => {
  const id = req.params.id;

  //check if post ID is correct
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid post id' });
  }

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({ msg: 'Invalid post id' });
    }

    //check if the post has been already downvoted
    if (
      post.header.votes.downVotes.some(e => e.user.toString() === req.user.id)
    ) {
      return res.status(400).json({ msg: 'Post already downvoted' });
    }

    //check if the post has been previously upvoated
    if (
      post.header.votes.upVotes.some(e => e.user.toString() === req.user.id)
    ) {
      post.header.votes.num--;
      const removeIndex = post.header.votes.upVotes
        .map(e => e.user.toString())
        .indexOf(req.user.id);
      post.header.votes.upVotes.splice(removeIndex, 1);
    }
    post.header.votes.num--;
    post.header.votes.downVotes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.header.votes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on the post
// @accee   Private

router.post(
  '/comment/:id',
  [
    auth,
    check('text', 'Comment text is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const text = req.body.text;
    const id = req.params.id;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //check if post ID is correct
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid post id' });
    }

    try {
      const post = await Post.findById(id);
      if (!post) {
        return res.status(400).json({ msg: 'Invalid post id' });
      }

      const comment = new Reply({
        author: req.user.id,
        text: text
      });

      await comment.save();
      await post.replies.push(comment.id);
      await post.save();

      return res.send(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
