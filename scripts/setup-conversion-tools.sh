#!/bin/bash

# Setup Conversion Tools Script
# This script installs the necessary tools for image conversion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️  Image Conversion Tools Setup${NC}"
echo "=================================="

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew is not installed${NC}"
    echo -e "${YELLOW}💡 Install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Homebrew is installed${NC}"

# Check and install ImageMagick
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}📦 Installing ImageMagick...${NC}"
    brew install imagemagick
    echo -e "${GREEN}✅ ImageMagick installed successfully${NC}"
else
    echo -e "${GREEN}✅ ImageMagick is already installed${NC}"
fi

# Check and install ffmpeg (alternative option)
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}📦 Installing ffmpeg (alternative conversion tool)...${NC}"
    brew install ffmpeg
    echo -e "${GREEN}✅ ffmpeg installed successfully${NC}"
else
    echo -e "${GREEN}✅ ffmpeg is already installed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete! You can now run the conversion script.${NC}"
echo -e "${BLUE}💡 Run: ./scripts/convert-gif-to-gif.sh${NC}"