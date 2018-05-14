from flask import *
from bson.json_util import dumps, loads
from pymongo import *
from backend import app

@app.route("/set_page", methods=['POST'])
def set_page():
    data =  request.form['data']
    token = request.form['token']
    
    client = MongoClient(host="localhost", port=27017)
    db = client.dashboard

    db['Users'].update({'Token': token}, {'$set': {'Frontpage': loads(data)}})

    return 'OK'