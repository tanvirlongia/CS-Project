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
        cursor.execute("""
            SELECT f.film_id, f.title, f.description
            FROM film f
            WHERE LOWER(f.title) LIKE LOWER(%s)
            LIMIT 10
        """, (f'%{search_term}%',))
        
    elif search_type == 'actor':
        name_parts = search_term.split()
        if len(name_parts) == 2:
            first_name, last_name = name_parts
            cursor.execute("""
                SELECT f.film_id, f.title, CONCAT(a.first_name, ' ', a.last_name) as actor_name
                FROM film f
                JOIN film_actor fa ON f.film_id = fa.film_id
                JOIN actor a ON fa.actor_id = a.actor_id
                WHERE LOWER(a.first_name) LIKE LOWER(%s) AND LOWER(a.last_name) LIKE LOWER(%s)
                LIMIT 10
            """, (f'%{first_name}%', f'%{last_name}%'))
        else:
            return jsonify({"error": "Please provide both first and last names."}), 400
        
    elif search_type == 'genre':
        cursor.execute("""
            SELECT f.film_id, f.title, c.name as genre
            FROM film f
            JOIN film_category fc ON f.film_id = fc.film_id
            JOIN category c ON fc.category_id = c.category_id
            WHERE LOWER(c.name) LIKE LOWER(%s)
            LIMIT 10
        """, (f'%{search_term}%',))
        
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

if __name__ == '__main__':
    app.run(debug=True)
