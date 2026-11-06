#!/usr/bin/env python3
"""Inline src/* into a single self-contained index.html."""
import pathlib
root = pathlib.Path(__file__).parent
src = root / "src"
css = (src / "style.css").read_text()
libs = "\n".join((src / f).read_text() for f in ["engine.js", "data.js", "art.js", "audio.js"])
app = "\n".join((src / f).read_text() for f in ["app-core.js", "app-ui.js", "app-settings.js", "app-game.js"])
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<title>Gembound Kingdom</title>
<meta name="description" content="Gembound Kingdom — an original fantasy match-3 puzzle adventure. Free, no login, works offline.">
<meta name="theme-color" content="#2a1a5a">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Gembound">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Fredoka:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<div id="app">
  <nav id="sidebar" aria-label="Main navigation"></nav>
  <main id="main">
    <header id="topbar"></header>
    <section id="scr-home" class="screen" aria-label="Home"></section>
    <section id="scr-map" class="screen" aria-label="Kingdom map"></section>
    <section id="scr-page" class="screen"></section>
    <section id="scr-game" class="screen" aria-label="Puzzle"></section>
    <nav id="tabbar" aria-label="Tabs"></nav>
  </main>
</div>
<div id="modal-root"></div>
<div id="toast-root" aria-live="polite"></div>
<div id="sr-live" class="sr" aria-live="assertive"></div>
<noscript>Gembound Kingdom needs JavaScript to run.</noscript>
<script>
{libs}
</script>
<script>
(function(){{"use strict";
{app}
}})();
</script>
</body>
</html>
"""
out = root

(out / "index.html").write_text(html)
print("built", len(html) // 1024, "KB")
