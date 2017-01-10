require "RMagick"

module Jekyll
  module Converters

    class Markdown::AwesomeMarkdown < Markdown::KramdownParser
      def convert(content)
        Kramdown::Document.new(content, @config).to_awesomeHtml
      end
    end

  end
end

module Kramdown
  class Converter::AwesomeHtml < Converter::Html

    alias :super_convert_p :convert_p
    def convert_p(el, indent)
      # Don't wrap responsive images into P
      if el.children.size == 1 and el.children.first.type == :img and el.children.first.attr.has_key?('layout')
        inner(el, indent)
      else
        super_convert_p(el, indent)
      end
    end

    alias :super_convert_img :convert_img
    def convert_img(el, indent)
      if el.attr.has_key?('layout')
        # If the given image element has layout attribute, then generate a particular markup which won't cause a reflow
        # and keep the aspect ratio
        unless el.attr['layout'] == 'responsive'
          raise ArgumentError, "Only responsive layout is supported"
        end
        if el.attr.has_key?('width') and el.attr.has_key?('height')
          width = el.attr['width'].to_f
          height = el.attr['height'].to_f
        else
          img = Magick::Image.read(File.join(options[:site_source], el.attr['src'])).first
          width = img.columns.to_f
          height = img.rows.to_f
        end
        if el.attr.has_key?('title')
          caption = el.attr['title']
        end
        if el.attr.has_key?('mod')
          mod = el.attr['mod']
        end
        attr = el.attr.reject { |key| [:width, :height, :responsive, :title, :mod].include? key.to_sym }
        output =  "<figure class=\"responsive-image#{ mod ? " responsive-image--" + mod : "" }\" style=\"max-width: #{ width.to_i }px\">"
        output <<   "<div style=\"padding-bottom: #{ (100 * height / width).round(2) }%\">"
        output <<      "<img#{html_attributes(attr)}>"
        output <<   "</div>"
        if caption
          output <<   "<figcaption>#{caption}</figcaption>"
        end
        output << "</figure>"
        output
      else
        super_convert_img(el, indent)
      end
    end

    def add_syntax_highlighter_to_class_attr(attr, lang = nil)
      # Don't add `language-*` to the class attribute
    end

  end
end
