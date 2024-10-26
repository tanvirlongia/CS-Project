from flask import Flask, jsonify, request
from flask_cors import CORS
import MySQLdb

app = Flask(__name__)

CORS(app)

db_config = {
    "host": "localhost",
    "user": "root",
    "passwd": "cs490",
    "db": "sakila"
}

def get_db_connection():
    return MySQLdb.connect(**db_config)

@app.route('/films', methods=['GET'])
def get_films():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.film_id, a.title, b.category_id, b.name
        FROM film a
        JOIN film_category c ON a.film_id = c.film_id
        JOIN category b ON c.category_id = b.category_id
    """)
    films = cursor.fetchall()
    conn.close()
    return jsonify(films)

@app.route('/films-details/<int:film_id>', methods=['GET'])
def get_film_details(film_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM film WHERE film_id = %s", (film_id,))
    film = cursor.fetchone()
    conn.close()

    if film:
        columns = [desc[0] for desc in cursor.description]
        film_details = dict(zip(columns, film))
        return jsonify(film_details)
    else:
        return jsonify({"error": "Film not found"}), 404

@app.route('/actor-details/<int:actor_id>', methods=['GET'])
def get_actor_details(actor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM actor WHERE actor_id = %s", (actor_id,))
    actor = cursor.fetchone()
    conn.close()

    if actor:
        columns = [desc[0] for desc in cursor.description]
        actor_details = dict(zip(columns, actor))
        return jsonify(actor_details)
    else:
        return jsonify({"error": "Actor not found"}), 404

@app.route('/film-count-by-category', methods=['GET'])
def get_film_count_by_category():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.name, COUNT(a.film_id)
        FROM film a
        JOIN film_category c ON a.film_id = c.film_id
        JOIN category b ON c.category_id = b.category_id
        GROUP BY b.name
    """)
    film_counts = cursor.fetchall()
    conn.close()
    return jsonify(film_counts)

@app.route('/actors-film-count', methods=['GET'])
def get_actors_film_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.actor_id, a.first_name, a.last_name, COUNT(b.actor_id) as movies
        FROM actor a
        JOIN film_actor b ON a.actor_id = b.actor_id
        GROUP BY a.actor_id
        ORDER BY movies DESC
    """)
    actors = cursor.fetchall()
    conn.close()
    return jsonify(actors)

@app.route('/store-film-copies', methods=['GET'])
def get_store_film_copies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.store_id, b.film_id, COUNT(a.inventory_id) as DVD
        FROM inventory a
        JOIN film b ON a.film_id = b.film_id
        GROUP BY a.store_id, b.film_id
        ORDER BY store_id
    """)
    copies = cursor.fetchall()
    conn.close()
    return jsonify(copies)

@app.route('/rented-out-dvds', methods=['GET'])
def get_rented_out_dvds():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rental WHERE return_date IS NULL")
    rented_out = cursor.fetchall()
    conn.close()
    return jsonify(rented_out)

@app.route('/top-rented-films', methods=['GET'])
def get_top_rented_films():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.film_id, a.title, b.name as category, COUNT(r.rental_id) as rented
        FROM rental r
        JOIN inventory d ON r.inventory_id = d.inventory_id
        JOIN film a ON d.film_id = a.film_id
        JOIN film_category c ON a.film_id = c.film_id
        JOIN category b ON c.category_id = b.category_id
        GROUP BY a.film_id, a.title, b.name
        ORDER BY rented DESC
        LIMIT 5
    """)
    top_rented = cursor.fetchall()
    conn.close()
    return jsonify(top_rented)

@app.route('/top-actor-top-films/<int:actor_id>', methods=['GET'])
def get_top_actor_top_films(actor_id):
    if not actor_id:
        return jsonify({"error": "actor_id is required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.film_id, a.title, b.name as category, COUNT(r.rental_id) as rented
        FROM rental r
        JOIN inventory d ON r.inventory_id = d.inventory_id
        JOIN film a ON d.film_id = a.film_id
        JOIN film_category c ON a.film_id = c.film_id
        JOIN category b ON c.category_id = b.category_id
        JOIN film_actor e ON a.film_id = e.film_id
        JOIN actor f ON e.actor_id = f.actor_id
        WHERE f.actor_id = %s
        GROUP BY a.film_id, a.title, b.name
        ORDER BY rented DESC
        LIMIT 5
    """, (actor_id,))
    
    columns = [desc[0] for desc in cursor.description]
    actor_films = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return jsonify(actor_films)

@app.route('/customer-rental-count', methods=['GET'])
def get_customer_rental_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.customer_id, a.first_name, a.last_name, COUNT(b.rental_id) as count
        FROM customer a
        JOIN rental b ON a.customer_id = b.customer_id
        GROUP BY a.customer_id
        ORDER BY count DESC
    """)
    rentals = cursor.fetchall()
    conn.close()
    return jsonify(rentals)


@app.route('/search-film/<string:search_type>/<string:search_term>', methods=['GET'])
def search_film(search_type, search_term):
    conn = get_db_connection()
    cursor = conn.cursor()

    if search_type == 'title':
        query = f"""
            SELECT f.film_id, f.title, f.description,
                COUNT(i.inventory_id) AS available_copies
            FROM film f
            JOIN inventory i ON f.film_id = i.film_id
            LEFT JOIN rental r ON i.inventory_id = r.inventory_id 
                                AND r.return_date IS NULL
            WHERE r.rental_id IS NULL AND LOWER(f.title) LIKE LOWER(%s) 
            GROUP BY f.film_id
        """
        cursor.execute(query, (f'%{search_term}%',))
        
    elif search_type == 'actor':
        name_parts = search_term.split()
        if len(name_parts) == 2:
            first_name, last_name = name_parts
            query = f"""
                SELECT f.film_id, f.title, CONCAT(a.first_name, ' ', a.last_name) as actor_name,
                    COUNT(CASE WHEN r.rental_id IS NULL THEN i.inventory_id END) AS available_copies
                FROM film f
                JOIN inventory i ON f.film_id = i.film_id
                LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
                JOIN film_actor fa ON f.film_id = fa.film_id
                JOIN actor a ON fa.actor_id = a.actor_id
                WHERE LOWER(a.first_name) LIKE LOWER(%s) 
                AND LOWER(a.last_name) LIKE LOWER(%s)
                GROUP BY f.film_id, a.first_name, a.last_name;
            """
            cursor.execute(query, (f'%{first_name}%', f'%{last_name}%'))
        else:
            return jsonify({"error": "Please provide both first and last names."}), 400
        
    elif search_type == 'genre':
        query = f"""
                SELECT f.film_id, f.title, c.name AS genre,
                    COUNT(CASE WHEN r.rental_id IS NULL THEN i.inventory_id END) AS available_copies
                FROM film f
                JOIN inventory i ON f.film_id = i.film_id
                LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
                JOIN film_category fc ON f.film_id = fc.film_id
                JOIN category c ON fc.category_id = c.category_id
                WHERE LOWER(c.name) LIKE LOWER(%s)
                GROUP BY f.film_id, f.title, c.name;
        """
        cursor.execute(query, (f'%{search_term}%',))
        
    else:
        return jsonify({"error": "Invalid search type."}), 400
    
    films = cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    result = [dict(zip(columns, row)) for row in films]
    conn.close()
    return jsonify(result)

@app.route('/customers', methods=['GET'])
def get_customers():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT customer_id, first_name, last_name, email, active, create_date
            FROM customer
            ORDER BY customer_id
            LIMIT %s OFFSET %s
        """, (per_page, offset))

        customers = cursor.fetchall()
        cursor.close()

        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM customer")
        total_customers = cursor.fetchone()[0]
        conn.close()

        return jsonify({
            "customers": [{
                "customer_id": c[0],
                "first_name": c[1],
                "last_name": c[2],
                "email": c[3],
                "active": c[4],
                "create_date": c[5]
            } for c in customers],
            "total_customers": total_customers,
            "page": page,
            "per_page": per_page
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/add-customers', methods=['POST'])
def add_customers():
        conn = get_db_connection()
        cursor = conn.cursor()
        
        data = request.get_json()
        
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        active = data.get('active')

        cursor.execute(f"""
            INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, create_date)
            VALUES ('1', '{first_name}', '{last_name}', '{email}', '5', {active}, current_timestamp)
        """)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"failure": 0, "message": "Customer added successfully"}), 201

@app.route('/edit-customer/<int:customer_id>', methods=['PUT'])
def edit_customer(customer_id):
    try:
        data = request.get_json()

        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        active = data.get('active')

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM customer WHERE customer_id = %s", (customer_id,))
        existing_customer = cursor.fetchone()

        if not existing_customer:
            return jsonify({"error": "Customer not found"}), 404

        update_query = "UPDATE customer SET "
        update_fields = []
        params = []

        if first_name:
            update_fields.append("first_name = %s")
            params.append(first_name)

        if last_name:
            update_fields.append("last_name = %s")
            params.append(last_name)

        if email:
            update_fields.append("email = %s")
            params.append(email)

        if active is not None:
            update_fields.append("active = %s")
            params.append(active)

        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400

        update_query += ", ".join(update_fields) + " WHERE customer_id = %s"
        params.append(customer_id)

        cursor.execute(update_query, tuple(params))
        conn.commit()
        conn.close()

        return jsonify({"message": "Customer details updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/rent-film', methods=['POST'])
def rent_film():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    data = request.get_json()
    customer_id = data.get('customer_id')
    film_id = data.get('film_id')

    cursor.execute("""
        SELECT COUNT(i.inventory_id) AS available_copies
        FROM inventory i
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id AND r.return_date IS NULL
        WHERE i.film_id = %s AND r.rental_id IS NULL
    """, (film_id,))
    
    available_copies = cursor.fetchone()[0]

    if available_copies <= 0:
        return jsonify({"error": "No available copies to rent."}), 400

    cursor.execute("""
        INSERT INTO rental (rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
        VALUES (NOW(), (SELECT i.inventory_id FROM inventory i WHERE i.film_id = %s AND i.inventory_id NOT IN 
            (SELECT r.inventory_id FROM rental r WHERE r.return_date IS NULL) LIMIT 1), %s, NULL, '1', current_timestamp)
    """, (film_id, customer_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"failure": 0, "message": "Film rented successfully"}), 201


@app.route('/delete-customer/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM customer WHERE customer_id = %s", (customer_id,))
        existing_customer = cursor.fetchone()

        if not existing_customer:
            return jsonify({"error": "Customer not found"}), 404

        cursor.execute("DELETE FROM payment WHERE customer_id = %s", (customer_id,))
        
        cursor.execute("DELETE FROM customer WHERE customer_id = %s", (customer_id,))
        conn.commit()

        return jsonify({"message": "Customer and related payments deleted successfully"}), 200

    except MySQLdb.Error as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/customer/<int:customer_id>/rental-history', methods=['GET'])
def get_customer_rental_history(customer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            SELECT r.rental_id, f.title AS movie_title, r.rental_date, r.return_date
            FROM rental r
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN film f ON i.film_id = f.film_id
            WHERE r.customer_id = %s
        """
        cursor.execute(query, (customer_id,))
        rental_history = cursor.fetchall()
        return jsonify({'rental_history': rental_history}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/mark-returned/<int:rental_id>', methods=['PUT'])
def mark_returned(rental_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            "UPDATE rental SET return_date = NOW() WHERE rental_id = %s AND return_date IS NULL",
            (rental_id,)
        )
        connection.commit()
        
        if cursor.rowcount > 0:
            return jsonify({"message": "Rental marked as returned successfully."}), 200
        else:
            return jsonify({"error": "Rental already returned or not found."}), 400
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True)
