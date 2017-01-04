require 'nokogiri'

module Jekyll
  module SanitizeFilter
    def sanitizehtml(input)
      doc = Nokogiri::HTML::DocumentFragment.parse(input)
      doc.css('*').remove_attr('style')
      doc.css('*').remove_attr('class')
      doc.css('img').remove_attr('layout')
      doc.css('span').each do |span|
        span.replace span.inner_html
      end
      doc.to_html
    end
  end
end

Liquid::Template.register_filter(Jekyll::SanitizeFilter)