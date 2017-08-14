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
    def id(self):
        return self.anno.get('id', '')

    @id.setter
    def id(self, id):
        self.anno['id'] = id

    @property
    def meta(self):
        return self.anno.get('meta', {})

    @meta.setter
    def meta(self, obj):
        tmp = self.meta
        tmp.update(obj)
        self.anno['meta'] = tmp

    @property
    def wrapper(self):
        return self.anno.get('wrapper', 'plaintext')

    @wrapper.setter
    def wrapper(self, wrapper_module):
        self.anno['wrapper'] = wrapper_module

    @property
    def relations(self):
        return self.anno.get('relations', [])

    @relations.setter
    def relations(self, lst):
        for r in lst:
            self.upsert_relation(r['origin'], r['target'], typ=r.get('type', None),
                                 id=r.get('id', None), meta=r.get('meta', None))

    @property
    def denotations(self):
        return self.anno.get('denotations', [])

    @denotations.setter
    def denotations(self, lst):
        for d in lst:
            self.upsert_denotation(d['start'], d['end'], text=d.get('text', None),
                                   typ=d.get('type', None), id=d.get('id', None), meta=d.get('meta', None))

    def upsert_denotation(self, start, end, text=None, typ=None, id=None, meta=None):
        lst = self.denotations

        deno = {
            'id': id,
            'start': start,
            'end': end,
            'text': text,
            'type': typ,
            'meta': meta
        }

        if text is None:
            deno['text'] = self.text[start:end]

        if id is not None and self.contains_id(id, 'denotations'):
            i = self.get_index(id, lst)
            lst[i].update(deno)
        elif id is not None:
            lst.append(deno)
            self.ids['denotations'].append(deno['id'])
            self.max['denotations'] = max([self.max['denotations'], int(deno['id'])])
        else:
            deno['id'] = self.max['denotations'] + 1
            lst.append(deno)
            self.ids['denotations'].append(deno['id'])
            self.max['denotations'] += 1

        self.anno['denotations'] = lst
        return deno

    def delete_denotation(self, denotation):
        denotations = self.denotations
        remove_index = self.get_index(denotation, denotations)
        removed_denotation = denotations.pop(remove_index)

        relations = self.relations
        removed_relations = []
        for relation in relations:
            if str(relation['origin']) == str(denotation) or str(relation['target']) == str(denotation):
                removed_relations.append(self.delete_relation(relation['id']))

        self.anno['denotations'] = denotations
        return removed_relations

    def upsert_relation(self, origin, target, id=None, typ=None, meta=None):
        lst = self.relations

        rela = {
            'id': id,
            'origin': origin,
            'target': target,
            'type': typ,
            'meta': meta
        }
        if id is not None and self.contains_id(id, 'relations'):
            i = self.get_index(id, lst)
            lst[i].update(rela)
        elif id is not None:
            lst.append(rela)
            self.ids['relations'].append(rela['id'])
            self.max['relations'] = max([self.max['relations'], int(rela['id'])])
        else:
            rela['id'] = self.max['relations'] + 1
            lst.append(rela)
            self.ids['relations'].append(rela['id'])
            self.max['relations'] += 1

        self.anno['relations'] = lst
        return rela

    def delete_relation(self, relation):
        relations = self.relations
        remove_index = self.get_index(relation, relations)
        removed_relation = relations.pop(remove_index)
        self.anno['relations'] = relations
        return removed_relation

    def __ensure_index(self, lst):
        if len(self.anno.get(lst, [])) > 0 and len(self.ids[lst]) == 0:
            for l in self.anno.get(lst, []):
                self.ids[lst].append(l['id'])
                self.max[lst] = max([self.max[lst], int(l['id'])])

    def contains_id(self, id, lst):
        self.__ensure_index(lst)
        return id in self.ids[lst]

    def get_index(self, id, lst):
        for i, d in enumerate(lst):
            if str(d['id']) == str(id):
                return i
        return None

    @staticmethod
    def from_json(obj):
        anno = Annotation()
        anno.text = obj['text']
        anno.denotations = obj.get('denotations', [])
        anno.relations = obj.get('relations', [])
        anno.meta = obj.get('meta', {})
        return anno

    @staticmethod
    def from_file(path):
        f = open(path, 'r')
        obj = json.loads(f.read())
        f.close()
        return Annotation.from_json(obj)

    def __repr__(self):
        repr = self.anno

        return json.dumps(repr, indent=2)
