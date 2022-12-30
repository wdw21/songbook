from lxml import etree
import os
import icu #do sortowania po polskich znakach

class SongMeta:
    def __init__(self, title='', alias='', path=''):
        self.title = title if title else ''
        self.alias = alias if alias else ''
        self.plik = path

    def __repr__(self) -> str:
      return "{" + "File:{} Title:{} Alias:{}".format(self.plik, self.title, self.alias) + "}"

    @staticmethod
    def parseDOM(root, path):
        def elementTextOrNone(elem):
            return elem.text if elem is not None else None

        return SongMeta(
            title=root.get('title'),
            alias=elementTextOrNone(root.find('{*}alias')),
            path=path
        )


def add_song(path, lista):
    tree = etree.parse(path)
    song = SongMeta.parseDOM(tree.getroot(), path)
    lista.append(song)


def list_of_song(path_in):
    songs_list = os.listdir(path_in)
    list_od_meta = []
    for song in songs_list:
        if os.path.splitext(song)[1] == '.xml':
            path = path_in + "/" + song
            add_song(path, list_od_meta)
    collator = icu.Collator.createInstance(icu.Locale('pl_PL.UTF-8'))
    list_od_meta.sort(key=lambda x: collator.getSortKey(x.title))

    return list_od_meta