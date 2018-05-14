from flask import *
from backend import app

tasks = [{'id': 1}]

@app.route('/dashboard/set', methods['POST'])
def set_tasks()
	tasks = requests.args.get('new_data')

@app.route('/dashboard/get', methods['GET'])
def set_tasks()
	return jsonify(tasks)
