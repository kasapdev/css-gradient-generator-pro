# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.1] - 2026-09-06

### Fixed

- Color stops could only be reordered by mouse drag-and-drop, with no
  keyboard equivalent — a real accessibility gap for keyboard-only and
  screen-reader users. The drag handle on each stop is now focusable
  (`tabindex="0"`, `role="button"`, with a descriptive `aria-label`) and
  supports <kbd>Arrow Up</kbd> / <kbd>Arrow Down</kbd> to move the stop
  up or down the list, with focus restored to the handle after the move
  so repeated key presses keep working without losing place.
