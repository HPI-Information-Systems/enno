import json, sys
from flask import Blueprint, Response, request
from enno import config

adapters = {
    'enron': __import__('enno.wrappers.enron', fromlist=['enron'])
}

wrappers = Blueprint('wrappers', __name__)


def json_response(obj, status=200):
    if type(obj) is dict:
        obj = json.dumps(obj)
    return Response(str(obj), status=status, mimetype='application/json')


@wrappers.route('/sources')
def list_sources():
    ret = list(config['datasources'].keys())
    return json_response(ret)


@wrappers.route('/config/<source>')
def get_config(source):
    return json_response(config['datasources'][source])


@wrappers.route('/listing/<source>')
def list_samples(source):
    opts = config['datasources'][source]
    return json_response(adapters[opts['wrapper']].get_listing(opts['options']))


@wrappers.route('/sample/<source>/<path:sample>')
def get_sample(source, sample):
    try:
        return json_response(adapters[config['datasources'][source]['wrapper']]
                             .get_sample(sample, config['datasources'][source]['options']))
    except:
        e = sys.exc_info()[1]
        return json_response({'status': 404, 'message': str(e)}, status=404)


@wrappers.route('/save/<source>/<path:sample>', methods=['POST'])
def save_sample(source, sample):
    if request.headers['Content-Type'] == 'application/json':
        res = adapters[config['datasources'][source]['wrapper']] \
            .save_sample(sample, request.json, config['datasources'][source]['options'])
        return json_response({'status': 200, 'message': 'saved "' + sample + '" from "' + source + '"'})

    return json_response({'status': 415, 'message': 'wrong header!'})


@wrappers.route('/denotation/<source>/<path:sample>', methods=['POST'])
def upsert_denotation(source, sample):
    if 'application/json' in request.headers['Content-Type']:
        payload = request.json
        conf = config['datasources'][source]
        anno = adapters[conf['wrapper']].get_sample(sample, conf['options'])
        deno = anno.upsert_denotation(payload['start'], payload['end'], text=payload.get('text', None),
                                      typ=payload.get('type', None), id=payload.get('id', None),
                                      meta=payload.get('meta', None))
        adapters[conf['wrapper']].save_annotation(sample, anno, conf['options'])
        return json_response(deno)

    return json_response({'status': 415, 'message': 'wrong header!'})
