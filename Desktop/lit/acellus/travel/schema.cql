-- start with queries we need: get one entry by ID
-- key for this table: entries_by_id (id is the partition key)
-- use uuid for random stable id

-- create a keyspace in scylla called travel 
CREATE KEYSPACE IF NOT EXISTS travel
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

-- switch active keyspace to travel 
USE travel;

-- make a table called entries_by_id
CREATE TABLE IF NOT EXISTS entries_by_id (
    id          uuid PRIMARY KEY, -- unique identifier (partition key)
    user_id     uuid,             -- who the entry belongs to
    title       text,             -- short string for the title
    content     text,             -- main journal body
    location    text,             -- where the entry happened
    created_at  timeuuid,         -- time-based UUID (good for ordering/pagination)
    created_ts  timestamp         -- human-readable time
);

-- i already have entries by id but now i want to make entries by user 
-- so it shows a user's latest entries 
-- scylla is table by query 
-- "give me newest N entries for user U with pagination"
-- partition by user_id (groups user's rows together)
-- then sort each user's entries by newest 

CREATE TABLE IF NOT EXISTS entries_by_user (
    user_id uuid,
    created_at  timeuuid,
    id  uuid,
    title   text,
    content text,
    location    text,
    created_ts  timestamp,
    PRIMARY KEY ((user_id), created_at) 
) WITH CLUSTERING ORDER BY (created_at DESC);

-- add a users table 
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT,
    email TEXT,
    password_hash TEXT,
    created_at TIMEUUID
);

-- Add index on email for login queries
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- photos table 
CREATE TABLE IF NOT EXISTS photos (
  photo_id uuid PRIMARY KEY,
  entry_id uuid,
  user_id uuid,
  url text,
  uploaded_at timestamp
);

CREATE TABLE IF NOT EXISTS trips (
  trip_id uuid PRIMARY KEY,
  user_id uuid,
  name text,
  description text,
  start_date date,
  end_date date
);

-- create more tables as needed