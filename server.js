require('dotenv').config()
const express = require('express')
const ejsLayouts = require('express-ejs-layouts')
const app = express()
const axios = require('axios').default
const db = require('./models')

// Sets EJS as the view engine
app.set('view engine', 'ejs')
// Specifies the location of the static assets folder
app.use(express.static('static'))
// Sets up body-parser for parsing form data
app.use(express.urlencoded({ extended: false }))
// Enables EJS Layouts middleware
app.use(ejsLayouts)

// Adds some logging to each request
app.use(require('morgan')('dev'))

// Routes
app.get('/', (req, res) => {
    res.render('index')
})

app.get('/results', (req, res) => {
    const query = req.query.q
    axios
        .get(`https://www.omdbapi.com/?apikey=${process.env.API_KEY}&s=${query}`)
        .then(response => {
            const title = `${response.data.Search.length} Matches for '${query}'`
            res.render('results', { title, results: response.data.Search })
        })
        .catch(error => {
            res.send(error = 'Search could not be completed')
        })
})

app.get('/movies/:movie_id', (req, res) => {
    const movieid = req.params.movie_id
    axios
        .get(`https://www.omdbapi.com/?apikey=${process.env.API_KEY}&i=${movieid}`)
        .then(response => {
            const title = `Movie Details: ${movieid}`
            res.render('detail', { title, details: response.data })
        })
        .catch(error => {
            res.send(error = 'Problem with link')
        })
})

app.get('/faves', (req, res) => {
    db.fave
        .findAll()
        .then(allFaves => {
            const movies = []
            allFaves.forEach(fave => {
                const movie = fave.get()
                const movieid = movie.imdbid
                movies.push(axios
                    .get(`https://www.omdbapi.com/?apikey=${process.env.API_KEY}&i=${movieid}`)
                )
            })
            Promise.all(movies)
            .then(faves => {
                res.render('faves', { faves })
            })
            .catch(error => {
                res.send(error = 'Problem with faves')
            })
        })
        .catch(error => {
            res.send(error = 'Problem with faves')
        })
})

app.post('/faves', (req, res) => {
    const formTitle = req.body.title
    const formID = req.body.imdbid
    db.fave
        .create({
            title: formTitle,
            imdbid: formID,
        }).then(createdFave => {
            res.redirect('/faves')
        })
        .catch(error => {
            res.send(error = 'Problem with faves')
        })
})

// The app.listen function returns a server handle
var server = app.listen(process.env.PORT || 3000)

// We can export this server to other servers like this
module.exports = server