import React, { useState } from 'react';
import axios from 'axios';
import Popup from 'reactjs-popup';

const FilmsPage = () => {
    const [filterType, setFilterType] = useState('title');
    const [query, setQuery] = useState('');
    const [filmList, setFilmList] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [currentFilm, setCurrentFilm] = useState(null);
    const [detailsError, setDetailsError] = useState('');

    const search = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/search-film/${filterType}/${query}`);
            setFilmList(response.data);
            setErrorMessage('');
        } catch (err) {
            setErrorMessage('Failed to fetch films. Please try again.');
        }
    };

    const viewDetails = (film) => {
        setCurrentFilm(film);
        setIsPopupOpen(true);
        setDetailsError('');
    };

    return (
        <div>
            <h2>Search Films</h2>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="filterType">Search by: </label>
                <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ marginLeft: '10px', padding: '5px' }}
                >
                    <option value="title">Title</option>
                    <option value="actor">Actor</option>
                    <option value="genre">Genre</option>
                </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="query">Search Term: </label>
                <input
                    type="text"
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: '5px', marginLeft: '10px' }}
                />
                <button onClick={search} style={buttonStyle}>Search</button>
            </div>

            <div>
                <h3>Search Results</h3>
                {filmList.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr>
                                <th style={headerStyle}>Film ID</th>
                                <th style={headerStyle}>Title</th>
                                {filterType === 'actor' && <th style={headerStyle}>Actor Name</th>}
                                {filterType === 'genre' && <th style={headerStyle}>Genre</th>}
                                {filterType === 'title' && <th style={headerStyle}>Description</th>}
                                <th style={headerStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filmList.map((film) => (
                                <tr key={film.film_id} style={rowStyle}>
                                    <td style={cellStyle}>{film.film_id}</td>
                                    <td style={cellStyle}>{film.title}</td>
                                    {filterType === 'actor' && <td style={cellStyle}>{film.actor_name}</td>}
                                    {filterType === 'genre' && <td style={cellStyle}>{film.genre}</td>}
                                    {filterType === 'title' && <td style={cellStyle}>{film.description}</td>}
                                    <td style={cellStyle}>
                                        <button 
                                            onClick={() => viewDetails(film)} 
                                            style={buttonStyle}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No films found.</p>
                )}
            </div>

            <Popup open={isPopupOpen} onClose={() => setIsPopupOpen(false)} modal closeOnDocumentClick>
                {detailsError ? (
                    <p style={{ color: 'red' }}>{detailsError}</p>
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
        </div>
    );
};

const headerStyle = {
    backgroundColor: '#3448ad',
    color: 'white',
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd'
};

const rowStyle = {
    backgroundColor: '#f2f2f2',
    borderBottom: '1px solid #ddd'
};

const cellStyle = {
    padding: '10px',
    textAlign: 'left'
};

const buttonStyle = {
    padding: '10px 15px',
    marginLeft: '10px',
    backgroundColor: '#3448ad',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
};

export default FilmsPage;
