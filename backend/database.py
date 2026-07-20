import sqlite3
import os
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import DictCursor

logger = logging.getLogger("Database")

# Detect database configuration
DB_TYPE = "sqlite"
if os.getenv("POSTGRES_DB") or os.getenv("DATABASE_URL"):
    DB_TYPE = "postgres"

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "prospecao.db")

def get_connection():
    """Returns a database connection (SQLite or PostgreSQL) depending on configuration."""
    if DB_TYPE == "postgres":
        # Connect to PostgreSQL
        host = os.getenv("POSTGRES_HOST", "localhost")
        port = os.getenv("POSTGRES_PORT", "5432")
        user = os.getenv("POSTGRES_USER", "postgres")
        password = os.getenv("POSTGRES_PASSWORD", "postgres_pass")
        database = os.getenv("POSTGRES_DB", "app_db")
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        return conn
    else:
        # Connect to SQLite
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    """
    Helper function to execute SQL queries. 
    Handles SQL placeholder conversion ('?' to '%s') dynamically when connected to PostgreSQL.
    """
    conn = get_connection()
    
    # Translate placeholder syntax if using PostgreSQL
    if DB_TYPE == "postgres":
        query = query.replace("?", "%s")
        cursor = conn.cursor(cursor_factory=DictCursor)
    else:
        cursor = conn.cursor()
        
    result = None
    try:
        cursor.execute(query, params)
        if commit:
            conn.commit()
            # Return last row ID for insertions
            if "INSERT" in query:
                if DB_TYPE == "postgres":
                    # In Postgres we can query returning ID, but for simplicity let's read serial lastval
                    cursor.execute("SELECT lastval();")
                    result = cursor.fetchone()[0]
                else:
                    result = cursor.lastrowid
            else:
                result = cursor.rowcount
        elif fetchone:
            row = cursor.fetchone()
            result = dict(row) if row else None
        elif fetchall:
            rows = cursor.fetchall()
            result = [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"SQL execution failed: {query} Error: {str(e)}")
        if commit:
            conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
        
    return result

def init_db():
    """Creates tables if they do not exist."""
    # SQLite structure
    if DB_TYPE == "sqlite":
        execute_query("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                telefone TEXT,
                endereco TEXT,
                website TEXT,
                nota REAL,
                total_avaliacoes INTEGER,
                palavra_chave TEXT,
                mensagem_personalizada TEXT,
                status_whatsapp TEXT DEFAULT 'Pendente',
                detalhe_erro TEXT,
                data_extracao DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_envio TEXT
            )
        """, commit=True)
        execute_query("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """, commit=True)
    # PostgreSQL structure
    else:
        execute_query("""
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                telefone VARCHAR(50),
                endereco TEXT,
                website TEXT,
                nota REAL,
                total_avaliacoes INTEGER,
                palavra_chave VARCHAR(255),
                mensagem_personalizada TEXT,
                status_whatsapp VARCHAR(50) DEFAULT 'Pendente',
                detalhe_erro TEXT,
                data_extracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_envio VARCHAR(50)
            )
        """, commit=True)
        execute_query("""
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT
            )
        """, commit=True)

def save_lead(lead_data):
    """Saves a lead to the database. Prevents duplication."""
    # Check if lead already exists
    exists_query = "SELECT id FROM leads WHERE nome = ? AND (telefone = ? OR endereco = ?)"
    exists = execute_query(
        exists_query, 
        (lead_data.get('nome'), lead_data.get('telefone'), lead_data.get('endereco')), 
        fetchone=True
    )
    
    if exists:
        return exists['id']
        
    insert_query = """
        INSERT INTO leads (nome, telefone, endereco, website, nota, total_avaliacoes, palavra_chave, status_whatsapp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        lead_data.get('nome'),
        lead_data.get('telefone'),
        lead_data.get('endereco'),
        lead_data.get('website'),
        lead_data.get('nota'),
        lead_data.get('total_avaliacoes'),
        lead_data.get('palavra_chave'),
        lead_data.get('status_whatsapp', 'Pendente')
    )
    return execute_query(insert_query, params, commit=True)

def get_all_leads(status=None, keyword=None):
    """Retrieves leads from the database."""
    query = "SELECT * FROM leads WHERE 1=1"
    params = []
    
    if status:
        query += " AND status_whatsapp = ?"
        params.append(status)
    if keyword:
        query += " AND palavra_chave LIKE ?"
        params.append(f"%{keyword}%")
        
    query += " ORDER BY id DESC"
    return execute_query(query, tuple(params), fetchall=True)

def get_lead(lead_id):
    """Retrieves a lead by ID."""
    return execute_query("SELECT * FROM leads WHERE id = ?", (lead_id,), fetchone=True)

def update_lead(lead_id, updates):
    """Updates fields of a lead."""
    fields = []
    params = []
    for key, val in updates.items():
        fields.append(f"{key} = ?")
        params.append(val)
        
    params.append(lead_id)
    query = f"UPDATE leads SET {', '.join(fields)} WHERE id = ?"
    return execute_query(query, tuple(params), commit=True) > 0

def delete_lead(lead_id):
    """Deletes a lead."""
    lead = get_lead(lead_id)
    if lead and lead['status_whatsapp'] == 'Processando':
        return False
    execute_query("DELETE FROM leads WHERE id = ?", (lead_id,), commit=True)
    return True

def clear_leads():
    """Removes all leads."""
    execute_query("DELETE FROM leads", commit=True)

def get_setting(key, default=None):
    """Gets a setting value."""
    row = execute_query("SELECT value FROM settings WHERE key = ?", (key,), fetchone=True)
    return row['value'] if row else default

def set_setting(key, value):
    """Sets a setting value."""
    query = """
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
    """
    execute_query(query, (key, str(value)), commit=True)

# Auto-initialize
init_db()
