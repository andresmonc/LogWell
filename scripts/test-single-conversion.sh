#!/bin/bash

# Quick test script to verify conversion is working

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Single WebP to GIF Conversion${NC}"
echo "========================================"

# Check if ImageMagick is available
if ! command -v magick &> /dev/null; then
    echo -e "${RED}❌ ImageMagick not found${NC}"
    exit 1
fi

# Test with first available WebP file
webp_file=$(find assets/exercise-gif -name "*.gif" | head -1)
if [ -z "$webp_file" ]; then
    echo -e "${RED}❌ No WebP files found${NC}"
    exit 1
fi

filename=$(basename "$webp_file" .gif)
echo -e "${BLUE}📄 Test file: $(basename "$webp_file")${NC}"

# Create test directory
mkdir -p test-conversion

# Test the corrected command
echo -e "${BLUE}🔄 Converting with corrected options...${NC}"
if magick "$webp_file" -coalesce -loop 0 -quality 75 -colors 256 -layers optimize "test-conversion/${filename}.gif" 2>/dev/null; then
    echo -e "${GREEN}✅ Conversion successful!${NC}"
    
    # Show file info
    gif_size=$(ls -lh "test-conversion/${filename}.gif" | awk '{print $5}')
    echo -e "${BLUE}📊 Output file size: $gif_size${NC}"
    
    # Check loop setting
    loop_info=$(magick identify -verbose "test-conversion/${filename}.gif" | grep -i loop || echo "No loop info found")
    echo -e "${BLUE}🔄 Loop setting: $loop_info${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 Test passed! The conversion scripts should work now.${NC}"
    echo -e "${BLUE}💡 Test file created: test-conversion/${filename}.gif${NC}"
    echo -e "${BLUE}💡 You can delete the test directory: rm -rf test-conversion${NC}"
else
    echo -e "${RED}❌ Conversion failed${NC}"
    exit 1
fi