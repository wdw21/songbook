import os

from lxml import etree

import src.html.create_songs_html as cash
import src.lib.list_of_songs as loslib

def create_content_opf(list_of_songs_meta, target_dir):
    tmp_path = 'templates/content.opf'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "content.opf")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    metadata = root.getchildren()[0]
    title = metadata.getchildren()[0]
    title.text += actual_date()
    modify_date = metadata.getchildren()[4]
    modify_date.text = str(datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"))
    manifest = root.getchildren()[1]
    spine = root.getchildren()[2]
    for i in range(len(list_of_songs_meta)):
        x = etree.SubElement(manifest, "item")
        x.attrib['id'] = 'p' + str(i + 1)
        x.attrib['href'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml'

        x.attrib['media-type'] = "application/xhtml+xml"
        etree.SubElement(spine, "itemref").attrib['idref'] = 'p' + str(i + 1)
    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)

def create_full_epub(src_of_songs, src, target_dir):
    los = loslib.list_of_song(path_out)
    create_content_opf(los, target_dir)
    create_toc_ncx(los, target_dir)
    create_toc_xhtml(los, target_dir)


def main():
    src = os.path.join("..", "..", "songs")
    target_dir = os.path.join("..", "..", "build", "songs_html")
    src_of_songs = os.path.join("..", "..", "songs")
    los = loslib.list_of_song(src_of_songs)
    print(los)

main()