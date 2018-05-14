from flask import *
from pymongo import *
from backend import app

@app.route("/get_third_party_data", methods=['PUT'])
def get_third_party_data():

    client = MongoClient(host="localhost", port=27017)
    db = client.dashboard

    try:
        location = request.form['location']
        device = request.form['device']
        distro = request.form['distribution']
        sensor = request.form['sensor']

        # type -> CSV, JSON, XML
        url = request.form['url']
        extension = request.form['extension']
        interval = request.form['interval']

        # format -> FTP, SFTP, RSS
        formats = request.form['format']
        username = request.form['username']
        password = request.form['password']

        # other observations
        observations = request.form['observations']
        email = request.form['email']

        # Check if some args are not empty
        if len(url) == 0:
            return jsonify(success=False, result="URL needs to be specified")

        if len(interval) == 0:
            return jsonify(success=False, result="An interval needs to be specified")

        if len(sensor) == 0:
            return jsonify(success=False, result="A sensor needs to be specified")

        if len(formats) == 0:
            return jsonify(success=False, result="A format needs to be specified")

        if len(location) == 0:
            return jsonify(success=False, result="A location needs to be specified")

        #if len(username) == 0:
        #    return jsonify(success=False, result="A username needs to be specified")

        #if len(password) == 0:
        #    return jsonify(success=False, result="A password needs to be specified")

        if len(email) == 0:
            return jsonify(success=False, result="An email needs to be specified")

        # Check if URL is already in the DB
        cursor = db['Url'].find({'Url' : url}).count()

        if cursor > 0 :
            return jsonify(success=False, result="URL already in the Database")


        processRequest = {}

        if len(device) == 0:
            device = "Unknown"
        Device = {"Device" : device}

        if len(distro) == 0:
            distro = "Unknown"
        Distro = {"Distro" : distro}

        Location = {"Location" : location}
        Sensor = {"Sensor" : sensor}
        Interval = {"Interval" : interval}
        Url = {"Url" : url}
        Format = {"Format" : formats}

        if len(username) == 0:
            username = "Unknown"
        Username = {"Username" : username}

        if len(password) == 0:
            password = "Unknown"
        Password = {"Password" : password}

        Type = {"Type" : extension}
        Observations = {"Observations" : observations}
        email = {"Email" : email}

        processRequest.update(Device)
        processRequest.update(Distro)
        processRequest.update(Location)
        processRequest.update(Sensor)
        processRequest.update(Url)
        processRequest.update(Interval)
        processRequest.update(Format)
        processRequest.update(Username)
        processRequest.update(Password)
        processRequest.update(Type)
        processRequest.update(Observations)
        processRequest.update(Email)

        result = db['Url'].insert(processRequest)

        return jsonify(success=True, result="URL added successfully")
    except Exception as e:
        return jsonify(sucess=False, result=str(e))