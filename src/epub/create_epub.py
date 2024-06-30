import os
import zipfile

from lxml import etree
import shutil
from zipfile import ZipFile
from datetime import datetime

import src.html.create_songs_html as cash
import src.lib.list_of_songs as loslib

def actual_date():
    return str(datetime.now().strftime("%d/%m/%Y %H:%M"))


def name_of_file(song):
    return os.path.splitext(os.path.split(song)[1])[0]


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
    p = 1
    for i in range(len(list_of_songs_meta)):
        x = etree.SubElement(manifest, "item")
        x.attrib['id'] = 'p' + str(p)
        x.attrib['href'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml'
        x.attrib['media-type'] = "application/xhtml+xml"
        etree.SubElement(spine, "itemref").attrib['idref'] = 'p' + str(p)
        p = p+1

    x = etree.SubElement(manifest, "item")
    x.attrib['id'] = 'p' + str(p)
    x.attrib['href'] = 'cover.xhtml'
    x.attrib['media-type'] = "application/xhtml+xml"
    etree.SubElement(spine, "itemref").attrib['idref'] = 'p' + str(p)

    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def create_toc_ncx(list_of_songs_meta, target_dir):
    tmp_path = 'templates/toc.ncx'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "toc.ncx")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    doctitle = root.getchildren()[1]
    text1 = doctitle.getchildren()[0]
    text1.text += actual_date()
    navmap = root.getchildren()[2]

    parent = navmap
    last_letter=''
    playOrder=1
    for i in range(len(list_of_songs_meta)):
        if (len(list_of_songs_meta) > 20 and last_letter != list_of_songs_meta[i].title[0]):
           last_letter = list_of_songs_meta[i].title[0].upper()
           parent_np = etree.SubElement(navmap, "navPoint")
           parent_np.attrib['id'] = 'p' + str(playOrder)
           parent_np.attrib['playOrder'] = str(playOrder)
           playOrder = playOrder + 1
           parent_nl = etree.SubElement(parent_np, "navLabel")
           parent_text = etree.SubElement(parent_nl, "text")
           parent_text.text = last_letter
           content = etree.SubElement(parent_np, "content")
           content.attrib['src'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml#'
           parent = parent_np

        navpoint = etree.SubElement(parent, "navPoint")
        navpoint.attrib['id'] = 'p' + str(playOrder)
        navpoint.attrib['playOrder'] = str(playOrder)
        playOrder = playOrder + 1
        navlabel = etree.SubElement(navpoint, "navLabel")
        text = etree.SubElement(navlabel, "text")
        text.text = list_of_songs_meta[i].title
        content = etree.SubElement(navpoint, "content")
        content.attrib['src'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml'
    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def create_toc_xhtml(list_of_songs_meta, target_dir):
    tmp_path = 'templates/toc.xhtml'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "toc.xhtml")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    body = root.getchildren()[1]
    nav = body.getchildren()[0]
    toc_ol = nav.getchildren()[1]
    parent_ol = toc_ol
    last_letter=''
    for i in range(len(list_of_songs_meta)):
        if (len(list_of_songs_meta) > 20 and last_letter != list_of_songs_meta[i].title[0]):
           last_letter = list_of_songs_meta[i].title[0].upper()
           parent_li = etree.SubElement(toc_ol, "li")
           parent_a = etree.SubElement(parent_li, "a")
           parent_a.attrib['href'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml#'
           parent_a.text = last_letter
           parent_ol = etree.SubElement(parent_li, "ol")
        li = etree.SubElement(parent_ol, "li")
        a = etree.SubElement(li, "a")
        a.attrib['href'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml'
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
    path_images = os.path.join(path_oebps, "images")
    os.mkdir(path_epub)
    os.mkdir(path_oebps)
    os.mkdir(path_meta)
    os.mkdir(path_css)
    os.mkdir(path_images)
    path_tmp_meta = os.path.join('templates', "container.xml")
    shutil.copyfile(path_tmp_meta, os.path.join(path_meta, "container.xml"))
    path_tmp_css_song = os.path.join('templates', "song.css")
    path_tmp_css_template = os.path.join('templates', "template.css")
    path_tmp_mimetype = os.path.join('templates', "mimetype")
    shutil.copyfile(path_tmp_css_song, os.path.join(path_css, "song.css"))
    shutil.copyfile(path_tmp_css_template, os.path.join(path_css, "template.css"))
    shutil.copyfile(path_tmp_mimetype, os.path.join(path_epub, "mimetype"))
    shutil.copyfile(os.path.join('templates', "images", "cover.jpg"), os.path.join(path_images, "cover.jpg"))
    shutil.copyfile(os.path.join('templates', "cover.xhtml"), os.path.join(path_oebps, "cover.xhtml"))


def create_full_epub(src_of_songs, src, target_dir):
    create_template_epub(target_dir)
    path_out = os.path.join(target_dir, "epub", "OEBPS")
    cash.create_all_songs_html(src_of_songs, src, path_out)
    los = loslib.list_of_song(src_of_songs)
    create_content_opf(los, target_dir)
    create_toc_ncx(los, target_dir)
    create_toc_xhtml(los, target_dir)


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
        myzip.write(os.path.join(target_dir_epub, "OEBPS", "images", "cover.jpg"),
                            arcname=os.path.join("OEBPS", "images", "cover.jpg"))


def main():
    src = os.path.join("..", "..", "songs")  # gdzie są wszystkie piosenki
    target_dir = os.path.join("..", "..", "build")  # gdzie ma utworzyć epub
    src_of_songs = os.path.join("..", "..", "songs")
    # które piosenki chcę zawrzeć w śpiewniku (może być katalogiem z plikami xml lub listą plików)
    create_full_epub(src_of_songs, src, target_dir)
    package_epub(target_dir)


if __name__ == "__main__":
    main()
