#!/usr/bin/perl -w
my $b = 0;
while(<>){
  $b = 1 if /\<\?xml/;
  if (/\<\/types\>/) { # Add the UUID type so Solr can autogenerate IDs
    print "    <fieldType name=\"uuid\" class=\"solr.UUIDField\" indexed=\"true\" />\n";
  } 
  if (/type=\"uuid\"/) {
    $_ = "    <field name=\"id\" type=\"uuid\" indexed=\"true\" stored=\"true\" default=\"NEW\"/>\n";
  } 
  print $_ if $b;
}
