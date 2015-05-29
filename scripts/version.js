/* 
 * Package: version.js
 * 
 * Namespace: [% namespace %].version
 * 
 * This package was automatically generated during the build process
 * and contains its version information--this is the release of the
 * API that you have.
 */

if ( typeof [% namespace %] == "undefined" ){ var [% namespace %] = {}; }
if ( typeof [% namespace %].version == "undefined" ){ [% namespace %].version = {}; }

/*
 * Variable: revision
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 */
[% namespace %].version.revision = "[% revision %]";

/*
 * Variable: release
 *
 * Partial version for this library: release (date-like) information.
 */
[% namespace %].version.release = "[% release %]";
