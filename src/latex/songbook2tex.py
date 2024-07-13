"""This code generate one tex plik from n>=1 songs in xml
    and gives tex text on stdout"""

import os
import sys

import song2tex as s2t
import src.lib.songbook as sb


def create_ready_tex(songbook, papersize, title_of_songbook=""):
    """function create a pdf file in a4 or a5 size
        source - one file or list of files or directory path
        size - A4 or A5
        title - if source is list of songs you can add a title of songbook,
        songbook - True if we want songbook, False if we don't
    """
    source = songbook.list_of_songs()

    list_title_file = []

    for s in source:
        title = s.title
        print(s, file=sys.stderr)
        list_title_file.append((title, s.plik))

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
    if len(sys.argv) <= 1:
        print("Usage: python3 songbook2tex.py <a4|a5> songbook.yaml", file=sys.stderr)
        exit(1)
    songbook_file = os.path.join(sb.repo_dir(), "songbooks/default.songbook.yaml") if len(sys.argv) == 2 else sys.argv[2]
    songbook = sb.load_songbook_spec_from_yaml(songbook_file)

    create_ready_tex(songbook=songbook, papersize=sys.argv[1])


if __name__ == "__main__":
    main()
