# Real-Time Polling System

A high-concurrency polling system built with Node.js, Kafka, and WebSockets. This system allows users to create polls, vote in real-time, and view live updates through WebSocket connections.

## Features

- Create polls with multiple options
- Real-time vote processing using Kafka
- Live updates via WebSockets
- Dynamic leaderboard of most popular polls
- Fault-tolerant architecture
- Concurrent vote handling
- PostgreSQL for persistent storage

## Prerequisites

- Node.js (v14+ recommended)
- Apache Kafka
- ZooKeeper
- PostgreSQL
- npm or yarn

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd polling-system
```

### 2. Install Dependencies

```bash
npm install
```

Required dependencies:
- express
- kafkajs
- pg
- ws (WebSocket)
- dotenv

### 3. Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE polling_system;
```

2. Create required tables:
```sql
CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

CREATE TABLE poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id),
  option_text TEXT NOT NULL
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id),
  option_id INTEGER REFERENCES poll_options(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. Configure database connection in `config/database.js`:
```javascript
{
  host: 'localhost',
  port: 5432,
  database: 'polling_system',
  user: 'your_username',
  password: 'your_password'
}
```

### 4. Kafka Setup

1. Start ZooKeeper:
```bash
zookeeper-server-start.bat ..\..\config\zookeeper.properties
```

2. Start Kafka:
```bash
kafka-server-start.bat ..\..\config\server.properties
```

3. Create Kafka topic:
```bash
kafka-topics.bat --create --topic poll-votes --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3
```

## Running the Application

1. Start ZooKeeper:
```bash
zookeeper-server-start.bat ..\..\config\zookeeper.properties
```

2. Start Kafka:
```bash
kafka-server-start.bat ..\..\config\server.properties
```

3. Start the application:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Polls
- `POST /polls` - Create a new poll
- `GET /polls/:id` - Get poll details and results
- `POST /polls/:id/vote` - Vote on a poll option
- `GET /leaderboard` - Get the global poll leaderboard

### WebSocket Connections
- Connect to `ws://localhost:3000/ws` for real-time updates

## Testing the Application

### Sample Test Data

```javascript
const testPolls = [
  {
    title: "Best Bollywood Movie 2023?",
    options: [
      "Pathaan",
      "Tiger 3",
      "Jawan",
      "Dunki"
    ]
  },
  {
    title: "Favorite Bollywood Actress?",
    options: [
      "Deepika Padukone",
      "Alia Bhatt",
      "Priyanka Chopra",
      "Katrina Kaif"
    ]
  },
  {
    title: "Best Bollywood Dance Number 2023?",
    options: [
      "Jhoome Jo Pathaan",
      "Not Ramaiya Vastavaiya",
      "Tere Vaaste",
      "Chaleya"
    ]
  }
];
```

### API Testing Examples

1. Create a poll:
```bash
curl -X POST http://localhost:3000/polls \
  -H "Content-Type: application/json" \
  -d '{"title":"Best Bollywood Movie 2023?","options":["Pathaan","Tiger 3","Jawan","Dunki"]}'
```

2. Vote on a poll:
```bash
curl -X POST http://localhost:3000/polls/1/vote \
  -H "Content-Type: application/json" \
  -d '{"optionId": 1}'
```

3. Get poll results:
```bash
curl http://localhost:3000/polls/1
```

4. View leaderboard:
```bash
curl http://localhost:3000/leaderboard
```

### Kafka Consumer Testing

Monitor vote processing:
```bash
kafka-console-consumer.bat --bootstrap-server localhost:9092 --topic poll-votes --from-beginning
```
