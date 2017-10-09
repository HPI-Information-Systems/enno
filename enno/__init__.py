from flask import Flask
import json
import argparse

parser = argparse.ArgumentParser(description='Enno - Your friendly Text Annotator')
parser.add_argument('config', nargs='?', default='config-enron.json')
parser.add_argument('--config', dest='config', default=None)
args = parser.parse_args()

f = open(args.config, 'r')
config = json.loads(f.read())
f.close()

enno = Flask(__name__)
from enno import routes
