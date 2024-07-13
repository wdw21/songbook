import yaml
import glob, os
import src.lib.list_of_songs as loslib

def repo_dir():
    return os.path.dirname(os.path.realpath(__file__))+"/../.."

class SongbookSpec:
  def __init__(self, spec):
    self.spec = spec["songbook"]

  def __str__(self):
      return str(self.spec)

  def list_of_songs(self):
      files = []
      for s in self.spec["songs"]:
        files.extend(glob.glob(os.path.join(repo_dir(), "./"  + s["glob"]), recursive=True))
      # print(os.path.join(repo_dir(), s["glob"]))
      # print(files)
      return loslib.list_of_song_from_files(files)

def load_songbook_spec_from_yaml(filename):
    with open(filename) as stream:
        return SongbookSpec(yaml.safe_load(stream))

# l=load_songbook_spec_from_yaml("./songbooks/all/default.songbook.yaml")
# print(l.list_of_songs())