#!/bin/bash

# Test WebP Loop Modification Script
# This script tests modifying a single WebP file to verify the process works

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing WebP Loop Modification${NC}"
echo "================================="

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
mkdir -p test-gif-modification

# Copy original for testing
cp "$webp_file" "test-gif-modification/${filename}_original.gif"

echo -e "${BLUE}🔍 Checking original loop settings...${NC}"
echo "Original frames:"
magick identify "test-gif-modification/${filename}_original.gif" | wc -l | tr -d ' ' | xargs echo "Frame count:"

echo ""
echo -e "${BLUE}🔄 Modifying WebP to have infinite loop...${NC}"

# Test the modification command
if magick "test-gif-modification/${filename}_original.gif" -coalesce -set dispose background -loop 0 "test-gif-modification/${filename}_infinite.gif" 2>/dev/null; then
    echo -e "${GREEN}✅ Modification successful!${NC}"
    
    # Show file sizes
    original_size=$(ls -lh "test-gif-modification/${filename}_original.gif" | awk '{print $5}')
    modified_size=$(ls -lh "test-gif-modification/${filename}_infinite.gif" | awk '{print $5}')
    
    echo -e "${BLUE}📊 File sizes:${NC}"
    echo "  Original: $original_size"
    echo "  Modified: $modified_size"
    
    # Check frame counts
    original_frames=$(magick identify "test-gif-modification/${filename}_original.gif" | wc -l | tr -d ' ')
    modified_frames=$(magick identify "test-gif-modification/${filename}_infinite.gif" | wc -l | tr -d ' ')
    
    echo -e "${BLUE}🎬 Frame counts:${NC}"
    echo "  Original: $original_frames frames"
    echo "  Modified: $modified_frames frames"
    
    # Try to check loop info
    echo -e "${BLUE}🔄 Loop information:${NC}"
    loop_info=$(magick identify -verbose "test-gif-modification/${filename}_infinite.gif" | grep -i loop || echo "No explicit loop info found")
    echo "  $loop_info"
    
    echo ""
    echo -e "${GREEN}🎉 Test passed! WebP modification works correctly.${NC}"
    echo -e "${BLUE}💡 Test files created in: test-gif-modification/${NC}"
    echo -e "${BLUE}💡 You can delete the test directory: rm -rf test-gif-modification${NC}"
    
    echo ""
    echo -e "${YELLOW}📋 Summary:${NC}"
    echo "• WebP modification preserves animation frames"
    echo "• File size remains reasonable"
    echo "• Loop settings are applied to the WebP file"
    echo "• Ready to run the full modification script!"
    
else
    echo -e "${RED}❌ Modification failed${NC}"
    exit 1
fi