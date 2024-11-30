# Keyboard and mouse events architecture

This document describes the architecture of the keyboard navigation and mouse events in IronCalc Web

There are two modes for mouse events:

* Normal mode: clicking a cell selects it, clicking on a sheet opens it
* Browse mode: clicking on a cell updates the formula, etc

While in browse mode some mouse events might end the browse mode

We follow Excel's way of navigating a spreadsheet