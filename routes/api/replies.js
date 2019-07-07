const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');
const Reply = require('../../models/Reply');

// @route   PUT api/reply/upvote/:id
// @desc    Upvote a reply
// @accee   Private

router.put('/upvote/:id', auth, async (req, res) => {
  const id = req.params.id;

  //check if reply ID is correct
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid reply id' });
  }

  try {
    const reply = await Reply.findById(id);

    if (!reply) {
      return res.status(400).json({ msg: 'Invalid reply id' });
    }

    //check if the reply has been already upvoted
    if (reply.votes.upVotes.some(e => e.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Reply already upvoted' });
    }

    //check if the reply has been previously downvoated
    if (reply.votes.downVotes.some(e => e.user.toString() === req.user.id)) {
      reply.votes.num++;
      const removeIndex = reply.votes.downVotes
        .map(e => e.user.toString())
        .indexOf(req.user.id);
      reply.votes.downVotes.splice(removeIndex, 1);
    }
    reply.votes.num++;
    reply.votes.upVotes.unshift({ user: req.user.id });
    await reply.save();

    res.json(reply.votes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
