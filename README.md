# Generative Computer Graphics - HS 2019

This repo was used to track and showcase my work for the class "I.BA_222_GENCG.H1901". It is built on github pages (Jekyll).

## Useful shell workflow commands

image sequence to video
```shell
ffmpeg -pattern_type glob -i './image-sequence/*.jpg' -vcodec libx264 -vf format=yuv420p movie.mp4
```

unpack multiple tar files:
```shell
cat *.tar | tar -xvf - -i
```

move all files from subfolders into current directory:
```shell
mv **/* .
```

## Structure

```
├── _01-Shapes        (Shapes collection)       + COLLECTIONS
│   └── 00_empty                                +
│       ├── index.md  (sketch info)             +
│       ├── sketch.js (your code)               +
│       ├── test.html (page to test locally)    +
│       └── thumb.jpg (sketch thumb)            +
│   ├── 01_01                                   +
│   └── ...                                     +
├── _02-Agents        (Agents collection)       +

├── _includes         (gh pages layout blocks)  + GH PAGES SETTINGS
├── _layout           (gh pages layout)         +
├── _sass             (gh pages css)            +

├── css               (more css)                + OTHER
├── font-awesome                                +
├── fonts                                       +
├── img               (static images)
├── js                (JS libraries)
└── _config.yml       (gh pages config)
```

All examples should be placed in the corresponding **collection** folder. To create a new collections duplicate one of the folder, rename it to `"0x_xxxxxx"` and add it's name to `_config.yml`.

All the info regarding the class as well as direct links to all materials (slides, notebooks, examples, etc... ) are accessible via the github pages for this repository:

**[https://digitalideation.github.io/ba_222_gencg_h1901/](https://digitalideation.github.io/ba_222_gencg_h1901/)**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)