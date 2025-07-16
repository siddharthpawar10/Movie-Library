// OMDB API configuration
const API_KEY = 'a6cd49bc';
const BASE_URL = 'https://www.omdbapi.com';

let movies = [];
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let currentFilters = {
    genre: '',
    year: '',
    rating: ''
};

// List of popular movies to show on home screen
const popularMovies = [
    'The Shawshank Redemption',
    'The Godfather',
    'Inception',
    'Pulp Fiction',
    'The Dark Knight',
    'Fight Club',
    'Forrest Gump',
    'The Matrix',
    'Goodfellas',
    'Interstellar',
    'The Lord of the Rings',
    'Avatar'
];

// Fetch popular movies for home screen
async function fetchHomeScreenMovies() {
    try {
        const moviePromises = popularMovies.map(async (title) => {
            const response = await fetch(`${BASE_URL}/?apikey=${API_KEY}&t=${title}&type=movie`);
            const data = await response.json();
            if (data.Response === 'True') {
                return data;
            }
            return null;
        });

        const results = await Promise.all(moviePromises);
        movies = results.filter(movie => movie !== null);
        displayMovies(movies);
    } catch (error) {
        console.error('Error fetching home screen movies:', error);
    }
}

// Display movies in the grid
function displayMovies(moviesToShow) {
    const moviesGrid = document.getElementById('moviesGrid');
    moviesGrid.innerHTML = '';

    moviesToShow.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        const rating = movie.imdbRating ? `<p>Rating: ${movie.imdbRating}/10</p>` : '';
        const genre = movie.Genre ? `<p>Genre: ${movie.Genre}</p>` : '';
        
        movieCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450.png?text=No+Poster'}" alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <p>Year: ${movie.Year}</p>
                ${rating}
                ${genre}
                <button class="btn" onclick="toggleWatchlist('${movie.imdbID}')">
                    ${isInWatchlist(movie.imdbID) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
            </div>
        `;
        moviesGrid.appendChild(movieCard);
    });
}

// Search movies
async function searchMovies(query) {
    try {
        const response = await fetch(`${BASE_URL}/?apikey=${API_KEY}&s=${query}&type=movie`);
        const data = await response.json();
        if (data.Response === 'True') {
            const detailedMovies = await Promise.all(
                data.Search.map(async (movie) => {
                    const detailResponse = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${movie.imdbID}`);
                    return detailResponse.json();
                })
            );
            movies = detailedMovies.filter(movie => movie.Response === 'True');
            applyFilters();
        }
    } catch (error) {
        console.error('Error searching movies:', error);
    }
}

async function getMovieDetails(imdbID) {
    try {
        const response = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${imdbID}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}

async function applyFilters() {
    let filteredMovies = [...movies];
    
    // Apply genre filter
    if (currentFilters.genre) {
        filteredMovies = await Promise.all(
            filteredMovies.map(async (movie) => {
                const details = await getMovieDetails(movie.imdbID);
                return { ...movie, details };
            })
        );
        filteredMovies = filteredMovies.filter(movie => 
            movie.details && movie.details.Genre && 
            movie.details.Genre.includes(currentFilters.genre)
        );
    }

    // Apply year filter
    if (currentFilters.year) {
        const [endYear, startYear] = currentFilters.year.split('-');
        filteredMovies = filteredMovies.filter(movie => {
            const movieYear = parseInt(movie.Year);
            return movieYear >= parseInt(startYear) && movieYear <= parseInt(endYear);
        });
    }

    // Apply rating filter
    if (currentFilters.rating) {
        if (!filteredMovies[0].details) {
            filteredMovies = await Promise.all(
                filteredMovies.map(async (movie) => {
                    const details = await getMovieDetails(movie.imdbID);
                    return { ...movie, details };
                })
            );
        }
        filteredMovies = filteredMovies.filter(movie => 
            movie.details && 
            parseFloat(movie.details.imdbRating) >= parseFloat(currentFilters.rating)
        );
    }

    displayMovies(filteredMovies);
}

// Event listeners for filters
document.getElementById('genreFilter').addEventListener('change', (e) => {
    currentFilters.genre = e.target.value;
    applyFilters();
});

document.getElementById('yearFilter').addEventListener('change', (e) => {
    currentFilters.year = e.target.value;
    applyFilters();
});

document.getElementById('ratingFilter').addEventListener('change', (e) => {
    currentFilters.rating = e.target.value;
    applyFilters();
});

// Update display movies function to show more details
function displayMovies(moviesToShow) {
    const moviesGrid = document.getElementById('moviesGrid');
    moviesGrid.innerHTML = '';

    moviesToShow.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        const rating = movie.details ? `<p>Rating: ${movie.details.imdbRating}/10</p>` : '';
        const genre = movie.details ? `<p>Genre: ${movie.details.Genre}</p>` : '';
        
        movieCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450.png?text=No+Poster'}" alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <p>Year: ${movie.Year}</p>
                ${rating}
                ${genre}
                <button class="btn" onclick="toggleWatchlist('${movie.imdbID}')">
                    ${isInWatchlist(movie.imdbID) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
            </div>
        `;
        moviesGrid.appendChild(movieCard);
    });
}

// Watchlist functions
function isInWatchlist(movieId) {
    return watchlist.some(movie => movie.imdbID === movieId);
}

async function toggleWatchlist(movieId) {
    const movie = movies.find(m => m.imdbID === movieId);
    if (isInWatchlist(movieId)) {
        watchlist = watchlist.filter(m => m.imdbID !== movieId);
    } else {
        watchlist.push(movie);
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    displayMovies(movies);
    displayWatchlist();
}

function displayWatchlist() {
    const watchlistContainer = document.getElementById('watchlist');
    watchlistContainer.innerHTML = '';

    watchlist.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450.png?text=No+Poster'}" alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <p>Year: ${movie.Year}</p>
                <p>Type: ${movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1)}</p>
                <button class="btn" onclick="toggleWatchlist('${movie.imdbID}')">Remove</button>
            </div>
        `;
        watchlistContainer.appendChild(movieCard);
    });
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query) {
        searchMovies(query);
    } else {
        fetchHomeScreenMovies();
    }
});

// Initialize the app with home screen movies
document.addEventListener('DOMContentLoaded', () => {
    fetchHomeScreenMovies();
    displayWatchlist();
});
displayWatchlist();