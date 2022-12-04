import os
import icu  # for sorting polish signs
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

    if (os.path.splitext(source[0])[1] != ""):
        pass

    elif os.path.isdir(source[0]):
        source = ["songs/" + x for x in os.listdir(source[0])]

    else:
        print("Wrong name or type of source!")
        exit(1)

    list_title_file = []
    for s in source:
        tree = etree.parse(s)
        song = s2t.Song.parseDOM(tree.getroot())
        title = song.title
        list_title_file.append((title, s))

    collator = icu.Collator.createInstance(icu.Locale('pl_PL.UTF-8'))
    list_title_file.sort(key=lambda x: collator.getSortKey(x[0]))
    # I define head (template of header of tex document) and foot (template of hooter of tex document)
    # depending on the papersize which we want

    if papersize != "a4":
        if papersize != "a5":
            print("Wrong size of paper!")
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
        p = content.find(":title:")
        s = content[:p] + title_of_songbook + content[p + 7:]
        content = s

    for song in list_title_file:
        content += s2t.s2t(song[1])

    with open("src/formats/" + foot) as f:
        content += f.read()

    return print(content)


def main():
    create_ready_tex(sys.argv[1] != 'single', source=sys.argv[4:], papersize=sys.argv[2],
                     title_of_songbook=sys.argv[3])


if __name__ == "__main__":
    main()
