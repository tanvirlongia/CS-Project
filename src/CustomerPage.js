import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CustomersPage = () => {
    const [customerList, setCustomerList] = useState([]);
    const [filteredList, setFilteredList] = useState([]); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); 
    const [totalRecords, setTotalRecords] = useState(0);
    const [errorMessage, setErrorMessage] = useState(''); 
    const [customerId, setCustomerId] = useState(''); 

    const fetchCustomerList = useCallback(async (pageNumber = 1) => {
        try {
            const response = await axios.get('http://localhost:5000/customers', {
                params: {
                    page: pageNumber,
                    per_page: itemsPerPage
                }
            });
            setCustomerList(response.data.customers);
            setTotalRecords(response.data.total_customers);
            setErrorMessage(''); 
        } catch (error) {
            console.error('Error fetching customers:', error);
            setErrorMessage('Unable to fetch customers. Please try again later.'); 
        }
    }, [itemsPerPage]);

    useEffect(() => {
        fetchCustomerList(currentPage);
    }, [currentPage, fetchCustomerList]);

    const search = () => {
        if (customerId) {
            const foundCustomer = customerList.find(customer => customer.customer_id === Number(customerId));
            setFilteredList(foundCustomer ? [foundCustomer] : []); 
        } else {
            setFilteredList(customerList); 
        }
    };

    const totalPages = Math.ceil(totalRecords / itemsPerPage);

    return (
        <div>
            <h1>Customer List</h1>
            {errorMessage ? (
                <p style={{ color: 'red' }}>{errorMessage}</p> 
            ) : (
                <div>
                    <div>
                        <input
                            type="number"
                            placeholder="Enter Customer ID"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)} 
                            style={{ padding: '10px', margin: '10px 0' }}
                        />
                        <button onClick={search} style={buttonStyle}>Search</button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr>
                                <th style={headerStyle}>Customer ID</th>
                                <th style={headerStyle}>First Name</th>
                                <th style={headerStyle}>Last Name</th>
                                <th style={headerStyle}>Email</th>
                                <th style={headerStyle}>Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(filteredList.length > 0 ? filteredList : customerList).map((customer) => (
                                <tr key={customer.customer_id} style={rowStyle}>
                                    <td style={cellStyle}>{customer.customer_id}</td>
                                    <td style={cellStyle}>{customer.first_name}</td>
                                    <td style={cellStyle}>{customer.last_name}</td>
                                    <td style={cellStyle}>{customer.email}</td>
                                    <td style={cellStyle}>{customer.active ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredList.length === 0 && customerList.length === 0 && <p>No customers found.</p>}

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={buttonStyle}
                        >
                            Previous
                        </button>
                        <span style={{ margin: '0 10px' }}> Page {currentPage} of {totalPages} </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={buttonStyle}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
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

export default CustomersPage;
