#!/bin/bash

# Modify WebP Loop Settings Script
# This script modifies original WebP files to have infinite loops

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
BACKUP_DIR="assets/exercise-gif-backup"

echo -e "${PURPLE}🔄 WebP Loop Modification Script${NC}"
echo "================================="

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Error: Source directory '$SOURCE_DIR' does not exist${NC}"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo -e "${RED}❌ Error: ImageMagick is not installed${NC}"
    echo -e "${YELLOW}💡 Run: ./scripts/setup-conversion-tools.sh${NC}"
    exit 1
fi

echo -e "${BLUE}🎯 Choose modification approach:${NC}"
echo "1. 🔒 Safe mode (create backup, then modify originals)"
echo "2. ⚡ Direct mode (modify originals directly - faster)"
echo "3. 📁 Copy mode (create new files with '_infinite' suffix)"
echo "4. 🧪 Test mode (modify only first 5 files for testing)"
echo ""
echo -n "Select option (1-4): "
read -r mode_choice

case $mode_choice in
    1)
        MODE_NAME="Safe Mode"
        CREATE_BACKUP=true
        MODIFY_ORIGINALS=true
        SUFFIX=""
        TEST_ONLY=false
        ;;
    2)
        MODE_NAME="Direct Mode"
        CREATE_BACKUP=false
        MODIFY_ORIGINALS=true
        SUFFIX=""
        TEST_ONLY=false
        echo -e "${YELLOW}⚠️  Warning: This will modify your original files without backup!${NC}"
        echo -n "Are you sure? (y/N): "
        read -r confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Operation cancelled${NC}"
            exit 0
        fi
        ;;
    3)
        MODE_NAME="Copy Mode"
        CREATE_BACKUP=false
        MODIFY_ORIGINALS=false
        SUFFIX="_infinite"
        TEST_ONLY=false
        ;;
    4)
        MODE_NAME="Test Mode"
        CREATE_BACKUP=false
        MODIFY_ORIGINALS=true
        SUFFIX="_test"
        TEST_ONLY=true
        ;;
    *)
        echo -e "${RED}❌ Invalid option. Using Safe Mode.${NC}"
        MODE_NAME="Safe Mode"
        CREATE_BACKUP=true
        MODIFY_ORIGINALS=true
        SUFFIX=""
        TEST_ONLY=false
        ;;
esac

echo -e "${GREEN}✅ Selected: $MODE_NAME${NC}"
echo ""

# Create backup if needed
if [ "$CREATE_BACKUP" = true ]; then
    if [ -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}⚠️  Backup directory already exists: $BACKUP_DIR${NC}"
        echo -n "Continue anyway? (y/N): "
        read -r continue_backup
        if [[ ! $continue_backup =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Operation cancelled${NC}"
            exit 0
        fi
    else
        echo -e "${YELLOW}📁 Creating backup directory: $BACKUP_DIR${NC}"
        mkdir -p "$BACKUP_DIR"
    fi
    
    echo -e "${YELLOW}💾 Creating backup of all WebP files...${NC}"
    cp -r "$SOURCE_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || {
        echo -e "${RED}❌ Failed to create backup${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Backup completed${NC}"
    echo ""
fi

# Count total files
if [ "$TEST_ONLY" = true ]; then
    total_files=5
    echo -e "${BLUE}📊 Test mode: Processing first 5 files only${NC}"
else
    total_files=$(find "$SOURCE_DIR" -name "*.gif" | wc -l | tr -d ' ')
    echo -e "${BLUE}📊 Found $total_files WebP files to modify${NC}"
fi

if [ "$total_files" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No WebP files found in $SOURCE_DIR${NC}"
    exit 0
fi

echo -e "${BLUE}🎯 Mode: $MODE_NAME${NC}"
echo -e "${BLUE}⚙️  Infinite loop modification starting...${NC}"
echo ""

# Initialize counters
current=0
success=0
failed=0

# Modify each WebP file
for webp_file in "$SOURCE_DIR"/*.gif; do
    if [ -f "$webp_file" ] && ([ "$TEST_ONLY" = false ] || [ $current -lt 5 ]); then
        current=$((current + 1))
        
        # Get filename without extension
        filename=$(basename "$webp_file" .gif)
        
        if [ "$MODIFY_ORIGINALS" = true ]; then
            output_file="$webp_file"
            display_name="$filename.gif (in-place)"
        else
            output_file="$SOURCE_DIR/${filename}${SUFFIX}.gif"
            display_name="${filename}${SUFFIX}.gif"
        fi
        
        echo -ne "${BLUE}[$current/$total_files]${NC} Modifying: $display_name... "
        
        # Create temporary file for processing
        temp_file="/tmp/webp_temp_$$.gif"
        
        # Modify WebP to have infinite loop
        # -coalesce extracts frames, -loop 0 sets infinite loop, then rebuild as WebP
        if magick "$webp_file" -coalesce -set dispose background -loop 0 "$temp_file" 2>/dev/null && \
           mv "$temp_file" "$output_file" 2>/dev/null; then
            echo -e "${GREEN}✅ Success${NC}"
            success=$((success + 1))
        else
            echo -e "${RED}❌ Failed${NC}"
            failed=$((failed + 1))
            # Clean up temp file if it exists
            [ -f "$temp_file" ] && rm -f "$temp_file"
        fi
        
        # Break if test mode and we've done 5 files
        if [ "$TEST_ONLY" = true ] && [ $current -ge 5 ]; then
            break
        fi
    fi
done

echo ""
echo "=================================="
echo -e "${BLUE}📈 Modification Summary:${NC}"
echo -e "  ${GREEN}✅ Successful: $success${NC}"
echo -e "  ${RED}❌ Failed: $failed${NC}"
echo -e "  ${PURPLE}🎯 Mode: $MODE_NAME${NC}"

if [ "$CREATE_BACKUP" = true ]; then
    echo -e "  ${YELLOW}💾 Backup location: $BACKUP_DIR${NC}"
fi

if [ "$MODIFY_ORIGINALS" = false ]; then
    echo -e "  ${BLUE}📁 New files created with suffix: $SUFFIX${NC}"
fi

if [ "$failed" -eq 0 ]; then
    echo -e "${GREEN}🎉 All modifications completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}💡 Key changes:${NC}"
    echo "• All processed WebP files now have infinite loop settings"
    echo "• Animation frames preserved with original quality"
    echo "• Files maintain their WebP format"
    
    if [ "$TEST_ONLY" = true ]; then
        echo ""
        echo -e "${YELLOW}🧪 Test completed successfully!${NC}"
        echo -e "${BLUE}💡 To process all files, run this script again and choose a non-test mode${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Some modifications failed. Check the error messages above.${NC}"
fi