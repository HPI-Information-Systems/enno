import json
import re


class Annotation:
    def __init__(self, wrapper='plaintext'):
        self.anno = {}
        self.wrapper = wrapper

        # some helper "indices"
        self.max = {
            'denotations': 0,
            'relations': 0
        }
        self.ids = {
            'denotations': [],
            'relations': []
        }

    @property
    def text(self):
        return self.anno.get('text', '')

    @text.setter
    def text(self, txt):
        self.anno['text'] = txt

    @property
    def meta(self):
        return self.anno.get('meta', {})

    @meta.setter
    def meta(self, obj):
        self.anno['meta'] = obj

    @property
    def wrapper(self):
        return self.anno.get('wrapper', 'plaintext')

    @wrapper.setter
    def wrapper(self, wrapper_module):
        self.anno['wrapper'] = wrapper_module

    @property
    def relations(self):
        return self.anno.get('wrapper', [])

    @relations.setter
    def relations(self, lst):
        pass  # TODO

    @property
    def denotations(self):
        return self.anno.get('denotations', [])

    @denotations.setter
    def denotations(self, lst):
        for d in lst:
            self.add_denotation(d['start'], d['end'], text=d.get('text', None),
                                typ=d.get('typ', None), id=d.get('id', None), meta=d.get('meta', None))

    def add_denotation(self, start, end, text=None, typ=None, id=None, meta=None):
        lst = self.denotations
        id = self.__next_id('E', id, 'denotations')
        lst.append({
            'id': id,
            'start': start,
            'end': end,
            'text': text,
            'typ': typ,
            'meta': meta
        })
        self.anno['denotations'] = lst

    def __ensure_index(self, lst):
        if len(self.anno.get(lst, [])) > 0 and len(self.ids[lst]) == 0:
            for l in self.anno.get(lst, []):
                self.ids[lst].append(l['id'])
                self.max[lst] = max([self.max[lst], int(re.findall('\d+', l['id'])[0])])

    def __next_id(self, prefix, id, lst):
        if id is None:
            id = prefix + str(self.max[lst] + 1)
            self.max[lst] += 1
        elif self.contains_id(id, lst):
            raise KeyError('ID "' + id + '" already exists in ' + lst)
        self.ids[lst].append(id)
        return id

    def contains_id(self, id, lst):
        self.__ensure_index(lst)
        return id in self.ids[lst]

    @staticmethod
    def from_json(obj):
        anno = Annotation()
        anno.text = obj['text']
        anno.denotations = obj['denotations']
        return anno

    @staticmethod
    def from_file(path):
        f = open(path, 'r')
        obj = json.loads(f.read())
        f.close()
        return Annotation.from_json(obj)

    def __repr__(self):
        repr = self.anno

        return json.dumps(repr)
