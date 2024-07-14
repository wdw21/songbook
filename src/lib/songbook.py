import yaml
import glob, os
import uuid
import src.lib.list_of_songs as loslib

def repo_dir():
    return os.path.dirname(os.path.realpath(__file__))+"/../.."

# If the path starts from "./" we assume its
def resolvePath(path, start):
    if path.startswith("./"):
        return os.path.join(start, path)
    else:
        return os.path.join(repo_dir(), path)

class SongbookSpec:
  def __init__(self, spec, basedir):
    self.spec = spec["songbook"]
    self.basedir = basedir

  def __str__(self):
      return str(self.spec)

  def list_of_songs(self):
      files = []
      for s in self.spec["songs"]:
        files.extend(glob.glob(os.path.join(repo_dir(), "./"  + s["glob"]), recursive=True))
      return loslib.list_of_song_from_files(files)

  def title(self):
      return self.spec["title"] if "title" in self.spec else "Śpiewnik"

  def subtitle(self):
      return self.spec["subtitle"] if "subtitle" in self.spec else ""

  def url(self):
      return self.spec["url"] if "url" in self.spec else ""

  def id(self):
      return self.spec["id"] if "id" in self.spec else self.uuid()

  def uuid(self):
      return self.spec["uuid"] if "uuid" in self.spec else str(uuid.uuid4())

  def publisher(self):
      return self.spec["publisher"] if "publisher" in self.spec else ""

  def place(self):
      return self.spec["place"] if "place" in self.spec else ""

  def imagePdfPath(self):
      return resolvePath(self.spec["image"]["pdf"] if "image" in self.spec and "pdf" in self.spec["image"] else "songbooks/wdw21/znak21.pdf", start=self.basedir)

  def imageWebPath(self):
      if "image" in self.spec:
          if "png" in self.spec["image"]: return resolvePath(self.spec["image"]["png"], start=self.basedir)
          if "svg" in self.spec["image"]: return resolvePath(self.spec["image"]["svg"], start=self.basedir)
          if "jpg" in self.spec["image"]: return resolvePath(self.spec["image"]["jpg"], start=self.basedir)
      return resolvePath("songbooks/wdw21/znak21.jpg", start=self.basedir)

  def imageWebExt(self):
      if "image" in self.spec:
          if "png" in self.spec["image"]: return "png"
          if "svg" in self.spec["image"]: return "svg"
          if "jpg" in self.spec["image"]: return "jpg"
      return "image/jpeg"

  def imageWebMime(self):
      if "image" in self.spec:
          if "png" in self.spec["image"]: return "image/png"
          if "svg" in self.spec["image"]: return "image/svg+xml"
          if "jpg" in self.spec["image"]: return "image/jpeg"
      return "image/jpeg"

def load_songbook_spec_from_yaml(filename, title=None, songFiles=None):
    with open(filename) as stream:
        songbook = yaml.safe_load(stream)
        if title:
            songbook["songbook"]["title"] = title
        if songFiles:
            songbook["songbook"]["songs"] = map(lambda s: {"glob": s}, songFiles)
        return SongbookSpec(songbook, basedir=os.path.dirname(os.path.abspath(filename)))