import os
from flask import *

application = app = Flask(__name__)
app.secret_key = os.urandom(64)

import backend.set_page
import backend.login
import backend.register
import backend.get_user
import backend.get_sensor_data
import backend.get_third_party_data
import backend.get_sensor_data_time