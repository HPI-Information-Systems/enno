from flask import Flask
import json


f = open('config.json', 'r')
config = json.loads(f.read())
f.close()

enno = Flask(__name__)
from enno import routes
