from flask import *
from bson.json_util import dumps
from pymongo import *
from backend import app



@app.route("/get_user", methods=['GET'])
def get_user():
    token = request.args.get('token')

    client = MongoClient(host="localhost", port=27017)
    db = client.dashboard

    cursor = db['Users'].find({'Token' : token})
       
    mList = []    
    mList.append({"data": dumps(cursor)})
    
    return jsonify(success=True, result=mList)
