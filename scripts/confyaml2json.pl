#!/usr/bin/perl -w
####
#### ...
####

use utf8;
use strict;
use Config::YAML;
use JSON::XS;
# use File::Basename;
# use File::Find;
use Cwd;
# use Data::Dumper;
# use Date::Parse;
# use Clone;

use vars qw(
	     $opt_v
	     $opt_h
	     $opt_i
	  );
use Getopt::Std;

## Since internal checks are done, get ready for user input.
getopts('vhi:');

## Embedded help through perldoc.
if( $opt_h ){
  system('perldoc', __FILE__);
  exit 0;
}

## Make sure we have the necessary flags to get our input and output
## in the right places.
die "need -i option--use -h flag for help" if ! $opt_i;

## Check our options.
ll("Will print verbose messages.");

###
### Get oriented.
###

my $base = getcwd();
ll('Base: ' . $base);
my $input_dir_fname = $base . '/' . $opt_i;
ll('Input directory: ' . $input_dir_fname);
# my $output_fname = $base . '/' . $opt_o;
# ll('Output file: ' . $output_fname);

## Verify what we can.
if( -r $input_dir_fname && -d $input_dir_fname ){
  ll("Input file: " . $input_dir_fname);
}else{
  die "Could not find input bundle";
}

###
### Slurp all *config.yaml files at this location and jimmy into a
### useable hash.
###

##
my @yaml_confs = <$input_dir_fname/*config.yaml>;
ll("YAML config files found: " . join(', ', @yaml_confs));

## Get all of the YAML files into a single data structure.
my $rethash = {};
foreach my $yaml_conf (@yaml_confs){
  ## Read the config and pull the id.
  my $conf_hash = Config::YAML->new(config => $yaml_conf);
  my $conf_id = $conf_hash->{id};

  ## Make sure that the top level hash the required fields.
  $rethash->{ $conf_id } =
    merge({
	   id => $conf_id,
	   searchable_extension => "_searchable",
	   weight => 0,
	   document_category => "",
	   boost_weights => "",
	   result_weights => "",
	   filter_weights => ""
	  }, $conf_hash);

  ## Also make sure that the default fields are there properly for
  ## each config.
  my $new_fields_hash = {};
  my $new_fields = [];
  foreach my $field (@{$rethash->{$conf_id}{fields}}){
    my $new_bit = merge({
			 required => 'false',
			 cardinality => 'single',
			 searchable => 'false',
			 indexed => 'true',
			 transform => []
			}, $field);
    $new_fields_hash->{$field->{'id'}} = $new_bit; # id better be defined...
    push @$new_fields, $new_bit;
  }
  $rethash->{$conf_id}{fields_hash} = $new_fields_hash;
  $rethash->{$conf_id}{fields} = $new_fields;
}

###
### Conf to JSON.
###

my $js = JSON::XS->new()->pretty(1);
#$js->allow_bignum(1); # if needed, go back to ::PP
my $js_str = $js->encode($rethash);
#chomp $js_str;

## If the file is already there, blow it away.
#unlink $output_fname if -f $output_fname;
#open(OUTFILE, ">$output_fname") or die "Cannot open $output_fname: $!";
#print OUTFILE $js_str;
#close(OUTFILE);
print STDOUT $js_str;

###
### Helper functions.
###

## Just a little printin' when feeling verbose.
sub ll {
  my $str = shift || '';
  print STDERR $str . "\n" if $opt_v;
}

## Merge two hashes together.
sub merge {

  my $self = shift;
  my $default_hash = shift || {};
  my $in_hash = shift || {};

  ##
  my $ret_hash = {};

  ## For defined in default, incoming over default.
  foreach my $key (keys %$default_hash){
    if( defined $in_hash->{$key} ){
      $ret_hash->{$key} = $in_hash->{$key};
    }else{
      $ret_hash->{$key} = $default_hash->{$key};
    }
  }

  ## For undefined in default, just use incoming.
  foreach my $key (keys %$in_hash){
    if( ! defined $default_hash->{$key} ){
      $ret_hash->{$key} = $in_hash->{$key};
    }
  }

  return $ret_hash;
}

###
### Documentation.
###

=head1 NAME

confyaml2json.pl

=head1 SYNOPSIS

confyaml2json.pl [-h] [-v] -i <input directory/name (full path)>

=head1 DESCRIPTION

Converts a directory of GOlr-esque metadata config files to a JSON
blob.

=head1 OPTIONS

=over

=item -v

Enable more verbose messages.

=item -h

Print this help message.

=item -i <path>

Full path for the location of the YAML config metadata directory.

=back

=head1 SEE ALSO

https://github.com/monarch-initiative/monarch-app

=cut
