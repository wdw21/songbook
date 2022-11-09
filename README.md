### Recent generated artifacts:
- [21wdw_spiewnik_full.pdf](https://21wdw.staszic.waw.pl/media/21wdw_spiewnik_full.pdf)
- [spiewnik.epub](https://github.com/ktab15/songbook/releases/download/epub-20220921/spiewnik.epub)

# About

This project contains:
 - [songs](./songs) (in XML format)
 - tools to generate PDFs, EPUBs and HTMLs out of this songs
 - [web editor](./editor) to enable easy edits of the songs and [github-integration](editor-github)

# Songs

Currently the songs are hosted in the [./songs](./songs) directory.
They are mostly Polish scouting and turists songs. If the set growths, we will organize it into language specific directories.
The XML format is pretty well self-describing.

# Editing of the songs

The reduce the friction when working with git/github and XML format we provide a [graphical editor](https://ptabor.github.io/songbook/editor) and (github-integrationhttps://songbook-gh6-j72bw4qyaq-ew.a.run.app/] to make the songs editing as smooth as possible. 
The changes you will make can be easily published for review and added to this repository. 

# Generating of PDF songbooks

The songs can be converted to a PDF songbook. We use LaTeX for this. 
You can [download a ready PDF](https://21wdw.staszic.waw.pl/media/21wdw_spiewnik_full.pdf) or generate it yourself.

Running the render script requires:
1) a python environment with dependencies listed in requirements.txt
2) a pdflatex compiler with ucs, extsizes, and Polish localization support

# Generating of EPUBs songbooks

The code to generate EPUBs is in the review (https://github.com/wdw21/songbook/pull/2).
You can download recent generated EPUB from here: [spiewnik.epub](https://github.com/ktab15/songbook/releases/download/epub-20220921/spiewnik.epub).
