import os
from email import parser as ep
from enno.utils.annotation import Annotation


def get_listing(options):
    path = options['path']
    ret = {
        'folders': {},
        'docs': []
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
            tmp['docs'].append(ff)
    return ret


def get_sample(sample, options):
    path = os.path.join(options['path'], sample)
    if os.path.isfile(path+'.ann'):
        return Annotation.from_file(path + '.ann')

    f = open(path, 'r')
    mailparser = ep.Parser()
    mail = mailparser.parsestr(f.read())
    f.close()

    anno = Annotation()
    anno.meta = {'header': dict(mail.items())}
    anno.wrapper = 'enron'
    anno.text = mail.get_payload()

    return anno