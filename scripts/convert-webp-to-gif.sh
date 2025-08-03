#!/bin/bash

# Convert WebP to GIF Script
# This script converts all WebP files in assets/exercise-gif to GIF format

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

echo -e "${BLUE}🔄 WebP to GIF Conversion Script${NC}"
echo "=================================="

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

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ Error: ImageMagick is not installed${NC}"
    echo -e "${YELLOW}💡 Install ImageMagick using: brew install imagemagick${NC}"
    exit 1
fi

# Use magick command if available (ImageMagick 7), otherwise use convert (ImageMagick 6)
CONVERT_CMD="convert"
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
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
        
        # Convert WebP to GIF with infinite loop
        # -coalesce ensures proper frame handling for animated WebPs
        # -loop 0 sets infinite looping for output GIF
        if $CONVERT_CMD "$webp_file" -coalesce -loop 0 "$output_file" 2>/dev/null; then
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