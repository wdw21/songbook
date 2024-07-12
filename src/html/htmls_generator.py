import os
import shutil

import src.html.create_songs_html as cash
import sys

import src.lib.songbook as sb

def main():
    target_dir = os.path.join(sb.repo_dir(), "build")  # gdzie ma utworzyć epub
    songbook_file = os.path.join(sb.repo_dir(), "songbooks/default.songbook.yaml") if len(sys.argv) == 1 else sys.argv[1]
    songbook = sb.load_songbook_spec_from_yaml(songbook_file)

    path_songs_html = os.path.join(target_dir, "songs_html")
    if os.path.exists(path_songs_html):
        shutil.rmtree(path_songs_html)
        os.mkdir(path_songs_html)

    cash.create_all_songs_html(songbook.list_of_songs(), path_songs_html)
    path_css = os.path.join(path_songs_html, "CSS")
    os.mkdir(path_css)
    path_tmp_css_song = os.path.join('..', 'epub', 'templates', "song.css")
    shutil.copyfile(path_tmp_css_song, os.path.join(path_css, "song.css"))

if __name__ == "__main__":
    main()
