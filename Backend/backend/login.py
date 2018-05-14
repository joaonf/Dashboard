from flask import *
from bson.json_util import dumps
from pymongo import *
from backend import app



@app.route("/login", methods=['GET'])
def login():
    username = request.args.get('username')
    password = request.args.get('password')
    
    client = MongoClient(host="localhost", port=27017)
    db = client.dashboard

    cursor = db['Users'].find({'Username' : username, 'Password' : password})
       
    mList = []    
    mList.append({"data": dumps(cursor)})
    
    return jsonify(success=True, result=mList)
