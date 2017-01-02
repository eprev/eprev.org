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
        unless el.attr.has_key?('width') and el.attr.has_key?('height')
          raise ArgumentError, "Specify the size of the image element by providing a width and height attributes"
        end
        unless el.attr['layout'] == 'responsive'
          raise ArgumentError, "Only responsive layout is supported"
        end
        width = el.attr['width'].to_f
        height = el.attr['height'].to_f
        attr = el.attr.reject { |key| [:width, :height, :responsive].include? key.to_sym }
        output =  "<figure class=\"responsive-image\" style=\"max-width: #{ width.to_i }px\">"
        output <<   "<div style=\"padding-bottom: #{ (100 * height / width).round(2) }%\">"
        output <<      "<img#{html_attributes(attr)}>"
        output <<   "</div>"
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

module Jekyll
  module Tags
    class AwesomeHighlightBlock < HighlightBlock
      def add_code_tag(code)
        "<figure class=\"highlight\"><pre><code>#{code.chomp}</code></pre></figure>"
      end
    end
  end
end

Liquid::Template.register_tag("highlight", Jekyll::Tags::AwesomeHighlightBlock)
