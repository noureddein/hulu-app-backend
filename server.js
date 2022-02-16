require('dotenv').config()
const express = require('express')
const cors = require('cors');
const bcrypt = require('bcrypt')
const pg = require('pg')
const JWT = require('jsonwebtoken')
const axios = require('axios')
const compression = require('compression')
const db = new pg.Client(process.env.DATABASE_URL)
const app = express()
app.use(compression())
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


const PORT = process.env.PORT
const TMDB_API_KEY = process.env.TMDB_API_KEY


app.post('/login', async (req, res) => {
    const { email, password } = req.body

    const sql = "SELECT * FROM users WHERE email=$1 OR username=$1;";
    safeValues = [email]

    try {
        db.query(sql, safeValues)
            .then(async results => {
                const returnedUser = results.rows[0]

                // Check if user exist
                if (!returnedUser) return res.status(200).send({ errors: { email: "User not found" } });

                // Check password 
                const comparePasswords = await bcrypt.compare(password, returnedUser.password)
                if (!comparePasswords) return res.status(200).send({ errors: { password: "Wrong Password" } })

                const loggedUser = { username: returnedUser.username, email: returnedUser.email }

                JWT.sign(loggedUser, 'privet-logged-user', (err, token) => {
                    res.json({
                        token
                    })
                })

            })
            .catch(error => {
                res.status(500).send('Database Error')
            })
    } catch (error) {
        res.send('user does not exist')
    }

})

app.post('/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        req.body.password = hashedPassword
        const { email, password, username } = req.body
        const sql = "INSERT INTO users(username , password , email) VALUES ($1, $2, $3);";
        const safeValues = [username, password, email]
        db.query(sql, safeValues)
            .then(() => {
                console.log('Inserted..')
                res.status(200).send('good')
            })
            .catch(error => {
                if (error.constraint === 'users_username_key')
                    res.send({
                        errors: {
                            username: 'Username already exist'
                        }
                    });
                else if (error.constraint === 'users_email_key')
                    res.send({
                        errors: {
                            email: 'Email already exist'
                        }
                    });

                else res.status(500).send('Unexpected Error!')
            })

    } catch (error) {
        res.status(500).send('Unexpected Error...!')
    }


})

async function isMovieExist(id, email) {
    try {
        const sql_isExist = 'select exists(select 1 from favorites where movie_id=$1 and email=$2);';
        const safeValue = [id, email]
        const result = await db.query(sql_isExist, safeValue)
        return result.rows[0].exists
    } catch (err) {
        console.log('err line 96', err)
    }
}

app.post('/save', async (req, res) => {
    const { filteredMovie, email } = req.body
    const {
        vote_count,
        overview,
        poster_path,
        release_date,
        title,
        id: movie_id,
        media_type
    } = filteredMovie
    try {
        const isExist = await isMovieExist(movie_id, email)
        if (!isExist) {
            const sql = "INSERT INTO favorites( vote_count,overview,poster_path,release_date,title,movie_id,media_type,email) VALUES ($1, $2,$3,$4,$5,$6,$7,$8);";
            const safeValues = [
                vote_count,
                overview,
                poster_path,
                release_date,
                title,
                movie_id,
                media_type,
                email
            ]
            db.query(sql, safeValues)
                .then(result => res.send('Added to collections'))
                .catch(err => {
                    res.send('Sorry, Movie was not saved due to internal error!')
                    console.log(err)
                })
        }
        if (isExist) return res.send('Movie already exist!')

    } catch (ex) {
        res.status(500).send(ex)
    }
})

async function getMoviesId(email) {
    try {
        const sql = 'SELECT movie_id FROM favorites WHERE email=$1;';
        const safeValue = [email]
        const data = await db.query(sql, safeValue)
        const ids = []
        data.rows.forEach(item => ids.push(item.movie_id))
        return ids

    } catch (err) {
        console.log('getMoviesId Error', err)
    }
}


app.post('/myCollections', async (req, res) => {
    const { email } = req.body
    const sql = 'SELECT vote_count,overview,poster_path,release_date,title,movie_id,media_type,email FROM favorites WHERE email=$1;';
    const safeValue = [email]
    db.query(sql, safeValue)
        .then(results => {
            res.send(results.rows);
        })
        .catch(err => console.log(err))
})

app.post('/deleteMovie/:id', (req, res) => {
    const { email } = req.body
    console.log(email)
    const id = req.params.id
    const sql = 'DELETE FROM favorites WHERE movie_id=$1 AND email=$2;';
    const safeValues = [id, email]
    db.query(sql, safeValues)
        .then(res.status(200).send('Movie deleted successfully'))
        .catch(err => res.status(500).send('Movie was not delete due to internal error'))
})



db.connect().then(() => {
    app.listen(PORT, () => { console.log(`Listing to Port ${PORT}`) })
    console.log('Connected to DB.')
})

