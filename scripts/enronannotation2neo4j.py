import os
import json
import sys

path = 'data/enron/'


def po(d, ll):
    s = d['start']
    e = d['end']
    t = d['type'].split('/')

    max = 0
    o = None
    for l in ll:
        if ((s > l['start'] and e <= l['end']) or (s >= l['start'] and e < l['end'])) \
                and max < len(l['type'].split('/')):
            max = len(l['type'].split('/'))
            o = l

    return o


for p, d, f in os.walk(path):
    for ff in f:
        if ff.endswith('.ann'):
            # print(p + '/' + ff)
            try:
                with open(os.path.join(p, ff)) as f_anno:
                    annos = f_anno.read()
                    anno = json.loads(annos)
                    mid = ('M' + anno['meta']['header']['Message-ID'][1:-1] + 'M').replace('.', '_').replace('@', '_')
                    f = anno['meta']['header']['From'].replace("'", "")
                    t = anno['meta']['header']['To'].replace('\n', '').replace("'", "")
                    print("CREATE (" + mid + ":Mail {from:'" + f + "', to:'" + t + "', file:'" + p + "/" + ff + "'})")
                    for deno in anno.get('denotations', []):
                        i = str(deno['id'])
                        print("CREATE (" + mid + "_" + i + "_d:" +
                              deno['type'].replace('/', '_') + " {id:" + i + ", text:'" +
                              deno['text'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n') +
                              "', start:" + str(deno['start']) +
                              ", end:" + str(deno['end']) + "})")

                        print("CREATE (" + mid + "_" + i + "_d)-[:part_of]->(" + mid + ")")

                    for deno in anno.get('denotations', []):
                        if not (deno['type'] == 'Header' or deno['type'] == 'Body'):
                            o = po(deno, anno.get('denotations', []))
                            if o is not None:
                                print("CREATE (" + mid + "_" + str(deno['id']) + "_d)-[:is_in]->(" +
                                      mid + "_" + str(o['id']) + "_d)")

                    for rela in anno.get('relations', []):
                        print("CREATE (" + mid + "_" + str(rela['origin']) + "_d)-[:" + rela['type'] +
                              "{id:" + str(rela['id']) + "}]->(" + mid + "_" + str(rela['target']) + "_d)")
                    print(';')
            except:
                # print(sys.exc_info())
                # print(len(annos))
                # print('failed')
                pass
