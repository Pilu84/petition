DROP TABLE IF EXISTS users, signatures, users_profil;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    pass VARCHAR(255) NOT NULL
);

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    sing TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE users_profil (
    id SERIAL PRIMARY KEY,
    age INTEGER,
    city VARCHAR(100),
    url VARCHAR(300),
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id)
);
