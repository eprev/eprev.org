#!/bin/bash

dir=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd); dir=$(dirname $dir)

pushd $dir

echo "Hashing..."
for f in *.gif; do
  f_ext=${f##*.}
  f_hash=$(md5 -q $f)
  f_name=${f%%.*}
  if [ "$f_hash" != "$f_name" ]; then
    echo " - $f"
    mv "$f" "$f_hash.$f_ext"
  fi
done

echo "Making frames..."
for f in *.gif; do
  f_png=${f%%.*}.png
  if [ ! -f "$f_png" ]; then
    echo " - $f"
    convert "$f[0]" "$f_png"
  fi
done

echo "Generating markup..."
cat src/header.html > index.html
for f in *.gif; do
  f_png=${f%%.*}.png
  f_ratio=$(identify -format "%[fx:100*h/w]%%" $f_png)
  echo "<a href=\"/gif/$f\" target=\"_blank\" rel="noopener" style=\"padding-top: $f_ratio;\"><img src=\"/gif/$f_png\" data-src=\"/gif/$f\" alt=\"\"></a>" >> index.html
done
cat src/footer.html >> index.html

echo "All done!"
popd
