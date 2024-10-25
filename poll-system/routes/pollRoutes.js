const express = require('express');
const router = express.Router();
const Poll = require('../models/poll');
const { sendVote } = require('../services/kafkaService');
const { producer, consumer } = require('../config/kafka');

router.post('/polls', async (req, res) => {
  const { title, options } = req.body;

  console.log("Title: ", title , "  Options :" , options);
  
  try {
    const pollId = await Poll.create(title, options);
    console.log("PollId : ", pollId);
    // const pollDetails = await Poll.getPollWithOptions(pollId);
    
    res.status(201).json( {
      message: 'Poll created successfully',
      poll: pollId
    });
   
  } catch (error) {
    console.log("error:", error);
    
    res.status(500).json({ error: 'Failed to create poll' });
  }
});



//get poll details with poll 
router.get('/polls/:id', async (req, res) => {
  
  try {
    const pollId = parseInt(req.params.id);
    if (isNaN(pollId)) {
     res.json("Invalid poll ID")
    }

    const result = await Poll.getResults(pollId);
    if (!result.rows.length) {
      return res.status(404).json({
        type: 'NotFound',
        message: 'Poll not found'
      });
    }

    const formattedResult = {
      pollId,
      title: result.rows[0].title,
      options: result.rows.map(row => ({
        id: row.id,
        text: row.option_text,
        votes: row.votes
      }))
    };
console.log(" formatt Resul:", formattedResult);

    res.json({ poll: formattedResult });
  } catch (error) {
    console.log("Errror:", error);
    
    res.status(500).json({ error: 'Failed to fetch poll results' });
  }
});


// Vote Processing
router.post('/polls/:id/vote', async (req, res) => {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 100; // ms

  try {
    const { pollId  } = req.params.id;
    const optionId =req.body

    let retries = MAX_RETRIES;
    while (retries > 0) {
      try {
        await producer.beginTransaction();
        
        // Send vote to Kafka
        await producer.send({
          topic: 'poll-votes',
          messages: [{
            key: String(pollId),
            value: JSON.stringify({
              pollId,
              optionId,
              timestamp: Date.now(),
              metadata: {
                retryCount: MAX_RETRIES - retries,
                source: 'polling-app'
              }
            }),
            partition: pollId % 3, // Simple partitioning strategy
            headers: {
              'retry-count': String(MAX_RETRIES - retries),
              'source': 'polling-app',
              'correlation-id': req.headers['x-correlation-id'] || Date.now().toString()
            }
          }]
        });

        // Update local database
        await Poll.recordVote(pollId, optionId);
        
        await producer.commitTransaction();
        
        // Broadcast updates
        await Promise.all([
          broadcastPollUpdate(pollId),
          broadcastLeaderboardUpdate()
        ]);
console.log(" Vote ragisterd : ", pollId, "  option:", optionId);

        return res.json({
          message: 'Vote registered successfully',
          pollId,
          optionId
        });


      } catch (error) {
      //  await producer.abortTransaction();
        retries--;

        if (retries === 0) {
          console.log("error:" , error);
          
        }

        // Exponential backoff with jitter
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries) 
          + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error("Vote processing error:", error);
    
    return res.status(500).json({ 
      error: 'Failed to register vote',
      details: error.message 
    });
  }
});









router.get('/leaderboard', async (req, res) => {
  try {
    const result = await Poll.getLeaderboard();
    console.log("Leaderboard results :", result);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
