from flask import *
from pymongo import *
from bson.json_util import dumps
from backend import app


@app.route("/get_sensor_data", methods=['GET'])
def get_sensor_data():
    
    client = MongoClient(host="localhost", port=27017)
    db = client.dashboard


    temp = []
    coll = db.collection_names()

    # Find the correct collections
    for i in range(0, len(coll)):
    	if "_" not in coll[i] and "Users" not in coll[i] and coll[i] != "Url":
    		if db[coll[i]].count() > 20:
    			cursor = db[coll[i]].find().skip(db[coll[i]].count() - 20)
    		else:
    			cursor = db[coll[i]].find()

    		temp.append({coll[i]: cursor})

    '''
    # Find distinct sensors
    sensorsAvailable = db.sensors.distinct("Sensors");
    temp.append({"sensors": sensorsAvailable})

    # Find data for the sensors
    cursor = db.sensors.find().skip(db.sensors.count() - 1000)
    temp.append({"data": cursor})
    '''

    # Return all the values for all the sensors
    mList = []
    mList.append({"data": dumps(temp)})
    return jsonify(success=True, result=mList)