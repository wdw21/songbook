import os
import sys
import src.lib.songbook as sb
from lxml import etree

# def name_of_file(song):
#     return os.path.splitext(os.path.split(song)[1])[0]


def create_index_xhtml(list_of_songs_meta, target_dir):
    tmp_path = 'index.xhtml'
    out_path = os.path.join(target_dir, tmp_path)
    tree = etree.parse(os.path.join(sb.repo_dir(), "./src/html/templates/index.xhtml"))
    ul = tree.getroot().find(".//{http://www.w3.org/1999/xhtml}ul");
    for i in range(len(list_of_songs_meta)):
        song = list_of_songs_meta[i]
        li = etree.SubElement(ul, "li")
        # <button onclick='edit("zaciagnijcie_na_oknie_niebieska_zaslone.xhtml")'><span class="material-symbols-outlined">edit</span></button>
        button = etree.SubElement(li, "button")
        button.attrib['class'] = 'editicon'
        button.attrib['onclick'] = "edit('"+os.path.relpath(song.plik, start=os.path.join(sb.repo_dir(), "songs"))+"');"
        span = etree.SubElement(button, 'span')
        span.attrib['class'] = 'material-symbols-outlined'
        span.text = 'edit'
        a = etree.SubElement(li, "a")
        a.attrib['href'] = song.base_file_name() + '.xhtml'
        a.text = list_of_songs_meta[i].title

    et = etree.ElementTree(tree.getroot())
    et.write(out_path, pretty_print=True, method='xml', encoding='utf-8', xml_declaration=True)


def main():
    target_dir = os.path.join(sb.repo_dir(), "build")  # gdzie ma utworzyć epub
    songbook_file = os.path.join(sb.repo_dir(), "songbooks/default.songbook.yaml") if len(sys.argv) == 1 else sys.argv[1]
    songbook = sb.load_songbook_spec_from_yaml(songbook_file)
    target_dir = os.path.join(sb.repo_dir(), "build", "songs_html")

    create_index_xhtml(songbook.list_of_songs(), target_dir)

main()