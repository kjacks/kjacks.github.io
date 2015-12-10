
Title: City Planning Facilities Database Taxonomy Visualization Tool
Created by: Kirk Jackson
Last modified: November 25, 2015

Purpose: to visually display facilities in the SFPSD Database according to their classification heirarchy

Instructions for use:
1. save target dataset as a csv file
2. follow instructions within parser.py to parse this csv into heirarchical json
3. modify dataSource attribute in index.js to the name of the outputted JSON file

Browser Compatibility: Should be compatible with all modern browsers

Contents:
- parser.py
	A parser that takes a csv file as input and produces a nested JSON file according to D3's default data format (see Mike Bostock's flare.json) as output 
	Instructions for use included in comment section of this file

- SFPSD.csv
	The input data, a csv file generated from original RevisedSFPSD spreadsheet

- parsedSFPSD.json
	The output JSON file containing heirarchy of categories and facilities

- index.html
	The sole HTML document for the visualization tool - outlines the basic structure of document elements and incorporates javascript scripts and css stylesheets to implement interactive visualization

- js/index.js
	The primary Javascript document - contains all of the functions that implement the interactive tree

- css/style.css
	The primary stylesheet - contains all styling not executed by external stylesheets

- Third party javascript and css files
	bootstrap.min.css, bootstrap.min.js, glyphicons files
	d3.min.js, d3.layout.js
	jquery-2.1.4.min.js, jquery-ui.min.js



