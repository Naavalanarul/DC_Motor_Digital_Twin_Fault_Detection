import sqlite3
import json
from datetime import datetime
from pathlib import Path

import os
if os.environ.get("VERCEL"):
    DB_PATH = Path("/tmp/motors.db")
else:
    DB_PATH = Path(__file__).parent / "motors.db"

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Create tables and seed 5 sample motors if table is empty."""
    conn = get_connection()
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS motors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    location TEXT,
                    fault_mode TEXT NOT NULL,
                    config_json TEXT,
                    peak_dbc REAL DEFAULT -999,
                    status TEXT DEFAULT 'unknown'
                 )''')
                 
    c.execute('''CREATE TABLE IF NOT EXISTS fault_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    motor_id INTEGER REFERENCES motors(id) ON DELETE CASCADE,
                    fault_mode TEXT,
                    peak_dbc REAL,
                    fundamental_freq REAL,
                    upper_sb_freq REAL,
                    lower_sb_freq REAL,
                    status TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                 )''')
                 
    c.execute('''CREATE TABLE IF NOT EXISTS scan_results (
                     motor_id INTEGER PRIMARY KEY REFERENCES motors(id) ON DELETE CASCADE,
                     signal_json TEXT,
                     spectrum_json TEXT,
                     analysis_json TEXT,
                     scalogram_json TEXT,
                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )''')

    # Migration for DBs created before scalogram_json existed.
    c.execute("PRAGMA table_info(scan_results)")
    existing_cols = {row[1] for row in c.fetchall()}
    if "scalogram_json" not in existing_cols:
        c.execute("ALTER TABLE scan_results ADD COLUMN scalogram_json TEXT")

    c.execute("SELECT COUNT(*) FROM motors")
    if c.fetchone()[0] == 0:
        seed_data = [
            ("Pump Motor A", "Building 1, Floor 1", "Broken Rotor Bar", {"modulation_index": 0.04, "line_frequency": 50, "fault_frequency": 2, "amplitude": 10, "duration": 5, "noise_floor": 0.05, "slip": 0.02, "harmonic_index": 1, "severity": 0.05}),
            ("Conveyor Motor B", "Building 1, Floor 2", "Stator winding fault", {"modulation_index": 0.08, "line_frequency": 50, "fault_frequency": 3, "amplitude": 12, "duration": 5, "noise_floor": 0.05, "severity": 0.1, "poles": 4, "slots": 28, "slip": 0.03, "slot_harmonic": 1, "network_harmonic": 1}),
            ("Fan Motor C", "Building 2, Floor 1", "Eccentricity (Asymmetry)", {"modulation_index": 0.02, "line_frequency": 60, "fault_frequency": 1, "amplitude": 8, "duration": 5, "noise_floor": 0.03, "fr": 24.5, "static_severity": 0.05, "dynamic_severity": 0.05}),
            ("Compressor Motor D", "Building 2, Floor 2", "External (Mechanical Unbalance / Alignment)", {"modulation_index": 0.01, "line_frequency": 50, "fault_frequency": 2, "amplitude": 15, "duration": 5, "noise_floor": 0.04, "severity": 0.02, "fr": 24.5}),
            ("Generator Motor E", "Building 3, Floor 1", "Broken Rotor Bar", {"modulation_index": 0.06, "line_frequency": 50, "fault_frequency": 4, "amplitude": 10, "duration": 5, "noise_floor": 0.05, "slip": 0.04, "harmonic_index": 1, "severity": 0.03})
        ]
        
        for name, location, fault_mode, config in seed_data:
            c.execute("INSERT INTO motors (name, location, fault_mode, config_json) VALUES (?, ?, ?, ?)",
                      (name, location, fault_mode, json.dumps(config)))
                      
    conn.commit()
    conn.close()

def create_motor(name, location, fault_mode, config):
    """Create a motor, config is a dict that gets JSON-serialized."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO motors (name, location, fault_mode, config_json) VALUES (?, ?, ?, ?)",
              (name, location, fault_mode, json.dumps(config)))
    motor_id = c.lastrowid
    conn.commit()
    conn.close()
    return motor_id

def get_motor(motor_id):
    """Get a single motor as dict. Return None if not found."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM motors WHERE id = ?", (motor_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def list_motors():
    """List all motors as list of dicts."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM motors")
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_motor(motor_id, **kwargs):
    """Update motor fields. kwargs can include name, location, fault_mode, config (dict), peak_dbc, status."""
    if not kwargs:
        return
    conn = get_connection()
    c = conn.cursor()
    
    if "config" in kwargs:
        kwargs["config_json"] = json.dumps(kwargs.pop("config"))
        
    fields = []
    values = []
    for k, v in kwargs.items():
        fields.append(f"{k} = ?")
        values.append(v)
    
    values.append(motor_id)
    
    query = f"UPDATE motors SET {', '.join(fields)} WHERE id = ?"
    c.execute(query, tuple(values))
    conn.commit()
    conn.close()

def delete_motor(motor_id):
    """Delete motor and cascade to fault_history and scan_results."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM motors WHERE id = ?", (motor_id,))
    conn.commit()
    conn.close()

def add_fault_history(motor_id, fault_mode, peak_dbc, fundamental_freq, upper_sb_freq, lower_sb_freq, status):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''INSERT INTO fault_history 
                 (motor_id, fault_mode, peak_dbc, fundamental_freq, upper_sb_freq, lower_sb_freq, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (motor_id, fault_mode, peak_dbc, fundamental_freq, upper_sb_freq, lower_sb_freq, status))
    conn.commit()
    conn.close()

def get_fault_history(motor_id, limit=20):
    """Get last N fault history entries for a motor, newest first."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM fault_history WHERE motor_id = ? ORDER BY timestamp DESC LIMIT ?", (motor_id, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_scan_results(motor_id, signal_data, spectrum_data, analysis_data, scalogram_data=None):
    """Upsert scan results. signal_data, spectrum_data, analysis_data, scalogram_data are dicts that get JSON-serialized."""
    conn = get_connection()
    c = conn.cursor()
    
    # SQLite doesn't have UPSERT before 3.24 for ON CONFLICT DO UPDATE, but REPLACE INTO is close or using simple insert/update
    # Let's use INSERT ON CONFLICT since it's standard SQLite3.24+
    c.execute('''INSERT INTO scan_results (motor_id, signal_json, spectrum_json, analysis_json, scalogram_json, updated_at) 
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(motor_id) DO UPDATE SET 
                 signal_json=excluded.signal_json,
                 spectrum_json=excluded.spectrum_json,
                 analysis_json=excluded.analysis_json,
                 scalogram_json=excluded.scalogram_json,
                 updated_at=CURRENT_TIMESTAMP''',
              (motor_id, json.dumps(signal_data), json.dumps(spectrum_data), json.dumps(analysis_data), json.dumps(scalogram_data)))
    conn.commit()
    conn.close()

def get_scan_results(motor_id):
    """Get latest scan results, JSON-deserialize the fields."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM scan_results WHERE motor_id = ?", (motor_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return None
    
    res = dict(row)
    if res.get("signal_json"): 
        res["signal"] = json.loads(res["signal_json"])
    if res.get("spectrum_json"): 
        res["spectrum"] = json.loads(res["spectrum_json"])
    if res.get("analysis_json"): 
        res["analysis"] = json.loads(res["analysis_json"])
    if res.get("scalogram_json"):
        res["scalogram"] = json.loads(res["scalogram_json"])

    return res
