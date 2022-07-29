;;
;; Copyright (c) 2022, Peter Seibel. All rights reserved.
;;

(defsystem itp
  :name "itp"
  :description "Intro to Programming"
  :components
  ((:file "packages")
   (:file "html"        :depends-on ("packages")))
  :depends-on
  (:cl-ppcre
   :monkeylib-utilities
   :monkeylib-yamp))
