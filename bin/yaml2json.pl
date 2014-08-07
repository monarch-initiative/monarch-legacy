#!/usr/bin/perl

package yaml2json;
BEGIN {
  $yaml2json::VERSION = '0.02';
} # make PodWeaver happy

use 5.010;
use strict;
use warnings;

use YAML::Syck; $YAML::Syck::ImplicitTyping = 1;
use JSON;

# VERSION

undef $/;

my $json = new JSON;
print $json->pretty->encode( Load(scalar <>) ); 

1;
#ABSTRACT: Convert YAML to JSON

__END__
=pod

=head1 NAME

yaml2json - Convert YAML to JSON

=head1 VERSION

version 0.02

=head1 AUTHOR

Steven Haryanto <stevenharyanto@gmail.com>

=head1 COPYRIGHT AND LICENSE

This software is copyright (c) 2011 by Steven Haryanto.

This is free software; you can redistribute it and/or modify it under
the same terms as the Perl 5 programming language system itself.

=cut
