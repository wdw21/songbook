import os

from lxml import etree

import src.html.create_songs_html as cash
import src.lib.list_of_songs as loslib

def name_of_file(song):
    return os.path.splitext(os.path.split(song)[1])[0]


def create_index_xhtml(list_of_songs_meta, target_dir):
    tmp_path = 'index.xhtml'
    out_path = os.path.join(target_dir, tmp_path)
    tree = etree.parse("./templates/index.xhtml")
    ul = tree.getroot().find(".//{http://www.w3.org/1999/xhtml}ul");
    for i in range(len(list_of_songs_meta)):
        li = etree.SubElement(ul, "li")
        a = etree.SubElement(li, "a")
        a.attrib['href'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml'
        a.text = list_of_songs_meta[i].title
    et = etree.ElementTree(tree.getroot())
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def main():
    src = os.path.join("..", "..", "songs")
    target_dir = os.path.join("..", "..", "build", "songs_html")
    src_of_songs = os.path.join("..", "..", "songs")
    los = loslib.list_of_song(src_of_songs)
    create_index_xhtml(los, target_dir)

main()