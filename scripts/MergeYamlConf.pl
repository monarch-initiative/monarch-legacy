#!/usr/bin/perl

=head1  NAME 

MergeYamlConf.pl - Merge Yaml configurations using a base configuration
                   with fields that can be overriden by the input config

=head1 SYNOPSIS

TableGenerator.pl
         --input
         --reference
         --output
       [ --help ]

=head1 OPTIONS

<--input, -i>
   Input YAML file, used to override or add data to the
   reference yaml file

<--reference,-r>
   Reference YAML file, will be added to input if a key or field
   does not exist or is undefined

<--output,-o>
   Path to output file

<--help,-h>
    Print this help message.
                   
=head1 CONTACT

    Kent Shefchek
    kshefchek@gmail.com

=cut

use strict;
use Getopt::Long qw(:config no_ignore_case no_auto_abbrev pass_through);
use Config::YAML;
use Pod::Usage;

# Option Variables
my $input;
my $output;
my $reference;
my $help;

# Input
&GetOptions("input|i=s"       => \$input,
            "reference|ref=s" => \$reference,
            "output|o=s"      => \$output,
            "help|h"          => \$help
            ) || pod2usage();

## Display documentation
if ($help){
    pod2usage( {-exitval => 0, -verbose => 2, -output => \*STDERR} );
}

# Check options
&checkParameters($input, $reference, $output);

# Run
my $inputFile;
my $referenceFile;
my $outputFile;

open ($outputFile, ">$output") or die "Cannot open $output: $!";

my $inputHash = Config::YAML->new(config => $input,
                                  output => $output);
my $referenceHash = Config::YAML->new(config => $reference,
                                      output => $output);
my $mergedHash = merge($referenceHash, $inputHash);
my $newYaml = Config::YAML->new(config => $output);
$newYaml->fold($mergedHash);
$newYaml->write;

exit(0);

## Subroutines ##

## Merge two hashes together, based on merge sub in
## @ktlm's confyaml2json.pl with merging of fields list added
sub merge {

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

  ## Now merge fields list
  my $refFields = $default_hash->{'fields'};
  my $inputFields = $in_hash->{'fields'};

  foreach my $refField (@$refFields){
    my $isInHash = 0;
    if (defined $refField->{'id'}){
        
      foreach my $inputField (@$inputFields){
        if ($refField->{'id'} eq $inputField->{'id'}){
          $isInHash = 1;
        }
      }
      if (!$isInHash){
        push($ret_hash->{'fields'}, $refField);
      }
    }
  }

  return $ret_hash;
}

# checkParameters checks that the required parameters were passed,
sub checkParameters {

    my $input = shift;
    my $reference = shift;
    my $output = shift;

    # Check options
    if (!defined $input){
        die "--input is a required option";
    }
    if (!defined $reference){
        die "--reference is a required option";
    }
    if (!defined $output){
        die "--output is a required option";
    }
}

# log takes a string as input and prints it to the log file passed
# on the command line
sub log{
    my $logOut = shift;
    my $msg = shift;
    my $timestamp = localtime(time);
    if (defined $logOut){
        print $logOut "$timestamp: $msg\n";
    }else {
        print STDOUT "$timestamp: $msg\n";
    }
}

