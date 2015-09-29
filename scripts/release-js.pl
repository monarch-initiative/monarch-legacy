#!/usr/bin/perl -w
####
#### Make ready to release the JS into the staging area.
#### Also produce revisioned and minified versions in the staging area.
#### See 'perldoc <this_file>' for usage and flags.
####

use utf8;
use strict;
use Template;
use File::Basename;
use Cwd;
use vars qw(
	     $opt_h
	     $opt_v
	     $opt_i
	     $opt_o
	     $opt_n
	     $opt_d
	     $opt_r
	     $opt_u
	  );
use Getopt::Std;


## Since internal checks are done, get ready for user input.
getopts('hvi:o:n:d:r:u');

## Embedded help through perldoc.
if( $opt_h ){
  system('perldoc', __FILE__);
  exit 0;
}

## Check our options.
ll("Will print verbose messages.");

## Should only be run in the top directory.
if ( ! -f "./scripts/release-js.pl" ){
  ll("This does not seem to be the correct base directory!");
  ll("Please run this script from the base like: ./scripts/release-js.pl");
  exit 0;
}

## Make sure we have the necessary flags to get our input and output
## in the right places.
die "need -i option--use -h flag for help" if ! $opt_i;
die "need -o option--use -h flag for help" if ! $opt_o;
die "need -n option--use -h flag for help" if ! $opt_n;
die "need -d option--use -h flag for help" if ! $opt_d;
die "need -r option--use -h flag for help" if ! $opt_r;
# $opt_u will be 1 or 0.

###
### Get oriented.
###

my $base = getcwd();
ll('Base: ' . $base);
my $file_map_fname = $base . '/' . $opt_i;
my $bundle_output_fname = $base . '/' . $opt_o;
ll('Bundle output: ' . $bundle_output_fname);
my $namespace = $opt_n;
ll('Namespace: ' . $namespace);
my $version_info_dest_fname =  $base . '/' . $opt_d;
ll('Version info destination: ' . $version_info_dest_fname);
my $revision = $opt_r;
ll('Revision: ' . $revision);

## Verify what we can.
if( ! -f $file_map_fname ){
  die "Could not find file map";
}else{
  ll("Input map: " . $file_map_fname);
}

###
### Generate the version file and put it in the right place.
###

## Generate a release date.
my ($rday, $rmonth, $ryear) = (localtime)[3,4,5];
my $release = sprintf "%.4d%.2d%.2d", $ryear+1900, $rmonth+1, $rday;
version_to_js($revision, $release, $namespace, $version_info_dest_fname);

###
### Now we're going to try grabbing all of the mapped JS files and tossing
### them into a single file.
###

## Open final target.
my $exported_file_count = 0;
open(OUTFILE, ">$bundle_output_fname") or
  die "cannot open $bundle_output_fname: $!";

## Cycle through all of the mapped filenames.
open(MAPFILE, "<$file_map_fname") or die "cannot open $file_map_fname: $!";
while( my $js_file_fname = <MAPFILE> ){

  ## Allow for comments ("#", ";;", and "//") in the mapping file.
  if( $js_file_fname !~ /^\#/ &&
      $js_file_fname !~ /^\;\;/ &&
      $js_file_fname !~ /^\/\// ){

    ## Go through each js file line by line.
    open(JSFILE, "<$js_file_fname") or die "cannot open $js_file_fname: $!";
    while( <JSFILE> ){

      ## TODO?: Remove bbop.core.require lines from the input?

      ## Dump to target site.
      print OUTFILE $_;
    }
    $exported_file_count++;
    close(JSFILE);
  }
}

close(MAPFILE);
close(OUTFILE);

ll("Created JS lib file: ". $bundle_output_fname .
   ' with '. $exported_file_count .' files(s).');

###
### Try to transform our single file into minified/versioned versions.
###

## Transform the original name into the various release files.
my($base_fname, $base_dirs, $base_suff) =
  fileparse($bundle_output_fname,qr/\.[^.]*/);

## Define the three other (four total) variations: versioned, base
## minified, and versioned minified.
my $versioned_fname = $base_dirs . $base_fname . '_' . $revision . $base_suff;
my $mini_fname = $base_dirs . $base_fname . '.min' . $base_suff;
my $versioned_mini_fname =
  $base_dirs . $base_fname . '_' . $revision . '.min' . $base_suff;

ll('Staging (base): ' . $bundle_output_fname);

ll('Staging (base, versioned): ' . $versioned_fname);
force_copy($bundle_output_fname, $versioned_fname);

## Minify on option or not.
if( $opt_u ){
  ll('Skipping minified versions.');
}else{
  ll('Staging (base, minified): ' . $mini_fname);
  make_compressed_js($bundle_output_fname, $mini_fname);

  ll('Staging (base, versioned, minified): ' . $versioned_mini_fname);
  force_copy($mini_fname, $versioned_mini_fname);
}


###
### Helper functions.
###

## Create a JS file: version.js
sub version_to_js {

  ## Incoming argument is the version.
  my $revision = shift || die 'wot? we need a revision argument';
  my $release = shift || die 'wot? we need a release argument';
  my $namespace = shift || die 'wot? we need a namespace argument';
  my $dirs = shift || die 'wot? we need a location argument';

  my $location = $dirs . '/version.js';

  ## If the file is already there, blow it away.
  unlink $location if -f $location;
  open(FILE, ">$location") or die "cannot open $location: $!";

  ## Template to string output.
  my $output = '';
  my $tt = Template->new();
  $tt->process('scripts/version.js',
	       {
		namespace => $namespace,
		revision => $revision,
		release => $release,
	       },
	       \$output)
    || die $tt->error;
  print FILE $output;

  ## Close file.
  close(FILE);
  make_readable($location);
  ll("Created release version file: \"$location\".");
}


##
sub force_copy {

  my $from = shift || die "no first arg";
  my $to = shift || die "no second arg";

  #my @args = ("cp", "-r", "-f", $from, $to);
  my @args = ("rsync", "-r",
	      "--exclude=.svn",
	      "--exclude=.emacs.desktop",
	      $from, $to);
  ll("System: \"@args\"");
  system(@args) == 0 || die "System \"@args\" failed: $?";
}

##
sub make_readable {

  my $file = shift || die "no first arg";

  my @args = ("chmod", "644", $file);
  ll("System: \"@args\"");
  system(@args) == 0 || die "System \"@args\" failed: $?";
}

## TODO/BUG: ALPHAish experiment.
sub make_compressed_js {

  my $in_file = shift || die "no first arg";
  my $out_file = shift || die "no second arg";

  #my @args = ("shrinksafe", $in_file, ">", $out_file);
  my @args = ("node_modules/.bin/yuicompressor", "--nomunge", "--type", "js",
	      "-o", $out_file, $in_file);
  ll("System: \"@args\"");
  system(@args) == 0 || die "System \"@args\" failed: $?";
}

## Just a little printin' when feeling verbose.
sub ll {
  my $str = shift || '';
  print $str . "\n" if $opt_v;
}

# ## Just a little printin' when feeling afraid.
# sub ww {
#   my $str = shift || '';
#   print STDERR $str . "\n";
# }


=head1 NAME

release-js.pl

=head1 SYNOPSIS

release-js.pl [-h] [-v] -i <path> -o <output directory/name (full path) for the release> -n <namespace to use in the version file> -d <version.js file destination>

=head1 DESCRIPTION

This is the main AmiGO installation script--it moves files to the
proper location with the proper permissions.

Please see README.txt and INSTALL.txt for more details.

=head1 OPTIONS

=over

=item -v

Enable more verbose messages. This is useful for checking installation errors.

=item -h

Print this help message.

=item -i <path>

Full path to the input map. This file contains the location of the
files to release, one per line and relative to the base of the
checkout.

=item -o <path>

Full path for the location of the JS release bundle file. This will be
modified for minification and versioning.

=item -n <JS namespace>

The namespace of the versioning file. ".version" will be added to the
end of it.

=item -d <path>

The destination of the version file.

=item -r <version number>

The major.minor version number to use (e.g. "0.9", "1.2").

=item -u

Skip making the minified version, and only create the uncompressed
version.

=back

=head1 SEE ALSO

http://wiki.geneontology.org/index.php/AmiGO_2

=cut
