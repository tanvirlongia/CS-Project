import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CustomersPage = () => {
    const [customerList, setCustomerList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', email: '', active: true });
    const [editingCustomerId, setEditingCustomerId] = useState(null);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [rentalHistory, setRentalHistory] = useState([]);
    const [showRentalModal, setShowRentalModal] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [isViewingRentalDetails, setIsViewingRentalDetails] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchCustomerList = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/customers', {
                params: {
                    page: 1, 
                    per_page: 1000 
                }
            });
            setCustomerList(response.data.customers);
            setTotalRecords(response.data.total_customers);
            setFilteredList(response.data.customers); 
            setErrorMessage('');
        } catch (error) {
            console.error('Error fetching customers:', error);
            setErrorMessage('Unable to fetch customers. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomerList();
    }, [fetchCustomerList]);

    const search = () => {
        if (!searchTerm) {
            setFilteredList(customerList);
            return;
        }

        const lowercasedTerm = searchTerm.toLowerCase();
        const filteredCustomers = customerList.filter(customer =>
            customer.customer_id.toString() === lowercasedTerm || 
            customer.first_name.toLowerCase() === lowercasedTerm || 
            customer.last_name.toLowerCase() === lowercasedTerm
        );

        setFilteredList(filteredCustomers);
    };

    const clearSearch = () => {
        setSearchTerm(''); 
        setFilteredList(customerList); 
    };

    const handleAddCustomer = async () => {
        if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
            setErrorMessage("Please fill out all required fields.");
            return;
        }
    
        try {
            const response = await axios.post('http://localhost:5000/add-customers', {
                first_name: newCustomer.firstName,
                last_name: newCustomer.lastName,
                email: newCustomer.email,
                active: newCustomer.active,
            });
    
            if (response.data.failure === 1) {
                setErrorMessage(response.data.message);
                return;
            }
    
            setShowModal(false);
            fetchCustomerList(); 
            setNewCustomer({ firstName: '', lastName: '', email: '', active: true }); 
            setErrorMessage('');
        } catch (error) {
            console.error('Error adding customer:', error);
            setErrorMessage('Unable to add customer. Please try again.');
            fetchCustomerList();
        }
    };
    
    const handleEditCustomer = async () => {
        if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
            setErrorMessage("Please fill out all required fields.");
            return;
        }
    
        try {
            await axios.put(`http://localhost:5000/edit-customer/${editingCustomerId}`, {
                first_name: newCustomer.firstName,
                last_name: newCustomer.lastName,
                email: newCustomer.email,
                active: newCustomer.active,
            });
            setShowModal(false);
            fetchCustomerList(); 
            setNewCustomer({ firstName: '', lastName: '', email: '', active: true }); 
            setEditingCustomerId(null); 
            setErrorMessage('');
        } catch (error) {
            console.error('Error editing customer:', error);
            setErrorMessage('Unable to edit customer. Please try again.');
        }
    };
    
    const handleDelete = async (customerId) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            try {
                const response = await fetch(`http://localhost:5000/delete-customer/${customerId}`, {
                    method: 'DELETE'
                });
    
                if (response.ok) {
                    setDeleteMessage("Customer deleted successfully.");
                    fetchCustomerList();
                } else {
                    const errorData = await response.json();
                    setDeleteMessage(`Error: ${errorData.error}`);
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
                setDeleteMessage('Unable to delete customer. Please try again.');
            }
        }
    };
    
    const handleRentalDetails = async (customerId) => {
        setIsViewingRentalDetails(true);
        setIsLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/customer/${customerId}/rental-history`);
            setRentalHistory(response.data.rental_history);
            setSelectedCustomerId(customerId);
            setShowRentalModal(true); 
        } catch (error) {
            console.error('Error fetching rental history:', error);
            setErrorMessage('Unable to fetch rental history.');
        }
    };

    const markReturned = async (rentalId) => {
        try {
            const response = await axios.put(`http://localhost:5000/mark-returned/${rentalId}`);
            setSuccessMessage(response.data.message);

            if (selectedCustomerId) {
                await fetchRentalHistory(selectedCustomerId);
            }
        } catch (error) {
            setErrorMessage('Failed to mark as returned. Please try again.');
        }
    };

    const fetchRentalHistory = async (customerId) => {
        try {
            const response = await axios.get(`http://localhost:5000/customer/${customerId}/rental-history`);
            setRentalHistory(response.data.rental_history);
        } catch (error) {
            console.error('Error fetching rental history:', error);
            setErrorMessage('Failed to fetch rental history.');
        }
    };

    useEffect(() => {
        if (selectedCustomerId) {
            fetchRentalHistory(selectedCustomerId);
        }
    }, [selectedCustomerId]);


    const closeRentalModal = () => {
        setShowRentalModal(false);
        setRentalHistory([]);
        setSelectedCustomerId(null);
        setIsViewingRentalDetails(false);
        fetchCustomerList();
    };

    const openEditModal = (customer) => {
        setNewCustomer({
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            active: customer.active,
        });
        setEditingCustomerId(customer.customer_id); 
        setShowModal(true); 
    };

    const closeModal = () => {
        setNewCustomer({ firstName: '', lastName: '', email: '', active: true }); 
        setEditingCustomerId(null); 
        setShowModal(false); 
    };

    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const displayedCustomers = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div>
            <h1>Customer List</h1>
            {errorMessage ? (
                <p style={{ color: 'red' }}>{errorMessage}</p>
            ) : (
                <div>
                    <div>
                        <input
                            type="text"
                            placeholder="Search by Customer ID, First Name, or Last Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px', margin: '10px 0' }}
                        />
                        <button onClick={search} style={buttonStyle}>Search</button>
                        <button onClick={clearSearch} style={buttonStyle}>Clear</button>
                        <button onClick={() => setShowModal(true)} style={buttonStyle}>Add Customer</button>
                    </div>
    
                    {isLoading ? (
                        <p></p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead>
                                <tr>
                                    <th style={headerStyle}>Customer ID</th>
                                    <th style={headerStyle}>First Name</th>
                                    <th style={headerStyle}>Last Name</th>
                                    <th style={headerStyle}>Email</th>
                                    <th style={headerStyle}>Active</th>
                                    <th style={headerStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedCustomers.map((customer) => (
                                    <tr key={customer.customer_id} style={rowStyle}>
                                        <td style={cellStyle}>{customer.customer_id}</td>
                                        <td style={cellStyle}>{customer.first_name}</td>
                                        <td style={cellStyle}>{customer.last_name}</td>
                                        <td style={cellStyle}>{customer.email}</td>
                                        <td style={cellStyle}>{customer.active ? 'Yes' : 'No'}</td>
                                        <td style={cellStyle}>
                                            <button onClick={() => openEditModal(customer)} style={buttonStyle}>Edit</button>
                                            <button onClick={() => handleDelete(customer.customer_id)} style={buttonStyle}>Delete</button>
                                            <button onClick={() => handleRentalDetails(customer.customer_id)} style={buttonStyle}>Details</button> 
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
    
                    {filteredList.length === 0 && customerList.length === 0 && <p>No customers found.</p>}
    
                    {!isViewingRentalDetails && (
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
                    )}
    
                    {showModal && (
                        <div style={modalOverlayStyle}>
                            <div style={modalStyle}>
                                <h2>{editingCustomerId ? 'Edit Customer' : 'Add New Customer'}</h2>
                                <form>
                                    <label style={labelStyle}>
                                        First Name:
                                        <input
                                            type="text"
                                            value={newCustomer.firstName}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </label>
                                    <label style={labelStyle}>
                                        Last Name:
                                        <input
                                            type="text"
                                            value={newCustomer.lastName}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </label>
                                    <label style={labelStyle}>
                                        Email:
                                        <input
                                            type="email"
                                            value={newCustomer.email}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </label>
                                    <label style={labelStyle}>
                                        Active:
                                        <select
                                            value={newCustomer.active}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, active: e.target.value === 'true' })}
                                            style={inputStyle}
                                        >
                                            <option value={true}>Yes</option>
                                            <option value={false}>No</option>
                                        </select>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={editingCustomerId ? handleEditCustomer : handleAddCustomer}
                                        style={buttonStyle}
                                    >
                                        {editingCustomerId ? 'Save Changes' : 'Add Customer'}
                                    </button>
                                    <button type="button" onClick={closeModal} style={buttonStyle}>Cancel</button>
                                </form>
                            </div>
                        </div>
                    )}
                    {deleteMessage && <p style={{ color: 'red' }}>{deleteMessage}</p>} 

                    {showRentalModal && (
                        <div className="modal">
                            <div className="modal-content">
                                <h3>Rental History for Customer {selectedCustomerId}</h3>
                                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                                {rentalHistory.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                        <thead>
                                            <tr style={rowStyle}>
                                                <th style={headerStyle}>Rental ID</th>
                                                <th style={headerStyle}>Movie Title</th>
                                                <th style={headerStyle}>Rental Date</th>
                                                <th style={headerStyle}>Return Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rentalHistory.map((rental) => (
                                                <tr key={rental[0]}>
                                                    <td style={cellStyle}>{rental[0]}</td>
                                                    <td style={cellStyle}>{rental[1]}</td>
                                                    <td style={cellStyle}>{rental[2]}</td>
                                                    <td style={cellStyle}>{rental[3] ? rental[3] : 
                                                        <button
                                                            onClick={() => markReturned(rental[0])}
                                                            style={buttonStyle}
                                                        >
                                                            Mark as Returned
                                                        </button>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No rental history available for this customer.</p>
                                )}
                                <button onClick={closeRentalModal} style={buttonStyle}>Close</button>                        
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
};

const headerStyle = {
    padding: '10px',
    border: '1px solid black',
    backgroundColor: '#f2f2f2',
};

const rowStyle = {
    padding: '10px',
    borderBottom: '1px solid black',
};

const cellStyle = {
    padding: '10px',
    border: '1px solid black',
};

const labelStyle = {
    display: 'block',
    marginBottom: '10px',
};

const inputStyle = {
    width: '100%',
    padding: '8px',
    margin: '4px 0',
    display: 'inline-block',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const modalStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    width: '400px',
    textAlign: 'center',
};

export default CustomersPage;
