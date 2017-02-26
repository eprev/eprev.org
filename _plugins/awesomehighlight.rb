module Jekyll
  module Tags

    class AwesomeHighlightBlock < Liquid::Block
      include Liquid::StandardFilters

      # The regular expression syntax checker. Start with the language specifier.
      # Follow that by zero or more space separated options that take one of three
      # forms: name, name=value, or name="value"
      SYNTAX = %r!^([a-zA-Z0-9.+#_-]+)((\s+\w+(=(\w+|"[^"]*"))?)*)$!

      def initialize(tag_name, markup, tokens)
        super
        if markup.strip =~ SYNTAX
          @lang = Regexp.last_match(1).downcase
          @highlight_options = parse_options(Regexp.last_match(2))
        else
          raise SyntaxError, <<-eos
Syntax Error in tag 'highlight' while parsing the following markup:

  #{markup}

Valid syntax: highlight <lang> [linenos] [caption="..."]
eos
        end
      end

      def render(context)
        prefix = context["highlighter_prefix"] || ""
        suffix = context["highlighter_suffix"] || ""
        code = super.to_s.gsub(%r!\A(\n|\r)+|(\n|\r)+\z!, "")

        if @lang === 'make'
          code.gsub!('    ', "\t")
          code += "\n"
        end
        output = render_rouge(code)
        if @lang === 'make'
          output.gsub!("\t", '    ')
        end

        rendered_output = add_code_tag(output)
        prefix + rendered_output + suffix
      end

      private

      def parse_options(input)
        options = {}
        unless input.empty?
          # Split along 3 possible forms -- key="value", key=value, or key
          input.scan(%r!(?:\w="[^"]*"|\w=\w|\w)+!) do |opt|
            key, value = opt.split("=")
            # If a quoted list, convert to array
            if value && value.include?("\"")
              value.delete!('"')
            end
            options[key.to_sym] = value || true
          end
        end
        if options.key?(:linenos) && options[:linenos] == true
          options[:linenos] = "inline"
        end
        options
      end

      def render_rouge(code)
        Jekyll::External.require_with_graceful_fail("rouge")
        formatter = Rouge::Formatters::HTML.new(
          :line_numbers => @highlight_options[:linenos],
          :wrap         => false
        )
        lexer = Rouge::Lexer.find_fancy(@lang, code) || Rouge::Lexers::PlainText
        formatter.format(lexer.lex(code))
      end

      def add_code_tag(code)
        html  = "<figure class=\"highlight highlight--lang-#{@lang}\"><pre class=\"scrollable\"><code>#{code.chomp}</code></pre>"
        html +=   "<figcaption>#{@highlight_options[:caption]}</figcaption>" if @highlight_options[:caption]
        html += "</figure>"
        html
      end
    end

  end
end

Liquid::Template.register_tag("highlight", Jekyll::Tags::AwesomeHighlightBlock)
