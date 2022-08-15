;; -*- mode: lisp; -*-

(:root ".")
(:directory "./../slides/")
(:filename-style :directory)
(:htmlizer reveal::html)
(:title :auto)

(:preprocessors
 monkeylib-yamp:images
 reveal::wrap-code
 reveal::fragments
 reveal::tdc
 reveal::h2-repl)

(:dates
 (:programming . "2022-08-15")
 (:numbers . "2022-08-17")
 (:booleans . "2022-08-19")
 (:strings . "2022-08-21"))
