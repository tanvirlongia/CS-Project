import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

const LandingPage = () => {
    const [films, setFilms] = useState([]);
    const [currentFilm, setCurrentFilm] = useState(null);
    const [actorFilm, setActorFilm] = useState(null);
    const [actors, setActors] = useState([]);
    const [actorMovies, setActorMovies] = useState([]);
    const [actorFullName, setActorFullName] = useState('');
    const [filmPopup, setFilmPopup] = useState(false);
    const [actorPopup, setActorPopup] = useState(false);
    const [actorDetailsPopup, setActorDetailsPopup] = useState(false);
    const [actorDetails, setActorDetails] = useState(null);

    const [filmFetchError, setFilmFetchError] = useState('');
    const [actorFetchError, setActorFetchError] = useState('');
    const [actorMoviesFetchError, setActorMoviesFetchError] = useState('');
    const [filmDetailFetchError, setFilmDetailFetchError] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/top-rented-films')
            .then(response => {
                setFilms(response.data);
                setFilmFetchError('');
            })
            .catch(error => {
                console.error('Error fetching films:', error);
                setFilmFetchError('Failed to load films. Try again later.');
            });
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/actors-film-count')
            .then(response => {
                const actorList = response.data.slice(0, 5);
                setActors(actorList);
                setActorFetchError('');
            })
            .catch(error => {
                console.error('Error fetching actors:', error);
                setActorFetchError('Failed to load actors. Try again later.');
            });
    }, []);
    

    const getFilmDetails = async (filmId) => {
        try {
            const response = await axios.get(`http://localhost:5000/films-details/${filmId}`);
            if (response.data) {
                setCurrentFilm(response.data);
                setFilmPopup(true);
                setFilmDetailFetchError('');
            }
        } catch (error) {
            console.error('Error fetching film details:', error);
            setFilmDetailFetchError('Failed to load film details. Try again later.');
        }
    };

    const getActorDetails = async (actorId) => {
        try {
            const response = await axios.get(`http://localhost:5000/actor-details/${actorId}`);
            setActorDetails(response.data);
            setActorDetailsPopup(true);
        } catch (error) {
            console.error('Error fetching actor details:', error);
            setActorDetailsPopup(false);
        }
    };
    

    const getActorMovies = async (actorId, firstName, lastName) => {
        try {
            const response = await axios.get(`http://localhost:5000/top-actor-top-films/${actorId}`);
            setActorMovies(response.data);
            setActorPopup(true);
            setActorFullName(`${firstName} ${lastName}`);
            setActorMoviesFetchError('');
        } catch (error) {
            console.error('Error fetching actor films:', error);
            setActorMoviesFetchError('Failed to load actor films. Try again later.');
        }
    };

    const getFilmDetailsForActor = async (filmId) => {
        try {
            const response = await axios.get(`http://localhost:5000/films-details/${filmId}`);
            if (response.data) {
                setActorFilm(response.data);
                setActorPopup(true);
            }
        } catch (error) {
            console.error('Error fetching film details:', error);
        }
    };

    
    const closeActorPopup = () => {
        setActorPopup(false);
        setActorFilm(null);
    };

    const closeActorDetailsPopup = () => {
        setActorDetailsPopup(false);
        setActorDetails(null);
    };

    return (
        <div style={containerStyle}>
            <h1 style={headerStyle}>Top 5 Rented Films of All Time</h1>
            {filmFetchError && <p style={{ color: 'red' }}>{filmFetchError}</p>}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Title</th>
                        <th>Rentals</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {films.map((film, index) => (
                        <tr key={film[0]}>
                            <td>{index + 1}</td>
                            <td>{film[1]}</td>
                            <td>{film[3]}</td>
                            <td>
                                <button style={buttonStyle} onClick={() => getFilmDetails(film[0])}>
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Popup open={filmPopup} onClose={() => setFilmPopup(false)} modal closeOnDocumentClick>
                {filmDetailFetchError ? (
                    <p style={{ color: 'red' }}>{filmDetailFetchError}</p>
                ) : currentFilm && (
                    <div>
                        <h2>Film Details</h2>
                        <p><strong>Title:</strong> {currentFilm.title}</p>
                        <p><strong>Description:</strong> {currentFilm.description}</p>
                        <p><strong>Film ID:</strong> {currentFilm.film_id}</p>
                        <p><strong>Language ID:</strong> {currentFilm.language_id}</p>
                        <p><strong>Original Language ID:</strong> {currentFilm.original_language_id || 'N/A'}</p>
                        <p><strong>Release Year:</strong> {currentFilm.release_year}</p>
                        <p><strong>Rental Duration (days):</strong> {currentFilm.rental_duration}</p>
                        <p><strong>Rental Rate:</strong> ${currentFilm.rental_rate}</p>
                        <p><strong>Length (minutes):</strong> {currentFilm.length}</p>
                        <p><strong>Replacement Cost:</strong> ${currentFilm.replacement_cost}</p>
                        <p><strong>Rating:</strong> {currentFilm.rating}</p>
                        <p><strong>Special Features:</strong> {currentFilm.special_features}</p>
                        <p><strong>Last Update:</strong> {new Date(currentFilm.last_update).toLocaleString()}</p>
                    </div>
                )}
            </Popup>

            <h1 style={headerStyle}>Top 5 Actors in Films Available in Store</h1>
            {actorFetchError && <p style={{ color: 'red' }}>{actorFetchError}</p>}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Actor</th>
                        <th>Rentals</th>
                        <th>Actor Details</th>
                        <th>Films</th>
                    </tr>
                </thead>
                <tbody>
                    {actors.map((actor, index) => (
                        <tr key={actor[0]}>
                            <td>{index + 1}</td>
                            <td>{actor[1]} {actor[2]}</td>
                            <td>{actor[3]}</td>
                            <td>
                                <button style={buttonStyle} onClick={() => getActorDetails(actor[0])}>
                                    View Details
                                </button>
                            </td>
                            <td>
                                <button style={buttonStyle} onClick={() => {
                                    setActorMovies([]);
                                    getActorMovies(actor[0], actor[1], actor[2]);
                                }}>
                                    View Films
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Popup open={actorDetailsPopup} onClose={closeActorDetailsPopup} modal closeOnDocumentClick>
                {actorDetails ? (
                    <div>
                        <h2>Actor Details</h2>
                        <p><strong>Actor ID:</strong> {actorDetails.actor_id}</p>
                        <p><strong>First Name:</strong> {actorDetails.first_name}</p>
                        <p><strong>Last Name:</strong> {actorDetails.last_name}</p>
                        <p><strong>Last Update:</strong> {new Date(actorDetails.last_update).toLocaleString()}</p>
                    </div>
                ) : (
                    <p style={{ color: 'red' }}>Failed to load actor details. Try again later.</p>
                )}
            </Popup>


            <Popup open={actorPopup} onClose={closeActorPopup} modal closeOnDocumentClick>
                {actorMoviesFetchError ? (
                    <p style={{ color: 'red' }}>{actorMoviesFetchError}</p>
                ) : actorMovies.length > 0 && (
                    <div>
                        <h3>Top 5 Rented Films for {actorFullName}:</h3>
                        <ul>
                            {actorMovies.map((film, index) => (
                                <li key={film.film_id}>
                                    <button onClick={() => {
                                        setActorFilm(null);
                                        getFilmDetailsForActor(film.film_id);
                                    }}>
                                        {index + 1}. {film.title} - Rentals: {film.rented}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {actorFilm && (
                            <div>
                                <h2>Film Details</h2>
                                <p><strong>Title:</strong> {actorFilm.title}</p>
                                <p><strong>Description:</strong> {actorFilm.description}</p>
                                <p><strong>Film ID:</strong> {actorFilm.film_id}</p>
                                <p><strong>Language ID:</strong> {actorFilm.language_id}</p>
                                <p><strong>Original Language ID:</strong> {actorFilm.original_language_id || 'N/A'}</p>
                                <p><strong>Release Year:</strong> {actorFilm.release_year}</p>
                                <p><strong>Rental Duration (days):</strong> {actorFilm.rental_duration}</p>
                                <p><strong>Rental Rate:</strong> ${actorFilm.rental_rate}</p>
                                <p><strong>Length (minutes):</strong> {actorFilm.length}</p>
                                <p><strong>Replacement Cost:</strong> ${actorFilm.replacement_cost}</p>
                                <p><strong>Rating:</strong> {actorFilm.rating}</p>
                                <p><strong>Special Features:</strong> {actorFilm.special_features}</p>
                                <p><strong>Last Update:</strong> {new Date(actorFilm.last_update).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                )}
            </Popup>
        </div>
    );
};

const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '20px'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
};

const buttonStyle = {
    padding: '5px 10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
};

export default LandingPage;
