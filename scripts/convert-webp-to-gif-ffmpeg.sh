#!/bin/bash

# Convert WebP to GIF Script (using ffmpeg)
# This script converts all WebP files in assets/exercise-gif to GIF format using ffmpeg

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SOURCE_DIR="assets/exercise-gif"
OUTPUT_DIR="assets/exercise-gif"

echo -e "${BLUE}🔄 WebP to GIF Conversion Script (ffmpeg)${NC}"
echo "========================================"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Error: Source directory '$SOURCE_DIR' does not exist${NC}"
    exit 1
fi

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}📁 Creating output directory: $OUTPUT_DIR${NC}"
    mkdir -p "$OUTPUT_DIR"
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ Error: ffmpeg is not installed${NC}"
    echo -e "${YELLOW}💡 Install ffmpeg using: brew install ffmpeg${NC}"
    echo -e "${YELLOW}💡 Or run: ./scripts/setup-conversion-tools.sh${NC}"
    exit 1
fi

# Count total files
total_files=$(find "$SOURCE_DIR" -name "*.gif" | wc -l | tr -d ' ')

if [ "$total_files" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No WebP files found in $SOURCE_DIR${NC}"
    exit 0
fi

echo -e "${BLUE}📊 Found $total_files WebP files to convert${NC}"
echo ""

# Initialize counters
current=0
success=0
failed=0

# Convert each WebP file to GIF
for webp_file in "$SOURCE_DIR"/*.gif; do
    if [ -f "$webp_file" ]; then
        current=$((current + 1))
        
        # Get filename without extension
        filename=$(basename "$webp_file" .gif)
        output_file="$OUTPUT_DIR/${filename}.gif"
        
        echo -ne "${BLUE}[$current/$total_files]${NC} Converting: ${filename}.gif -> ${filename}.gif... "
        
        # Convert WebP to GIF using ffmpeg with infinite loop
        # -y flag overwrites output files without asking
        # -loglevel error suppresses verbose output
        # -stream_loop -1 repeats input infinitely during processing
        # -loop 0 sets infinite looping for output GIF
        if ffmpeg -y -loglevel error -stream_loop -1 -i "$webp_file" -t 2 -loop 0 "$output_file" 2>/dev/null; then
            echo -e "${GREEN}✅ Success${NC}"
            success=$((success + 1))
        else
            echo -e "${RED}❌ Failed${NC}"
            failed=$((failed + 1))
        fi
    fi
done

echo ""
echo "=================================="
echo -e "${BLUE}📈 Conversion Summary:${NC}"
echo -e "  ${GREEN}✅ Successful: $success${NC}"
echo -e "  ${RED}❌ Failed: $failed${NC}"
echo -e "  ${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"

if [ "$failed" -eq 0 ]; then
    echo -e "${GREEN}🎉 All conversions completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Some conversions failed. Check the error messages above.${NC}"
fi