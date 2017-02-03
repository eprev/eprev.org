#!/bin/bash

echo "Hashing..."
for f in *.gif; do
  f_ext=${f##*.}
  f_hash=$(md5 -q $f)
  f_name=${f%%.*}
  if [ "$f_hash" != "$f_name" ]; then
    echo "  $f"
    mv "$f" "$f_hash.$f_ext"
  fi
done

echo "Making frames..."
for f in *.gif; do
  f_png=${f%%.*}.png
  if [ ! -f "$f_png" ]; then
    echo "  $f"
    convert "$f[0]" "$f_png"
  fi
done

echo "Generating markup..."
for f in *.gif; do
  if ! grep -Fq "$f" index.html; then
    f_png=${f%%.*}.png
    f_ratio=$(identify -format "%[fx:100*h/w]%%" $f_png)
    echo "<div style=\"padding-top: $f_ratio;\"><img src=\"/gif/$f_png\" data-src=\"/gif/$f\" alt=\"\"></div>"
  fi
done
