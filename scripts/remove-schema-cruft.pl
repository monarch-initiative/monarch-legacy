#!/usr/bin/perl -w
my $b = 0;
while(<>){
  $b = 1 if /\<\?xml/;
  print $_ if $b;
}
