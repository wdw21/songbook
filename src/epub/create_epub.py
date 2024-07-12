import os
import copy
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


def create_content_opf(list_of_songs_meta, target_dir, files):
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

    for f in files:
        x = etree.SubElement(manifest, "item")
        x.attrib['id'] = 'p' + str(p)
        x.attrib['href'] = f
        x.attrib['media-type'] = "application/xhtml+xml"
        etree.SubElement(spine, "itemref").attrib['idref'] = 'p' + str(p)
        p = p + 1

    et = etree.ElementTree(root)
    et.write(out_path, doctype='<!DOCTYPE html>', pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)

def groupName(title):
  if title[0]>='0' and title[0]<='9':
      return "0..9"
  return title[0].upper()

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
        if len(list_of_songs_meta) > 20 and last_letter != groupName(list_of_songs_meta[i].title):
           last_letter = groupName(list_of_songs_meta[i].title)
           parent_np = etree.SubElement(navmap, "navPoint")
           parent_np.attrib['id'] = 'p' + str(playOrder)
           parent_np.attrib['playOrder'] = str(playOrder)
           playOrder = playOrder + 1
           parent_nl = etree.SubElement(parent_np, "navLabel")
           parent_text = etree.SubElement(parent_nl, "text")
           parent_text.text = last_letter
           content = etree.SubElement(parent_np, "content")
           content.attrib['src'] = name_of_file(list_of_songs_meta[i].plik) + '.xhtml#title'
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
    et.write(out_path, doctype='<!DOCTYPE html>', pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)

class SongInToc:
    def __init__(self, song):
       self.song = song

    def plik(self):
        return self.song.plik

    def title(self):
        return self.song.title

def extract_toc_songs(list_of_songs_meta):
    d = dict()
    group = None
    last_letter = None
    for i in range(len(list_of_songs_meta)):
        if len(list_of_songs_meta) > 20 and last_letter != groupName(list_of_songs_meta[i].title):
            group = groupName(list_of_songs_meta[i].title)
        if not group in d:
            d[group] = []
        d[group].append(SongInToc(list_of_songs_meta[i]))
    return d

def toc_songs_to_xhtml(parent, toc_songs_list):
    for i in range(len(toc_songs_list)):
        s = toc_songs_list[i]
        li = etree.SubElement(parent, "li")
        a = etree.SubElement(li, "a")
        a.attrib['href'] = name_of_file(s.plik())+ '.xhtml'
        a.text = s.title()

def create_group_toc_xhtml(group, toc_songs_list, target_dir, page_suffix = None):
    tmp_path = 'templates/toc_letter.xhtml'
    file_name = "toc_"+group+".xhtml"
    out_path = os.path.join(target_dir, "epub", "OEBPS", file_name)
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    body = root.getchildren()[1]
    nav = body.getchildren()[0]
    h1 = nav.getchildren()[0]
    h1.text = group
    toc_ol = nav.getchildren()[1]

    toc_songs_to_xhtml(toc_ol, toc_songs_list)
    et = etree.ElementTree(root)
    if page_suffix is not None:
        body.append(copy.deepcopy(page_suffix))
    et.write(out_path, doctype='<!DOCTYPE html>', pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)
    return file_name

def create_index_toc_xhtml(target_dir, page_suffix = None):
    tmp_path = 'templates/index.xhtml'
    file_name = "index.xhtml"
    out_path = os.path.join(target_dir, "epub", "OEBPS", file_name)
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    body = root.getchildren()[1]
    et = etree.ElementTree(root)
    if page_suffix is not None:
        body.append(copy.deepcopy(page_suffix))
    et.write(out_path, doctype='<!DOCTYPE html>', pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)
    return file_name

def create_toc_xhtml(list_of_songs_meta, target_dir, page_suffix):
    files = []
    tmp_path = 'templates/toc.xhtml'
    out_path = os.path.join(target_dir, "epub", "OEBPS", "toc.xhtml")
    tree = etree.parse(tmp_path)
    root = tree.getroot()
    body = root.getchildren()[1]
    nav = body.getchildren()[0]
    toc_ol = nav.getchildren()[1]

    files.append(create_index_toc_xhtml(target_dir, page_suffix))

    toc_songs = extract_toc_songs(list_of_songs_meta)
    for group in toc_songs:
        if group:
            parent_li = etree.SubElement(toc_ol, "li")
            parent_a = etree.SubElement(parent_li, "span")
            parent_a.text = group
            parent_ol = etree.SubElement(parent_li, "ol")
            toc_songs_to_xhtml(parent_ol, toc_songs[group])
            files.append(create_group_toc_xhtml(group, toc_songs[group], target_dir, page_suffix))
        else:
            toc_songs_to_xhtml(toc_ol, toc_songs[group])


    li = etree.SubElement(toc_ol, "li")
    a = etree.SubElement(li, "a")
    a.attrib['href'] = 'index.xhtml'
    a.text ="Index"

    et = etree.ElementTree(root)
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)
    return files

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
    los = loslib.list_of_song(src_of_songs)
    toc_songs = extract_toc_songs(los)
    suffix = etree.Element("div", attrib={"id":"letters", "class": "letters"})
    for group in toc_songs:
        a=etree.SubElement(suffix, "a")
        a.attrib["href"] = "toc_" + group + ".xhtml"
        a.text=group

    create_template_epub(target_dir)
    path_out = os.path.join(target_dir, "epub", "OEBPS")
    cash.create_all_songs_html(src_of_songs, src, path_out,  suffix)
    files = []
    files.extend(create_toc_xhtml(los, target_dir, page_suffix = suffix))
    #create_toc_ncx(los, target_dir)
    create_content_opf(los, target_dir, files)


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
