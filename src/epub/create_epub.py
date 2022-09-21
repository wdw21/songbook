import os
import zipfile

from lxml import etree
import shutil
from zipfile import ZipFile
from datetime import datetime

import src.html.create_songs_html as cash


class Song_meta:
    def __init__(self, title='', alias='', plik=''):
        self.title = title if title else ''
        self.alias = alias if alias else ''
        self.plik = plik

    # def __repr__(self):
    #     return "(%s, alias: %s, plik: %s)" % (self.title, self.alias, self.plik)

    @staticmethod
    def parseDOM(root, plik):
        get_text = lambda elem: elem.text if elem is not None else None
        return Song_meta(
            title=root.get('title'),
            alias=get_text(root.find('{*}alias')),
            plik=plik
        )


def add_song(PATH, list):
    tree = etree.parse("../../songs/" + PATH + ".xml")
    plik = PATH + ".xml"
    song = Song_meta.parseDOM(tree.getroot(), plik)
    list.append(song)


def list_of_song(path_out):
    songs_list = os.listdir(path_out)
    list_od_meta = []
    for song in songs_list:
        if song[-5:] == '.html':
            PATH = song[0:-5]
            add_song(PATH, list_od_meta)
    list_od_meta.sort(key=lambda x: x.title)
    return list_od_meta


def create_content_opf(list_of_songs_meta, target_dir):
    tmp_path = 'templates/content.opf'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "content.opf")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    metadata = root.getchildren()[0]
    title = metadata.getchildren()[0]
    title.text += str(datetime.now().strftime("%d/%m/%Y %H:%M"))
    manifest = root.getchildren()[1]
    spine = root.getchildren()[2]
    for i in range(len(list_of_songs_meta)):
        x = etree.SubElement(manifest, "item")
        x.attrib['id'] = 'p' + str(i + 1)
        x.attrib['href'] = list_of_songs_meta[i].plik[:-4] + '.html'
        x.attrib['media-type'] = "application/xhtml+xml"
        etree.SubElement(spine, "itemref").attrib['idref'] = 'p' + str(i + 1)
    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def create_toc_ncx(list_of_songs_meta, target_dir):
    tmp_path = 'templates/toc.ncx'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "toc.ncx")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    doctitle = root.getchildren()[1]
    text1 = doctitle.getchildren()[0]
    text1.text += str(datetime.now().strftime("%d/%m/%Y %H:%M"))
    navmap = root.getchildren()[2]
    for i in range(len(list_of_songs_meta)):
        navpoint = etree.SubElement(navmap, "navPoint")
        navpoint.attrib['id'] = 'p' + str(i + 1)
        navpoint.attrib['playOrder'] = str(i + 1)
        navlabel = etree.SubElement(navpoint, "navLabel")
        text = etree.SubElement(navlabel, "text")
        text.text = list_of_songs_meta[i].title
        content = etree.SubElement(navpoint, "content")
        content.attrib['src'] = list_of_songs_meta[i].plik[:-4] + '.html'
    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def create_toc_xhtml(list_of_songs_meta, target_dir):
    tmp_path = 'templates/toc.xhtml'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "toc.xhtml")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    body = root.getchildren()[1]
    nav = body.getchildren()[0]
    ol = nav.getchildren()[1]
    for i in range(len(list_of_songs_meta)):
        li = etree.SubElement(ol, "li")
        a = etree.SubElement(li, "a")
        a.attrib['href'] = list_of_songs_meta[i].plik[:-4] + '.html'
        a.text = list_of_songs_meta[i].title
    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def create_template_epub(path):
    path_epub = os.path.join(path, "epub")
    if os.path.exists(path_epub):
        shutil.rmtree(path_epub)
    path_meta = os.path.join(path_epub, "META-INF")
    path_oebps = os.path.join(path_epub, "OEBPS")
    path_css = os.path.join(path_oebps, "CSS")
    os.mkdir(path_epub)
    os.mkdir(path_oebps)
    os.mkdir(path_meta)
    os.mkdir(path_css)
    path_tmp_meta = os.path.join('templates', "container.xml")
    shutil.copyfile(path_tmp_meta, os.path.join(path_meta, "container.xml"))
    path_tmp_css_song = os.path.join('templates', "song.css")
    path_tmp_css_template = os.path.join('templates', "template.css")
    path_tmp_mimetype = os.path.join('templates', "mimetype")
    shutil.copyfile(path_tmp_css_song, os.path.join(path_css, "song.css"))
    shutil.copyfile(path_tmp_css_template, os.path.join(path_css, "template.css"))
    shutil.copyfile(path_tmp_mimetype, os.path.join(path_epub, "mimetype"))


def create_full_epub(src_of_songs, src, target_dir):
    create_template_epub(target_dir)
    path_out = os.path.join(target_dir, "epub", "OEBPS")
    cash.create_all_songs_html(src_of_songs, src, path_out)
    create_content_opf(list_of_song(path_out), target_dir)
    create_toc_ncx(list_of_song(path_out), target_dir)
    create_toc_xhtml(list_of_song(path_out), target_dir)


def package_epub(target_dir):
    target_dir_epub = os.path.join(target_dir, "epub")
    with ZipFile(os.path.join(target_dir, "spiewnik.epub"), 'w', compression=zipfile.ZIP_DEFLATED) as myzip:
        myzip.write(os.path.join(target_dir_epub, "mimetype"), arcname="mimetype", compress_type=zipfile.ZIP_STORED)
        myzip.write(os.path.join(target_dir_epub, "META-INF", "container.xml"),
                    arcname=os.path.join("META-INF", "container.xml"))
        file_list = os.listdir(os.path.join(target_dir_epub, "OEBPS"))
        for file in file_list:
            if file != 'CSS':
                myzip.write(os.path.join(target_dir_epub, "OEBPS", file), arcname=os.path.join("OEBPS", file))
        myzip.write(os.path.join(target_dir_epub, "OEBPS", "CSS", "template.css"),
                    arcname=os.path.join("OEBPS", "CSS", "template.css"))
        myzip.write(os.path.join(target_dir_epub, "OEBPS", "CSS", "song.css"),
                    arcname=os.path.join("OEBPS", "CSS", "song.css"))


def main():
    src = os.path.join("..", "..", "songs")  # gdzie są wszystkie piosenki
    target_dir = os.path.join("..", "..", "build")  # gdzie ma utworzyć epub
    src_of_songs = os.path.join("..", "..", "songs")
    # które piosenki chcę zawrzeć w śpiewniku(może być katalogiem z plikami xml lub listą plików)
    create_full_epub(src_of_songs, src, target_dir)
    package_epub(target_dir)


if __name__ == "__main__":
    main()
