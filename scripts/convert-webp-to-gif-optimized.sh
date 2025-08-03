#!/bin/bash

# Optimized WebP to GIF Conversion Script
# This script provides multiple quality/size options for conversion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Directories
SOURCE_DIR="assets/exercise-gif"
OUTPUT_DIR="assets/exercise-gif"

echo -e "${PURPLE}🎯 Optimized WebP to GIF Conversion${NC}"
echo "===================================="

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Error: Source directory '$SOURCE_DIR' does not exist${NC}"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ Error: ImageMagick is not installed${NC}"
    echo -e "${YELLOW}💡 Run: ./scripts/setup-conversion-tools.sh${NC}"
    exit 1
fi

# Use magick command if available (ImageMagick 7), otherwise use convert (ImageMagick 6)
CONVERT_CMD="convert"
if command -v magick &> /dev/null; then
    CONVERT_CMD="magick"
fi

# Quality options
echo -e "${BLUE}🎚️  Choose conversion quality:${NC}"
echo "1. 🏆 High Quality (larger files, ~50-100KB each)"
echo "2. ⚖️  Balanced (recommended, ~30-60KB each)"
echo "3. 🗜️  Compressed (smaller files, ~15-30KB each)"
echo "4. 📱 Mobile Optimized (tiny files, ~10-20KB each)"
echo ""
echo -n "Select option (1-4): "
read -r quality_choice

case $quality_choice in
    1)
        QUALITY_NAME="High Quality"
        CONVERT_OPTS="-coalesce -loop 0 -quality 90 -colors 256"
        ;;
    2)
        QUALITY_NAME="Balanced"
        CONVERT_OPTS="-coalesce -loop 0 -quality 75 -colors 256 -layers optimize"
        ;;
    3)
        QUALITY_NAME="Compressed"
        CONVERT_OPTS="-coalesce -loop 0 -quality 60 -colors 128 -layers optimize"
        ;;
    4)
        QUALITY_NAME="Mobile Optimized"
        CONVERT_OPTS="-coalesce -loop 0 -resize 250x250> -quality 50 -colors 128 -layers optimize -delay 10"
        ;;
    *)
        echo -e "${RED}❌ Invalid option. Using Balanced quality.${NC}"
        QUALITY_NAME="Balanced"
        CONVERT_OPTS="-coalesce -loop 0 -quality 75 -colors 256 -layers optimize"
        ;;
esac

echo -e "${GREEN}✅ Selected: $QUALITY_NAME${NC}"
echo ""

# Create output directory if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
    echo -e "${YELLOW}📁 Creating output directory: $OUTPUT_DIR${NC}"
    mkdir -p "$OUTPUT_DIR"
fi

# Count total files
total_files=$(find "$SOURCE_DIR" -name "*.gif" | wc -l | tr -d ' ')

if [ "$total_files" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No WebP files found in $SOURCE_DIR${NC}"
    exit 0
fi

echo -e "${BLUE}📊 Found $total_files WebP files to convert${NC}"
echo -e "${BLUE}🎯 Quality: $QUALITY_NAME${NC}"
echo -e "${BLUE}⚙️  Options: $CONVERT_OPTS${NC}"
echo ""

# Initialize counters
current=0
success=0
failed=0
total_input_size=0
total_output_size=0

echo -e "${YELLOW}🚀 Starting conversion...${NC}"
echo ""

# Convert each WebP file to GIF
for webp_file in "$SOURCE_DIR"/*.gif; do
    if [ -f "$webp_file" ]; then
        current=$((current + 1))
        
        # Get filename without extension
        filename=$(basename "$webp_file" .gif)
        output_file="$OUTPUT_DIR/${filename}.gif"
        
        # Get input file size
        if command -v stat &> /dev/null; then
            input_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null || echo "0")
            total_input_size=$((total_input_size + input_size))
        fi
        
        echo -ne "${BLUE}[$current/$total_files]${NC} Converting: ${filename}.gif -> ${filename}.gif... "
        
        # Convert WebP to GIF with selected options
        if $CONVERT_CMD "$webp_file" $CONVERT_OPTS "$output_file" 2>/dev/null; then
            # Get output file size
            if command -v stat &> /dev/null && [ -f "$output_file" ]; then
                output_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo "0")
                total_output_size=$((total_output_size + output_size))
                
                # Show size info
                input_kb=$((input_size / 1024))
                output_kb=$((output_size / 1024))
                echo -e "${GREEN}✅ ${output_kb}KB${NC}"
            else
                echo -e "${GREEN}✅ Success${NC}"
            fi
            success=$((success + 1))
        else
            echo -e "${RED}❌ Failed${NC}"
            failed=$((failed + 1))
        fi
    fi
done

echo ""
echo "===================================="
echo -e "${BLUE}📈 Conversion Summary:${NC}"
echo -e "  ${GREEN}✅ Successful: $success${NC}"
echo -e "  ${RED}❌ Failed: $failed${NC}"
echo -e "  ${PURPLE}🎯 Quality: $QUALITY_NAME${NC}"

# Show size comparison if available
if [ "$total_input_size" -gt 0 ] && [ "$total_output_size" -gt 0 ]; then
    input_mb=$((total_input_size / 1024 / 1024))
    output_mb=$((total_output_size / 1024 / 1024))
    
    echo -e "  ${YELLOW}📊 Input size: ${input_mb}MB${NC}"
    echo -e "  ${YELLOW}📊 Output size: ${output_mb}MB${NC}"
    
    if [ "$total_input_size" -gt "$total_output_size" ]; then
        saved_mb=$(((total_input_size - total_output_size) / 1024 / 1024))
        echo -e "  ${GREEN}💾 Space saved: ${saved_mb}MB${NC}"
    elif [ "$total_output_size" -gt "$total_input_size" ]; then
        added_mb=$(((total_output_size - total_input_size) / 1024 / 1024))
        echo -e "  ${YELLOW}📈 Size increase: ${added_mb}MB${NC}"
    fi
fi

echo -e "  ${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"

if [ "$failed" -eq 0 ]; then
    echo -e "${GREEN}🎉 All conversions completed successfully!${NC}"
    echo -e "${BLUE}💡 All GIFs are set to loop infinitely${NC}"
else
    echo -e "${YELLOW}⚠️  Some conversions failed. Check the error messages above.${NC}"
fi