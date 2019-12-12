#!/bin/bash

outputName="output.mp4"
dimensions="8192x4096"
fps=30
inputPath="image-sequence/%07d.jpg"

# -i       is follwed by the path to the input video
# -r       sets the frame rate of the output video
# -s       scale the output video
# -c:v     sets the video codec you want to use libx264 or libx265 -tag:v hvc1
# -vf      sets so called video filters, like scale or setdar (aspect ratio)
# -crf     sets th constant rate ractor, should be between 18-28, lower is higher quality (x265, default CRF is 28)
# -b:v     sets the video bitrate, try around 30M for x264 and 15M for x256
# -pix_fmt sets the pixel format of the output video
ffmpeg \
  -i $inputPath \
  -r $fps \
  -vf scale=$dimensions \
  -c:v libx265 -tag:v hvc1 \
  -b:v 15M \
  -pix_fmt yuv420p \
  $outputName
