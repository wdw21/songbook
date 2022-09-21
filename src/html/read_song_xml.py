''' file parsing song in xml '''

from lxml import etree
from enum import Enum
from distutils.util import strtobool


class RowChunk:  # obsługuje akordy
    def __init__(self, chord='', content=None):
        self.chord = chord
        if content is None:
            self.content = ''
        else:
            self.content = content.strip('\t\n')


class RowType(Enum):
    FIRST = 'F'
    FIRST_SPECIAL = 'FS'
    MIDDLE = 'M'
    LAST = 'L'
    SINGLE = 'S'


class Row:
    def __init__(self, row_type=RowType.MIDDLE, new_chords=False, bis=False, chunks=[]):
        self.row_type = row_type
        self.new_chords = new_chords
        self.chunks = chunks
        self.bis = bis

    @staticmethod
    def parseDOM(root, bis=False):
        if root.text:
            chunks = [RowChunk(content=root.text)]
        else:
            chunks = []
        for chunk in root.getchildren():
            chunks.append(RowChunk(chord=chunk.attrib['a'], content=chunk.tail))
        return Row(new_chords=strtobool(root.attrib.get('important_over', 'false')), bis=bis, chunks=chunks)


class BlockType(Enum):
    VERSE = 'V'
    CHORUS = 'C'
    INSTRUMENTAL = 'I'
    OTHER = 'O'

    @staticmethod
    def parse(s):
        return {
            'verse': BlockType.VERSE,
            'chorus': BlockType.CHORUS,
            'instrumental': BlockType.INSTRUMENTAL,
            'other': BlockType.OTHER
        }[s]


class Block:
    def __init__(self, block_type=BlockType.VERSE, rows=[]):
        self.block_type = block_type
        self.rows = rows

    @staticmethod
    def parseDOM(root, linked=False):
        block_type = BlockType.parse(root.attrib['type'])
        rows = []
        for child in root.getchildren():
            if child.tag == '{http://21wdh.staszic.waw.pl}bis':
                bis_rows = [Row.parseDOM(row, bis=True) for row in child.findall('{*}row')]
                bis_times = int(child.attrib.get('times', '2'))
                bis_rows[-1].bis = bis_times
                rows += bis_rows
            else:
                rows.append(Row.parseDOM(child))
        if len(rows) == 1:
            rows[0].row_type = RowType.SINGLE
        elif len(rows) > 1:
            rows[0].row_type = RowType.FIRST_SPECIAL
            rows[-1].row_type = RowType.LAST
        if linked:
            for row in rows:
                row.new_chords = False
        return Block(block_type=block_type, rows=rows)


class Song:
    def __init__(self, title='', text_author='', composer='', artist='', original_title='', translator='', alias='',
                 comment='', music_source='', album='', blocks=[], metre='', barre=''):
        self.title = title if title else ''
        self.text_author = text_author if text_author else ''
        self.composer = composer if composer else ''
        self.artist = artist if artist else ''
        self.original_title = original_title if original_title else ''
        self.translator = translator if translator else ''
        self.alias = alias if alias else ''
        self.comment = comment if comment else ''
        self.blocks = blocks
        self.music_source = music_source if music_source else ''
        self.album = album if album else ''
        self.metre = metre if metre else ''
        self.barre = barre if barre else ''

    @staticmethod
    def parseDOM(root):
        # A child of 'lyric' element may either be a text block, a reference to a text block (e.g. to a chorus), or a tablature.
        text_blocks = root.findall('{*}lyric/{*}block')
        flatten = lambda block: Block.parseDOM(block) if 'blocknb' not in block.attrib else Block.parseDOM(
            text_blocks[int(block.attrib['blocknb']) - 1], linked=True)
        blocks = [flatten(block) for block in root.find('{*}lyric').getchildren() if
                  block.tag != '{http://21wdh.staszic.waw.pl}tabbs']
        get_text = lambda elem: elem.text if elem is not None else None
        get_attrib = lambda elem, a: elem.attrib.get(a) if elem is not None else None
        x = root.xpath("./s:music/s:guitar/@barre", namespaces={"s": "http://21wdh.staszic.waw.pl"})
        return Song(
            title=root.get('title'),
            text_author=get_text(root.find('{*}text_author')),
            composer=get_text(root.find('{*}composer')),
            artist=get_text(root.find('{*}artist')),
            original_title=get_text(root.find('{*}original_title')),
            translator=get_text(root.find('{*}translator')),
            comment=get_text(root.find('{*}comment')),
            alias=get_text(root.find('{*}alias')),
            blocks=blocks,
            metre=get_attrib(root.find('{*}music'), 'metre'),
            barre=x[0] if x else None,
            album=get_text(root.find('{*}album')),
            music_source=get_text(root.find('{*}music_source'))
        )


def parse_song_xml(path):
    tree = etree.parse(path)
    song = Song.parseDOM(tree.getroot())
    return song

# #test
# def main():
#     tree = etree.parse("../../songs/Amsterdam.xml")
#     song = Song.parseDOM(tree.getroot())
#     print(song.title)
#
# if __name__ == "__main__":
#     main()
