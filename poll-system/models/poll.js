const { pgPool } = require('../config/database');

class Poll {
  
  static async create(title, options) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const pollResult = await client.query(
        'INSERT INTO polls (title) VALUES ($1) RETURNING id',
        [title]
      );
      const pollId = pollResult.rows[0].id;
      
      for (const option of options) {
        await client.query(
          'INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)',
          [pollId, option]
        );
      }
      
      await client.query('COMMIT');
      return pollId;
    } catch (error) {
      console.log("Opps Something went wrong : ", error);
      
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // get Results 
  static async getResults(pollId) {
    return pgPool.query(
      `SELECT p.title, po.* 
       FROM polls p 
       JOIN poll_options po ON p.id = po.poll_id 
       WHERE p.id = $1`,
      [pollId]
    );
  }

  static async recordVote(pollId, optionId) {
    return db.query(
      'INSERT INTO votes (poll_id, option_id) VALUES ($1, $2)',
      [pollId, optionId]
    );
  }
  static async getLeaderboard() {
    return pgPool.query(`
      SELECT p.title as poll_title, po.option_text, po.votes
      FROM poll_options po
      JOIN polls p ON po.poll_id = p.id
      ORDER BY po.votes DESC
      LIMIT 10
    `);
  }
}

module.exports = Poll;
