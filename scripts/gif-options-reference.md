# ImageMagick WebP to GIF Conversion Options Reference

## Loop Count Options

| Option | Description |
|--------|-------------|
| `-loop 0` | **Infinite loop** (default in our scripts) |
| `-loop 1` | Loop once (play twice total) |
| `-loop 5` | Loop 5 times (play 6 times total) |
| `-loop -1` | No looping (play once) |

## WebP Animation Handling

### Input WebP Loop Preservation
```bash
# Read WebP loop info and preserve it
magick input.gif output.gif

# Force infinite loop regardless of WebP setting (recommended)
magick input.gif -loop 0 output.gif

# Proper animated WebP handling with infinite loop
magick input.gif -coalesce -loop 0 output.gif
```

### Key WebP Options
| Option | Purpose |
|--------|---------|
| `-coalesce` | **Essential for animated WebPs** - properly handles frame sequences |
| `-loop 0` | Forces infinite looping in output GIF |
| `-dispose background` | Clears frames properly (optional) |

## Quality and Optimization Options

### Basic Quality Control
```bash
# High quality (larger file size)
magick input.gif -loop 0 -quality 90 output.gif

# Balanced quality/size (recommended)
magick input.gif -loop 0 -quality 75 output.gif

# Smaller file size (lower quality)
magick input.gif -loop 0 -quality 50 output.gif
```

### Color Optimization
```bash
# Reduce colors to 256 (standard GIF)
magick input.gif -loop 0 -colors 256 output.gif

# Reduce colors for smaller file size
magick input.gif -loop 0 -colors 128 output.gif

# Optimize for web (recommended for exercise gifs)
magick input.gif -coalesce -loop 0 -colors 256 -layers optimize output.gif
```

### Size Optimization
```bash
# Resize to specific width (maintains aspect ratio)
magick input.gif -loop 0 -resize 400x output.gif

# Resize to specific dimensions (may distort)
magick input.gif -loop 0 -resize 400x300! output.gif

# Resize only if larger than specified dimensions
magick input.gif -loop 0 -resize 400x300> output.gif
```

## Advanced Options for Exercise GIFs

### Smooth Animation
```bash
# Add slight delay between frames (in centiseconds)
magick input.gif -loop 0 -delay 10 output.gif

# Variable delay (useful for pause at exercise completion)
magick input.gif -loop 0 -delay 5 -delay 20 output.gif
```

### Optimize for Web
```bash
# Complete optimization command
magick input.gif \
  -coalesce \
  -loop 0 \
  -resize 300x300> \
  -colors 256 \
  -layers optimize \
  -delay 8 \
  output.gif
```

## Current Script Settings

Our conversion scripts use:
- **ImageMagick**: `magick input.gif -coalesce -loop 0 output.gif`
- **ffmpeg**: `ffmpeg -stream_loop -1 -i input.gif -t 2 -loop 0 output.gif`

### What These Options Do:
- **`-coalesce`**: Ensures proper frame handling for animated WebPs
- **`-loop 0`**: Forces infinite looping in output GIF
- **`-stream_loop -1`**: (ffmpeg) Repeats input during processing
- **`-t 2`**: (ffmpeg) Limits duration to prevent infinite processing

Both settings create **infinitely looping GIFs** regardless of the input WebP loop settings!

## File Size Comparison

| Setting | Typical Size | Quality | Use Case |
|---------|-------------|---------|----------|
| Default | ~40-80KB | High | Exercise demonstrations |
| -colors 128 | ~25-50KB | Good | Web thumbnails |
| -resize 200x + -colors 128 | ~15-30KB | Fair | Mobile previews |

## Testing Loop Settings

To verify your GIF loops infinitely, you can:
1. Open it in a web browser
2. Use `magick identify -verbose output.gif | grep -i loop`
3. Check in your app - the animation should repeat continuously
4. Use our WebP loop checker: `./scripts/webp-loop-checker.sh`

## WebP Loop Analysis

Use the WebP loop checker script to:
- Analyze original WebP loop settings
- Test conversion methods
- Verify infinite looping is properly applied

```bash
./scripts/webp-loop-checker.sh
```

This will help you understand if your WebP files have existing loop settings and confirm that the conversion creates infinitely looping GIFs.