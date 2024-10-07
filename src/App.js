import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import FilmsPage from './FilmsPage';
import CustomerPage from './CustomerPage';

function App() {
    return (
        <Router>
            <div className="App" style={appContainerStyle}>
                <nav style={navStyle}>
                    <ul style={navListStyle}>
                        <li style={navItemStyle}>
                            <Link to="/landing" style={linkStyle}>Landing Page</Link>
                        </li>
                        <li style={navItemStyle}>
                            <Link to="/films" style={linkStyle}>Films Page</Link>
                        </li>
                        <li style={navItemStyle}>
                            <Link to="/customer" style={linkStyle}>Customer Page</Link>
                        </li>
                    </ul>
                </nav>

                <Routes>
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/films" element={<FilmsPage />} />
                    <Route path="/customer" element={<CustomerPage />} />
                    <Route path="/" element={<Navigate to="/landing" />} />
                </Routes>
            </div>
        </Router>
    );
}

const appContainerStyle = {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    padding: '20px'
};

const navStyle = {
    marginBottom: '20px',
    backgroundColor: '#3448ad',
    padding: '10px',
    borderRadius: '5px'
};

const navListStyle = {
    listStyleType: 'none',
    display: 'flex',
    justifyContent: 'center',
    padding: 0,
};

const navItemStyle = {
    margin: '0 15px',
};

const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '18px'
};

export default App;
