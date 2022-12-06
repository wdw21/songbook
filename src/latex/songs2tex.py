"""This code generate one tex plik from n>=1 songs in xml
    and gives tex text on stdout"""

import os
import icu  # for sorting polish chars
import sys

from lxml import etree
import song2tex as s2t


def create_ready_tex(songbook, source, papersize, title_of_songbook=""):
    """function create a pdf file in a4 or a5 size
        source - one file or list of files or directory path
        size - A4 or A5
        title - if source is list of songs you can add a title of songbook,
        songbook - True if we want songbook, False if we don't
    """

    if os.path.isdir(source[0]):
        source = [os.path.join(source[0], x) for x in os.listdir(source[0])]

    list_title_file = []

    for s in source:
        if os.path.isfile(s):
            tree = etree.parse(s)
            song = s2t.Song.parseDOM(tree.getroot())
            title = song.title
            list_title_file.append((title, s))
        else:
            print(f"There is no such a file: {s}", file=sys.stderr)
            exit(1)

    collator = icu.Collator.createInstance(icu.Locale('pl_PL.UTF-8'))
    list_title_file.sort(key=lambda x: collator.getSortKey(x[0]))

    # I define head (template of header of tex document) and foot (template of footer of tex document)
    # depending on the papersize which we want

    if papersize not in ("a4", "a5"):
        print("Wrong size of paper!", file=sys.stderr)
        exit(1)

    if songbook:
        head = f"songbook_{papersize}_p.tex"
        foot = f"songbook_{papersize}_s.tex"
    else:
        head = f"single_{papersize}_p.tex"
        foot = f"single_{papersize}_s.tex"

    with open("src/formats/" + head) as f:
        content = f.read()

    if songbook:
        content = content.replace(":title:", title_of_songbook)

    content += "".join([s2t.song2tex(file) for _, file in list_title_file])

    with open("src/formats/" + foot) as f:
        content += f.read()

    return print(content)


def main():
    if len(sys.argv) <= 4:
        print("Usage: python3 songs2tex.py <single|songbook> <a4|a5> TITLE XML_SONG_FILES...", file=sys.stderr)
        exit(1)
    create_ready_tex(sys.argv[1] != 'single', source=sys.argv[4:], papersize=sys.argv[2],
                     title_of_songbook=sys.argv[3])


if __name__ == "__main__":
    main()
