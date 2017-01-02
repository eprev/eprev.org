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
      def convert_img(el, indent)
        if el.attr.has_key?('layout') and el.attr.has_key?('width') and el.attr.has_key?('height')
          width = el.attr['width'].to_f
          height = el.attr['height'].to_f
          attr = el.attr.reject { |key| [:width, :height, :responsive].include? key.to_sym }
          output =  "<div class=\"responsive-image\" style=\"max-width: #{width}px\">"
          output <<   "<div style=\"padding-bottom: #{ (100 * height / width).round(2) }%\">"
          output <<      "<img#{html_attributes(attr)}>"
          output <<   "</div>"
          output << "</div>"
          output
        else
          "<img#{html_attributes(el.attr)}>"
        end
      end
    end
end