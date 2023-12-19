#!/bin/bash

# URL of the file to download
URL="https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"

# File names
ARCHIVE_FILE="cedict_1_0_ts_utf-8_mdbg.txt.gz"
UNARCHIVED_FILE="cedict_1_0_ts_utf-8_mdbg.txt"

# Download the file
echo "Downloading..."
wget "$URL" -O "$ARCHIVE_FILE"

# Check if download was successful
if [ $? -eq 0 ]; then
  echo "Download successful"

  # Unarchive the file
  echo "Unarchiving..."
  gzip -d "$ARCHIVE_FILE"

  # Check if unarchiving was successful
  if [ $? -eq 0 ]; then
    echo "Unarchive successful"
    echo "File is ready: $UNARCHIVED_FILE"
  else
    echo "Unarchive failed"
  fi
else
  echo "Download failed"
fi
