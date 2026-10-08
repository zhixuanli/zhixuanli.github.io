# frozen_string_literal: true

STDOUT.sync = true

repo_root = File.expand_path("..", __dir__)
Dir.chdir(repo_root)

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8
ENV["BUNDLE_GEMFILE"] ||= File.join(repo_root, "Gemfile")
ENV["LANG"] = "en_US.UTF-8"
ENV["LC_ALL"] = "en_US.UTF-8"

require "bundler/setup"
require "find"

# Hawkins loads EventMachine during plugin initialization. The precompiled
# Windows extension bundled with this legacy stack is not loadable on Ruby 2.7.
require "em/pure_ruby"

# Jekyll's top-level filters file expects these modules to be loaded by a
# directory glob. Preloading them avoids unstable glob ordering on Windows.
require "jekyll/filters/date_filters"
require "jekyll/filters/grouping_filters"
require "jekyll/filters/url_filters"
require "jekyll"
require "mercenary"

def require_gem_tree(gem_name, relative_dir)
  spec = Gem.loaded_specs[gem_name] || Gem::Specification.find_by_name(gem_name)
  base = File.join(spec.full_gem_path, relative_dir)
  return unless Dir.exist?(base)

  ruby_files = []
  Find.find(base) { |path| ruby_files << path if path.end_with?(".rb") }
  ruby_files.sort_by! { |path| [path.split(%r{[/\\]}).length, path] }
  ruby_files.each do |path|
    require path
  end
rescue Gem::LoadError
  nil
end

require_gem_tree("liquid", "lib/liquid/tags")
require_gem_tree("jekyll", "lib/jekyll/commands")
require_gem_tree("jekyll", "lib/jekyll/converters")
require_gem_tree("jekyll", "lib/jekyll/drops")
require_gem_tree("jekyll", "lib/jekyll/filters")
require_gem_tree("jekyll", "lib/jekyll/generators")
require_gem_tree("jekyll", "lib/jekyll/readers")
require_gem_tree("jekyll", "lib/jekyll/tags")

if defined?(Jekyll::Commands) && defined?(Jekyll::Command) &&
   !defined?(Jekyll::Commands::Command)
  Jekyll::Commands.const_set(:Command, Jekyll::Command)
end

if defined?(Jekyll::Converters::Scss)
  module Jekyll
    module Converters
      class Scss
        alias_method :sass_load_paths_without_windows_compat, :sass_load_paths

        def sass_load_paths
          paths = user_sass_load_paths + [sass_dir_relative_to_site_source, sass_dir]
          paths = paths.map { |path| Jekyll.sanitized_path(site_source, path) } if safe?

          expanded = []
          Dir.chdir(site_source) do
            paths.each do |path|
              absolute = File.expand_path(path)
              expanded << absolute if File.directory?(absolute)

              Dir.glob(path).each do |match|
                expanded << (safe? ? Jekyll.sanitized_path(site_source, match) : File.expand_path(match))
              end
            rescue SystemCallError
              next
            end
          end

          expanded.uniq.select { |path| File.directory?(path) }
        rescue StandardError
          sass_load_paths_without_windows_compat
        end
      end
    end
  end
end

if defined?(Sass::Importers::Filesystem)
  module Sass
    module Importers
      class Filesystem
        alias_method :find_real_file_without_windows_compat, :find_real_file

        def find_real_file(dir, name, options)
          find_real_file_by_checking_candidates(dir, name, options) ||
            find_real_file_without_windows_compat(dir, name, options)
        end

        private

        def find_real_file_by_checking_candidates(dir, name, options)
          dir = dir.tr("\\", "/")
          name = name.tr("\\", "/")
          relative_name = remove_root(name)
          dirname, basename, extname = split(relative_name)

          candidates = []
          if extname && extensions[extname]
            syntax = extensions[extname]
            ext = extensions.invert[syntax]
            candidates << [File.join(dir, dirname, "_#{basename}.#{ext}"), syntax]
            candidates << [File.join(dir, dirname, "#{basename}.#{ext}"), syntax]
          else
            extensions.sort.each do |ext, syntax|
              candidates << [File.join(dir, dirname, "_#{basename}.#{ext}"), syntax]
              candidates << [File.join(dir, dirname, "#{basename}.#{ext}"), syntax]
            end
          end

          candidates.each do |path, syntax|
            clean = Sass::Util.cleanpath(path).to_s
            return [clean, syntax] if File.file?(clean)
          end

          index_dir = File.join(dir, relative_name)
          return unless split(name)[2].nil? && File.directory?(index_dir)

          find_real_file_by_checking_candidates(index_dir, "index", options)
        end
      end
    end
  end
end

Jekyll::PluginManager.require_from_bundler
Jekyll::Deprecator.process(ARGV)
ARGV << "build" if ARGV.empty?

Mercenary.program(:jekyll) do |p|
  p.version Jekyll::VERSION
  p.description "Jekyll is a blog-aware, static site generator in Ruby"
  p.syntax "jekyll <subcommand> [options]"

  p.option "source", "-s", "--source [DIR]", "Source directory (defaults to ./)"
  p.option "destination", "-d", "--destination [DIR]",
    "Destination directory (defaults to ./_site)"
  p.option "safe", "--safe", "Safe mode (defaults to false)"
  p.option "plugins_dir", "-p", "--plugins PLUGINS_DIR1[,CONFIG_DIR2[,...]]",
    Array, "Plugins directory (defaults to ./_plugins)"
  p.option "layouts_dir", "--layouts DIR", String,
    "Layouts directory (defaults to ./_layouts)"
  p.option "profile", "--profile", "Generate a Liquid rendering profile"

  Jekyll::External.require_if_present(Jekyll::External.blessed_gems) do |gem, constraint|
    command = gem.split("-").last
    p.command(command.to_sym) do |c|
      c.syntax command
      c.action do
        Jekyll.logger.abort_with "You must install the '#{gem}' gem" \
          " version #{constraint} to use the 'jekyll #{command}' command."
      end
    end
  end

  Jekyll::Command.subclasses.each { |command| command.init_with_program(p) }

  p.action do |args, _|
    next unless args.empty? || !p.has_command?(args.first)

    Jekyll.logger.abort_with "fatal: 'jekyll #{args.first}' could not be found."
  end
end
