"""Stage one directly importable GitHub Actions artifact per dictionary.

Actions wraps uploaded files in a ZIP. Upload the dictionary's contents, never
its ZIP, so that the downloaded artifact has index.json at its root.
"""
import argparse
import json
from pathlib import Path
import re
import shutil
from zipfile import ZipFile

DICTIONARIES = (
    'CC-CEDICT', 'CC-CEDICT.Zhuyin', 'CC-CEDICT.Hanzi',
    'CC-CEDICT.Canto', 'CC-Canto',
)


def stage_dictionary(archive: Path, destination: Path) -> None:
    with ZipFile(archive) as source:
        names = source.namelist()
        if 'index.json' not in names:
            raise ValueError(f'{archive}: no root index.json; use a dictionary ZIP, not a wrapper')
        if len(set(names)) != len(names):
            raise ValueError(f'{archive}: duplicate archive entries')
        # The converter produces flat JSON files only. Reject directories,
        # traversal and nested ZIPs rather than extracting untrusted paths.
        if any(not re.fullmatch(r'[A-Za-z0-9_.-]+\.json', name) for name in names):
            raise ValueError(f'{archive}: expected flat JSON dictionary files')
        index = json.loads(source.read('index.json'))
        if (not isinstance(index, dict) or index.get('format') != 3
                or not isinstance(index.get('title'), str) or not index['title']
                or not isinstance(index.get('revision'), str)):
            raise ValueError(f'{archive}: invalid dictionary index')
        banks = [name for name in names if re.fullmatch(r'(term|kanji)_bank_\d+\.json', name)]
        if not banks:
            raise ValueError(f'{archive}: missing term or kanji bank')
        for name in banks:
            if not isinstance(json.loads(source.read(name)), list):
                raise ValueError(f'{archive}: invalid bank {name}')
        destination.mkdir(parents=True, exist_ok=True)
        # Prevent stale files from being included when this command is rerun.
        if any(destination.iterdir()):
            raise ValueError(f'{destination}: staging directory must be empty')
        for name in names:
            with source.open(name) as src, (destination / name).open('wb') as dst:
                shutil.copyfileobj(src, dst)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('build_dir', type=Path)
    parser.add_argument('output_dir', type=Path)
    args = parser.parse_args()
    for name in DICTIONARIES:
        stage_dictionary(args.build_dir / f'{name}.zip', args.output_dir / name)
        print(f'Staged directly importable artifact: {name}')


if __name__ == '__main__':
    main()
