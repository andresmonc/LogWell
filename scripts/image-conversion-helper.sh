#!/bin/bash

# Image Conversion Helper Script
# This script provides a menu-driven interface for converting WebP images to GIF

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

show_banner() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║        Image Conversion Helper        ║"
    echo "║       WebP → GIF Batch Converter      ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

show_status() {
    echo -e "${BLUE}📊 System Status:${NC}"
    echo "==================="
    
    # Check source directory
    if [ -d "assets/exercise-gif" ]; then
        file_count=$(find assets/exercise-gif -name "*.gif" | wc -l | tr -d ' ')
        echo -e "  ${GREEN}✅ Source directory: assets/exercise-gif ($file_count files)${NC}"
    else
        echo -e "  ${RED}❌ Source directory: assets/exercise-gif (not found)${NC}"
    fi
    
    # Check output directory
    if [ -d "assets/exercise-gif" ]; then
        gif_count=$(find assets/exercise-gif -name "*.gif" 2>/dev/null | wc -l | tr -d ' ')
        echo -e "  ${GREEN}✅ Output directory: assets/exercise-gif ($gif_count files)${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Output directory: assets/exercise-gif (will be created)${NC}"
    fi
    
    # Check tools
    echo -e "${BLUE}🛠️  Available Tools:${NC}"
    if command -v magick &> /dev/null || command -v convert &> /dev/null; then
        echo -e "  ${GREEN}✅ ImageMagick${NC}"
    else
        echo -e "  ${RED}❌ ImageMagick${NC}"
    fi
    
    if command -v ffmpeg &> /dev/null; then
        echo -e "  ${GREEN}✅ ffmpeg${NC}"
    else
        echo -e "  ${RED}❌ ffmpeg${NC}"
    fi
    
    if ! command -v brew &> /dev/null; then
        echo -e "  ${RED}❌ Homebrew (needed for tool installation)${NC}"
    else
        echo -e "  ${GREEN}✅ Homebrew${NC}"
    fi
    
    echo ""
}

show_menu() {
    echo -e "${BLUE}🚀 Available Actions:${NC}"
    echo "===================="
    echo "1. Install conversion tools (ImageMagick + ffmpeg)"
    echo "2. Convert using ImageMagick (standard quality)"
    echo "3. Convert using ImageMagick (optimized with quality options)"
    echo "4. Convert using ffmpeg (alternative)"
    echo "5. Modify original WebP files to have infinite loops"
    echo "6. Check WebP loop settings and test conversion"
    echo "7. Test single file conversion (debug)"
    echo "8. Show detailed file info"
    echo "9. Clean up output directory"
    echo "10. Exit"
    echo ""
    echo -n "Choose an option (1-10): "
}

install_tools() {
    echo -e "${YELLOW}🛠️  Installing conversion tools...${NC}"
    if [ -f "scripts/setup-conversion-tools.sh" ]; then
        ./scripts/setup-conversion-tools.sh
    else
        echo -e "${RED}❌ Setup script not found${NC}"
    fi
}

convert_imagemagick() {
    echo -e "${YELLOW}🔄 Converting with ImageMagick...${NC}"
    if [ -f "scripts/convert-gif-to-gif.sh" ]; then
        ./scripts/convert-gif-to-gif.sh
    else
        echo -e "${RED}❌ ImageMagick conversion script not found${NC}"
    fi
}

convert_optimized() {
    echo -e "${YELLOW}🔄 Converting with optimized ImageMagick...${NC}"
    if [ -f "scripts/convert-gif-to-gif-optimized.sh" ]; then
        ./scripts/convert-gif-to-gif-optimized.sh
    else
        echo -e "${RED}❌ Optimized conversion script not found${NC}"
    fi
}

convert_ffmpeg() {
    echo -e "${YELLOW}🔄 Converting with ffmpeg...${NC}"
    if [ -f "scripts/convert-gif-to-gif-ffmpeg.sh" ]; then
        ./scripts/convert-gif-to-gif-ffmpeg.sh
    else
        echo -e "${RED}❌ ffmpeg conversion script not found${NC}"
    fi
}

check_webp_loops() {
    echo -e "${YELLOW}🔍 Checking WebP loop settings...${NC}"
    if [ -f "scripts/webp-loop-checker.sh" ]; then
        ./scripts/webp-loop-checker.sh
    else
        echo -e "${RED}❌ WebP loop checker script not found${NC}"
    fi
}

modify_webp_loops() {
    echo -e "${YELLOW}🔄 Modifying WebP files to have infinite loops...${NC}"
    if [ -f "scripts/modify-gif-loops.sh" ]; then
        ./scripts/modify-gif-loops.sh
    else
        echo -e "${RED}❌ WebP modification script not found${NC}"
    fi
}

test_single_conversion() {
    echo -e "${YELLOW}🧪 Testing single file conversion...${NC}"
    if [ -f "scripts/test-single-conversion.sh" ]; then
        ./scripts/test-single-conversion.sh
    else
        echo -e "${RED}❌ Test conversion script not found${NC}"
    fi
}

show_file_info() {
    echo -e "${BLUE}📋 Detailed File Information:${NC}"
    echo "============================="
    
    if [ -d "assets/exercise-gif" ]; then
        echo -e "${YELLOW}WebP Files:${NC}"
        ls -la assets/exercise-gif/*.gif | head -10
        total_webp=$(find assets/exercise-gif -name "*.gif" | wc -l | tr -d ' ')
        if [ "$total_webp" -gt 10 ]; then
            echo "... and $((total_webp - 10)) more files"
        fi
        
        # Show total size
        total_size=$(du -sh assets/exercise-gif | cut -f1)
        echo -e "${BLUE}Total WebP size: $total_size${NC}"
    fi
    
    if [ -d "assets/exercise-gif" ]; then
        echo ""
        echo -e "${YELLOW}GIF Files:${NC}"
        ls -la assets/exercise-gif/*.gif 2>/dev/null | head -5 || echo "No GIF files found"
        
        if [ -n "$(ls -A assets/exercise-gif 2>/dev/null)" ]; then
            total_gif_size=$(du -sh assets/exercise-gif | cut -f1)
            echo -e "${BLUE}Total GIF size: $total_gif_size${NC}"
        fi
    fi
    echo ""
}

cleanup_output() {
    echo -e "${YELLOW}🧹 Cleaning up output directory...${NC}"
    if [ -d "assets/exercise-gif" ]; then
        echo -n "Are you sure you want to delete all GIF files? (y/N): "
        read -r confirmation
        if [[ $confirmation =~ ^[Yy]$ ]]; then
            rm -rf assets/exercise-gif
            echo -e "${GREEN}✅ Output directory cleaned${NC}"
        else
            echo -e "${BLUE}Operation cancelled${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Output directory doesn't exist${NC}"
    fi
    echo ""
}

main() {
    show_banner
    
    while true; do
        show_status
        show_menu
        
        read -r choice
        echo ""
        
        case $choice in
            1)
                install_tools
                ;;
            2)
                convert_imagemagick
                ;;
            3)
                convert_optimized
                ;;
            4)
                convert_ffmpeg
                ;;
            5)
                modify_webp_loops
                ;;
            6)
                check_webp_loops
                ;;
            7)
                test_single_conversion
                ;;
            8)
                show_file_info
                ;;
            9)
                cleanup_output
                ;;
            10)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option. Please choose 1-10.${NC}"
                ;;
        esac
        
        echo ""
        echo -e "${BLUE}Press Enter to continue...${NC}"
        read -r
        clear
    done
}

# Run the main function
main