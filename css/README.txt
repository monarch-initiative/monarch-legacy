This README.txt file is mostly obsolete. Several of the CSS files have been obviated by the use of Bootstrap, or to provide more consistency between pages.

monarch-common.css
    This file controls the elements common to all monarch pages. Every webpage
    references this file.

    - General styles like fonts and clear div
    - Navbar styles that helps with responsive design using media queries
    - Content containers
    - Standardizes logos, colors, and button styles
    - Footer style

    This file ALSO controls all the main pages:
        (1) Diseases
        (2) Phenotypes
        (3) Genes
        (4) Genotype/model
    Every main page should reference this file.
    Use it to customize the main spotlight and the content layout.

monarch-specific.css
    This file controls all the specific pages:
        (1) Disease pages
        (2) Phenotype pages
        (3) Gene pages
        (4) Genotype/model pages

The remaining CSS files are page type specific.
    main.css
        This controls the home page (landing page).
    search_results.css
        This controls all search result pages.
    team.css
        This is a unique file for the Monarch Development Team
        static page.
    tour.css
        This file controls all other static pages (such as the about
        page, the publications page, and the glossary).
    annotate.css
        This file controls the marked up text in the Annotate Text service.
