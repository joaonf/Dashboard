import random
from flask import *
from bson.json_util import dumps
from pymongo import *
from backend import app

@app.route("/register", methods=['POST'])
def register():
    username =  request.form['username']
    password = request.form['password']
    email = request.form['email']
        
    client = MongoClient(host="localhost", port=27017)
    db = client.dashboard
    cursor = db['Users'].find({'Username' : username, 'Password' : password})
       
    mList = []
    if(cursor.count() > 0):
        return jsonify(success=False, result="Username already register")
    else:
        temp = {'Username': username, 'Password': password, 'Email': email, 'Token': generate_session_token(),'Frontpage': []}
        db['Users'].insert_one(temp)

         
        mList.append({"data": dumps(cursor)})
        return jsonify(success=True, result=mList)
    

def generate_session_token():
    sys_random = random.SystemRandom()
    return ''.join(sys_random.choice('0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM') for _ in range(50))