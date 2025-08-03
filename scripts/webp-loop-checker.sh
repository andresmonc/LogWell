#!/bin/bash

# WebP Loop Checker Script
# This script checks the loop settings of WebP files and can modify them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Directory
SOURCE_DIR="assets/exercise-gif"

echo -e "${PURPLE}🔍 WebP Animation Loop Checker${NC}"
echo "==============================="

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

echo -e "${BLUE}🎯 Choose action:${NC}"
echo "1. Check loop settings for sample files"
echo "2. Check specific file"
echo "3. Test conversion with loop preservation"
echo ""
echo -n "Select option (1-3): "
read -r action_choice

case $action_choice in
    1)
        echo -e "${YELLOW}📊 Checking sample WebP files for loop information...${NC}"
        echo ""
        
        count=0
        for webp_file in "$SOURCE_DIR"/*.gif; do
            if [ -f "$webp_file" ] && [ $count -lt 5 ]; then
                filename=$(basename "$webp_file")
                echo -e "${BLUE}🔍 File: $filename${NC}"
                
                # Check if it's animated (has multiple frames)
                frame_count=$($CONVERT_CMD identify "$webp_file" | wc -l | tr -d ' ')
                if [ "$frame_count" -gt 1 ]; then
                    echo -e "  ${GREEN}✅ Animated WebP ($frame_count frames)${NC}"
                    
                    # Try to get loop information
                    loop_info=$($CONVERT_CMD identify -verbose "$webp_file" | grep -i -E "(loop|iteration|disposal)" | head -3 || echo "No explicit loop info found")
                    echo -e "  ${YELLOW}🔄 Loop info: $loop_info${NC}"
                else
                    echo -e "  ${YELLOW}⚠️  Static WebP (single frame)${NC}"
                fi
                echo ""
                count=$((count + 1))
            fi
        done
        ;;
        
    2)
        echo -e "${YELLOW}📁 Available WebP files:${NC}"
        ls "$SOURCE_DIR"/*.gif | head -10
        echo ""
        echo -n "Enter filename (without path): "
        read -r filename
        
        webp_file="$SOURCE_DIR/$filename"
        if [ ! -f "$webp_file" ]; then
            echo -e "${RED}❌ File not found: $webp_file${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🔍 Analyzing: $filename${NC}"
        echo "==============================="
        
        # Basic info
        $CONVERT_CMD identify "$webp_file"
        echo ""
        
        # Detailed animation info
        echo -e "${YELLOW}🎬 Animation Details:${NC}"
        $CONVERT_CMD identify -verbose "$webp_file" | grep -i -E "(loop|iteration|disposal|delay|webp)" || echo "No animation metadata found"
        ;;
        
    3)
        echo -e "${YELLOW}🧪 Testing conversion with loop preservation...${NC}"
        
        # Create test output directory
        test_dir="test-conversion"
        mkdir -p "$test_dir"
        
        # Test with first available WebP file
        test_file=$(find "$SOURCE_DIR" -name "*.gif" | head -1)
        filename=$(basename "$test_file" .gif)
        
        echo -e "${BLUE}📄 Test file: $(basename "$test_file")${NC}"
        
        # Method 1: Standard conversion with -coalesce and -loop 0
        echo -e "${YELLOW}🔄 Method 1: Standard with infinite loop${NC}"
        $CONVERT_CMD "$test_file" -coalesce -loop 0 "$test_dir/${filename}_standard.gif"
        
        # Method 2: Preserve original loop (if any) then override
        echo -e "${YELLOW}🔄 Method 2: Force infinite loop override${NC}"
        $CONVERT_CMD "$test_file" -coalesce -loop 0 "$test_dir/${filename}_forced.gif"
        
        # Check results
        echo ""
        echo -e "${GREEN}✅ Test files created in $test_dir/${NC}"
        ls -la "$test_dir"
        
        echo ""
        echo -e "${BLUE}🔍 Checking GIF loop settings:${NC}"
        for gif_file in "$test_dir"/*.gif; do
            echo -e "${YELLOW}$(basename "$gif_file"):${NC}"
            $CONVERT_CMD identify -verbose "$gif_file" | grep -i loop || echo "  No loop info found"
        done
        
        echo ""
        echo -e "${YELLOW}💡 Test files are in the '$test_dir' directory${NC}"
        echo -e "${YELLOW}💡 You can delete this directory when done: rm -rf $test_dir${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Analysis complete!${NC}"
echo ""
echo -e "${BLUE}💡 Key points about WebP to GIF conversion:${NC}"
echo "• WebP files may or may not have explicit loop settings"
echo "• -coalesce ensures proper frame handling for animated WebPs"
echo "• -loop 0 forces infinite looping in output GIFs"
echo "• This combination works regardless of input WebP loop settings"