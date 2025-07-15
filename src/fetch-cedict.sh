#!/bin/bash

# URL of the files to download
URL="https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
CANTO_URL="https://cccanto.org/cccedict-canto-readings-150923.zip"
CCCANTO_URL="https://cccanto.org/cccanto-170202.zip"

# Directory to download the file into
DATA_DIR="data"

# File names
ARCHIVE_FILE="$DATA_DIR/cedict_1_0_ts_utf-8_mdbg.txt.gz"
UNARCHIVED_FILE="$DATA_DIR/cedict_1_0_ts_utf-8_mdbg.txt"
CANTO_ARCHIVE_FILE="$DATA_DIR/cccedict-canto-readings-150923.zip"
CCCANTO_ARCHIVE_FILE="$DATA_DIR/cccanto-170202.zip"

# Create the directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Download the CC-CEDICT file
echo "Downloading CC-CEDICT..."
wget "$URL" -O "$ARCHIVE_FILE"

# Check if download was successful
if [ $? -eq 0 ]; then
  echo "CC-CEDICT download successful"

  # Unarchive the file
  echo "Unarchiving CC-CEDICT..."
  gzip -df "$ARCHIVE_FILE"

  # Check if unarchiving was successful
  if [ $? -eq 0 ]; then
    echo "CC-CEDICT unarchive successful"
    echo "File is ready: $UNARCHIVED_FILE"
  else
    echo "CC-CEDICT unarchive failed"
  fi
else
  echo "CC-CEDICT download failed"
fi

# Download the Cantonese readings file
echo "Downloading Cantonese readings..."
wget "$CANTO_URL" -O "$CANTO_ARCHIVE_FILE"

# Check if download was successful
if [ $? -eq 0 ]; then
  echo "Cantonese readings download successful"

  # Unzip the file
  echo "Unzipping Cantonese readings..."
  unzip -o "$CANTO_ARCHIVE_FILE" -d "$DATA_DIR"

  # Check if unzipping was successful
  if [ $? -eq 0 ]; then
    echo "Cantonese readings unzip successful"
    echo "Files extracted to: $DATA_DIR"
  else
    echo "Cantonese readings unzip failed"
  fi
else
  echo "Cantonese readings download failed"
fi

# Download the CCCanto file
echo "Downloading CCCanto..."
wget "$CCCANTO_URL" -O "$CCCANTO_ARCHIVE_FILE"

# Check if download was successful
if [ $? -eq 0 ]; then
  echo "CCCanto download successful"

  # Unzip the file
  echo "Unzipping CCCanto..."
  unzip -o "$CCCANTO_ARCHIVE_FILE" -d "$DATA_DIR"

  # Check if unzipping was successful
  if [ $? -eq 0 ]; then
    echo "CCCanto unzip successful"
    echo "Files extracted to: $DATA_DIR"
  else
    echo "CCCanto unzip failed"
  fi
else
  echo "CCCanto download failed"
fi
