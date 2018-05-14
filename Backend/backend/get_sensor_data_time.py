from flask import *
from pymongo import *
from datetime import date, timedelta
from time import strptime
import json
from bson.json_util import dumps
from backend import app


@app.route("/get_sensor_data_time", methods=['GET'])
def get_sensor_data_time():
	begin = request.args.get('begin')
	end = request.args.get('end')
	sensor = request.args.get('sensor')
	location = request.args.get('location')

	beginSplit = begin.split('/')
	endSplit = end.split('/')

	if(len(beginSplit) > 1):
		dBegin = date(int(beginSplit[2]), month_string_to_number(beginSplit[0]), int(beginSplit[1]))
		dEnd = date(int(endSplit[2]), month_string_to_number(endSplit[0]), int(endSplit[1]))

		diff = dEnd - dBegin

		client = MongoClient(host="localhost", port=27017)
		db = client.dashboard

		mList = []
		tempList = []
		for i in range(diff.days + 1):
			aux = dBegin + timedelta(days=i)
			aux = aux.strftime("%B/%d/%Y")

			cursor = db[sensor].find({'Location': location, 'Time' : {'$regex' : aux}})
			temp = dumps(cursor)

			if(len(temp) > 2):
				tempList.append(json.loads(temp))
			
		tempList = [item for subList in tempList for item in subList]
		mList.append({'data' : json.dumps(tempList)})
		return jsonify(success=True, result=mList)
	else:
		return jsonify(success=False)

def month_string_to_number(string):
    m = {
        'jan': 1,
        'feb': 2,
        'mar': 3,
        'apr':4,
         'may':5,
         'jun':6,
         'jul':7,
         'aug':8,
         'sep':9,
         'oct':10,
         'nov':11,
         'dec':12
        }
    s = string.strip()[:3].lower()

    try:
        out = m[s]
        return out
    except:
        raise ValueError('Not a month')