import os
import json
import sys
from email import parser as ep
from enno.utils.annotation import Annotation


def __has_annotation(path):
    return os.path.isfile(path + '.ann')


def get_listing(options):
    path = options['path']
    ret = {
        'folders': {},
        'docs': [],
        'flat': []
    }
    for p, d, f in os.walk(path):
        tmp = ret
        p = p[len(path):]
        for pp in p.split('/'):
            if len(pp) == 0:
                continue
            if pp not in tmp['folders']:
                tmp['folders'][pp] = {'folders': {}, 'docs': []}
            tmp = tmp['folders'][pp]

        for ff in f:
            if ff.endswith(''):
                sample = {
                    'name': ff,
                    'has_annotation': __has_annotation(os.path.join(options['path'], p, ff)),
                    'sample': p + '/' + ff
                }
                tmp['docs'].append(sample)
                ret['flat'].append(sample)
        tmp['docs'] = sorted(tmp['docs'], key=lambda k: k['name'])

    ret['flat'] = sorted(ret['flat'], key=lambda k: k['name'])
    return ret


def get_sample(sample, options):
    path = os.path.join(options['path'], sample)
    if __has_annotation(path):
        anno = Annotation.from_file(path + '.ann')
        if len(anno.id) == 0:  # legacy fix (some might not have an ID)
            anno.id = sample
        return anno

    f = open(path, 'r')
    text = f.read()
    f.close()

    anno = Annotation()
    anno.id = sample
    anno.meta = {}
    anno.wrapper = 'text'
    anno.text = text

    return anno


def get_last_sample_id(options):
    path = os.path.join(options['path'], '.last')
    sample = ''
    if os.path.isfile(path):
        f = open(path, 'r')
        sample = f.read()
        f.close()
    else:
        return get_listing(options)['flat'][0]['sample']
    
    if os.path.isfile(os.path.join(options['path'], sample)):
        return sample
    return get_listing(options)['flat'][0]


def set_last_sample(sample, options):
    with open(os.path.join(options['path'], '.last'), 'w') as f:
        f.write(sample)


def save_sample(sample, payload, options):
    # TODO make this more fancy using the Annotation class
    path = os.path.join(options['path'], sample) + '.ann'
    with open(path, 'w') as f:
        json.dump(payload, f)


def save_annotation(sample, anno, options):
    path = os.path.join(options['path'], sample) + '.ann'
    with open(path, 'w') as f:
        f.write(str(anno))
