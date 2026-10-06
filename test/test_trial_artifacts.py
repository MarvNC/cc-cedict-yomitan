import json
from pathlib import Path
import sys
import tempfile
import unittest
from zipfile import ZipFile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from prepare_trial_artifacts import DICTIONARIES, stage_dictionary


class TrialArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def make_archive(self, files):
        path = self.root / 'input.zip'
        with ZipFile(path, 'w') as archive:
            for name, contents in files.items():
                archive.writestr(name, contents)
        return path

    def valid_files(self):
        return {
            'index.json': json.dumps({'format': 3, 'title': 'Test', 'revision': '1'}),
            'term_bank_1.json': json.dumps([['你好', 'ni3 hao3', '', '', 0, ['hello'], 0, '']]),
        }

    def test_actions_zip_is_directly_importable(self):
        files = self.valid_files()
        stage = self.root / 'stage'
        stage_dictionary(self.make_archive(files), stage)
        # Emulate upload-artifact wrapping the staged directory contents.
        artifact = self.root / 'downloaded-artifact.zip'
        with ZipFile(artifact, 'w') as archive:
            for file in stage.iterdir():
                archive.write(file, file.relative_to(stage))
        with ZipFile(artifact) as archive:
            self.assertIn('index.json', archive.namelist())
            self.assertFalse(any(name.endswith('.zip') for name in archive.namelist()))
            for name, content in files.items():
                self.assertEqual(archive.read(name).decode(), content)

    def test_workflow_uploads_contents_not_nested_zips(self):
        workflow = (Path(__file__).resolve().parents[1] / '.github/workflows/test.yml').read_text()
        self.assertIn('python3 scripts/prepare_trial_artifacts.py build trial-artifacts', workflow)
        self.assertEqual(workflow.count('uses: actions/upload-artifact@v4'), len(DICTIONARIES))
        for name in DICTIONARIES:
            self.assertIn(f'name: {name}\n          path: trial-artifacts/{name}/*\n', workflow)
        self.assertNotIn('path: build/', workflow)

    def test_old_bundle_rejected(self):
        with self.assertRaisesRegex(ValueError, 'no root index.json'):
            stage_dictionary(self.make_archive({'CC-CEDICT.zip': b'PK'}), self.root / 'stage')

    def test_prefixed_index_rejected(self):
        with self.assertRaisesRegex(ValueError, 'no root index.json'):
            stage_dictionary(self.make_archive({'dictionary/index.json': '{}'}), self.root / 'stage')

    def test_unsafe_or_nested_files_rejected(self):
        for name in ('../escape.json', 'sub/bank.json', 'other.zip'):
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'flat JSON'):
                stage_dictionary(self.make_archive({**self.valid_files(), name: '{}'}), self.root / 'stage')

    def test_missing_banks_rejected(self):
        with self.assertRaisesRegex(ValueError, 'missing term or kanji bank'):
            stage_dictionary(self.make_archive({'index.json': self.valid_files()['index.json']}), self.root / 'stage')

    def test_nonempty_destination_rejected(self):
        stage = self.root / 'stage'
        stage.mkdir()
        (stage / 'stale.zip').write_bytes(b'PK')
        with self.assertRaisesRegex(ValueError, 'must be empty'):
            stage_dictionary(self.make_archive(self.valid_files()), stage)


if __name__ == '__main__':
    unittest.main()
