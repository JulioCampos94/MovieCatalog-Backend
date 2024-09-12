const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:4200' 
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://localhost:27017/movie-catalog')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const movieSchema = new mongoose.Schema({
  title: String,
  actors: String,
  image: String,
  synopshis: String,
  categories: [String]
});

const Movie = mongoose.model('Movie', movieSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving movies', error: err.message });
  }
});

app.get('/movies/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title).toLowerCase();
    const movie = await Movie.findOne({ title: new RegExp('^' + title + '$', 'i') });
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving movie', error: err.message });
  }
});

app.post('/movies', async (req, res) => {
  try {
    const { title, actors, synopshis, image, categories } = req.body;
    
    const newMovie = new Movie({ title, actors, image, synopshis, categories });
    await newMovie.save();
    
    res.status(201).json(newMovie);
  } catch (err) {
    res.status(500).json({ message: 'Error adding movie', error: err.message });
  }
});

app.put('/movies/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title).toLowerCase();
    const { title: newTitle, actors, image, synopshis, categories } = req.body;

    const updatedMovie = await Movie.findOneAndUpdate(
      { title: new RegExp('^' + title + '$', 'i') }, 
      { title: newTitle, actors, image, synopshis, categories }, 
      { new: true }
    );
    
    if (updatedMovie) {
      res.json(updatedMovie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating movie', error: err.message });
  }
});



app.delete('/movies/:title', async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title).toLowerCase();

    const result = await Movie.deleteOne({ title: new RegExp('^' + title + '$', 'i') });
    if (result.deletedCount > 0) {
      res.json({ message: 'Movie deleted' });
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting movie', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
