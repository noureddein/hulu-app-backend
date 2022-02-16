DROP TABLE users;
CREATE TABLE IF NOT EXISTS users (
    user_id serial PRIMARY KEY,
    username VARCHAR ( 50 ) UNIQUE NOT NULL,
	password VARCHAR ( 255 ) NOT NULL,
	email VARCHAR ( 255 ) UNIQUE NOT NULL
);

CREATE TABLE favorites(
    id serial PRIMARY KEY,
    movie_id VARCHAR (50)  NOT NULL,
    email VARCHAR ( 255 )  NOT NULL,
    title VARCHAR ( 50 )  NOT NULL,
    overview TEXT  NOT NULL,
    poster_path VARCHAR ( 100 )  NOT NULL,
    release_date VARCHAR ( 20 )  NOT NULL,
    vote_count VARCHAR ( 50 )  NOT NULL,
    media_type VARCHAR ( 50 )  NOT NULL
);

-- INSERT INTO users(username , password , email) VALUES ('nour','12345','nour@gmail.com');


