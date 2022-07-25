;; -*- mode: lisp; -*-

(:root ".")
(:directory "./../slides/")
(:filename-style :directory)
(:htmlizer reveal::html)
(:title :auto)

(:preprocessors
 monkeylib-yamp::images
 reveal::wrap-code
 reveal::fragments
 reveal::tdc
 reveal::h2-repl)
