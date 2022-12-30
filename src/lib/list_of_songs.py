from lxml import etree
import os
import icu #do sortowania po polskich znakach

class SongMeta:
    def __init__(self, title='', alias='', plik=''):
        self.title = title if title else ''
        self.alias = alias if alias else ''
        self.plik = plik

    @staticmethod
    def parseDOM(root, plik):
        def elementTextOrNone(elem):
            return elem.text if elem is not None else None

        return SongMeta(
            title=root.get('title'),
            alias=elementTextOrNone(root.find('{*}alias')),
            plik=plik
        )


def add_song(path, lista):
    tree = etree.parse(path + ".xml")
    plik = path + ".xml"
    song = SongMeta.parseDOM(tree.getroot(), plik)
    lista.append(song)


def list_of_song(path_out):
    songs_list = os.listdir(path_out)
    list_od_meta = []
    for song in songs_list:
        if os.path.splitext(song)[1] == '.xhtml':
            path = "../../songs/" + os.path.splitext(song)[0]
            add_song(path, list_od_meta)
    collator = icu.Collator.createInstance(icu.Locale('pl_PL.UTF-8'))
    list_od_meta.sort(key=lambda x: collator.getSortKey(x.title))

    return list_od_meta