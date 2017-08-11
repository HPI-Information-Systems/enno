import json
import sys
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


def get_conf(source):
    return config['datasources'][source]


@wrappers.route('/sources')
def list_sources():
    ret = list(config['datasources'].keys())
    return json_response(ret)


@wrappers.route('/config/<source>')
def get_config(source):
    return json_response(get_conf(source))


@wrappers.route('/listing/<source>')
def list_samples(source):
    opts = get_conf(source)
    return json_response(adapters[opts['wrapper']].get_listing(opts['options']))


@wrappers.route('/last-sample/<source>')
def get_last_sample(source):
    opts = get_conf(source)
    sample = adapters[opts['wrapper']].get_last_sample_id(opts['options'])
    return get_sample(source, sample)


@wrappers.route('/sample/<source>/<path:sample>')
def get_sample(source, sample):
    try:
        opts = get_conf(source)
        ret = json_response(adapters[get_conf(source)['wrapper']]
                            .get_sample(sample, get_conf(source)['options']))
        adapters[opts['wrapper']].set_last_sample(sample, opts['options'])
        return ret
    except:
        e = sys.exc_info()
        return json_response({'status': 404, 'message': str(e[0]) + ': ' + str(e[1])}, status=404)


@wrappers.route('/save/<source>/<path:sample>', methods=['POST'])
def save_sample(source, sample):
    if request.headers['Content-Type'] == 'application/json':
        res = adapters[get_conf(source)['wrapper']] \
            .save_sample(sample, request.json, get_conf(source)['options'])
        return json_response({'status': 200, 'message': 'saved "' + sample + '" from "' + source + '"'})

    return json_response({'status': 415, 'message': 'wrong header!'})


@wrappers.route('/denotation/<source>/<path:sample>', methods=['POST'])
def upsert_denotation(source, sample):
    if 'application/json' in request.headers['Content-Type']:
        payload = request.json
        conf = get_conf(source)
        anno = adapters[conf['wrapper']].get_sample(sample, conf['options'])
        deno = anno.upsert_denotation(payload['start'], payload['end'], text=payload.get('text', None),
                                      typ=payload.get('type', None), id=payload.get('id', None),
                                      meta=payload.get('meta', None))
        adapters[conf['wrapper']].save_annotation(sample, anno, conf['options'])
        return json_response(deno)

    return json_response({'status': 415, 'message': 'wrong header!'})


@wrappers.route('/denotation/<source>/<denotation>/<path:sample>', methods=['DELETE'])
def delete_denotation(source, denotation, sample):
    conf = get_conf(source)
    anno = adapters[conf['wrapper']].get_sample(sample, conf['options'])
    removed_relations = anno.delete_denotation(denotation)
    adapters[conf['wrapper']].save_annotation(sample, anno, conf['options'])
    return json_response(removed_relations)


@wrappers.route('/relation/<source>/<path:sample>', methods=['POST'])
def upsert_relation(source, sample):
    if 'application/json' in request.headers['Content-Type']:
        payload = request.json
        conf = get_conf(source)
        anno = adapters[conf['wrapper']].get_sample(sample, conf['options'])
        deno = anno.upsert_relation(payload['origin'], payload['target'],
                                    typ=payload.get('type', None), id=payload.get('id', None),
                                    meta=payload.get('meta', None))
        adapters[conf['wrapper']].save_annotation(sample, anno, conf['options'])
        return json_response(deno)

    return json_response({'status': 415, 'message': 'wrong header!'})


@wrappers.route('/relation/<source>/<relation>/<path:sample>', methods=['DELETE'])
def delete_relation(source, relation, sample):
    conf = get_conf(source)
    anno = adapters[conf['wrapper']].get_sample(sample, conf['options'])
    anno.delete_relation(relation)
    adapters[conf['wrapper']].save_annotation(sample, anno, conf['options'])
    return json_response({'removed': relation})
